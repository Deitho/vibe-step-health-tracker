import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import {
    calculateHasExercise,
    calculateDailyTarget,
    calculateDebt,
    resolveDebt
} from '@/utils/debt-engine';
import { DailyStats } from '@/lib/db';
import { format } from 'date-fns';

export async function POST(request: Request) {
    try {
        const secretHeader = request.headers.get('x-webhook-secret');
        const authHeader = request.headers.get('authorization')?.replace('Bearer ', '');
        const webhookSecret = request.headers.get('webhook-secret');
        const webhookSecretUnderscore = request.headers.get('webhook_secret');

        const providedSecret = secretHeader || authHeader || webhookSecret || webhookSecretUnderscore;

        if (providedSecret !== process.env.WEBHOOK_SECRET) {
            console.error('Unauthorized Webhook Call. Provided:', providedSecret, 'Expected:', process.env.WEBHOOK_SECRET ? 'SET' : 'MISSING');
            // Log all headers to help debug the HC Webhook app payload
            const headersList = Object.fromEntries(request.headers.entries());
            console.error('Received Headers:', headersList);

            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        let minTime = Infinity;
        let maxTime = -Infinity;
        const allDates = new Set<string>();

        // Helper to format any date to Turkey's YYYY-MM-DD
        const getTurkeyDateString = (dateInput: string | Date | number) => {
            try {
                const d = new Date(dateInput);
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: 'Europe/Istanbul',
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
                const parts = formatter.formatToParts(d);
                const year = parts.find(p => p.type === 'year')?.value;
                const month = parts.find(p => p.type === 'month')?.value;
                const day = parts.find(p => p.type === 'day')?.value;
                if (year && month && day) return `${year}-${month}-${day}`;
                return new Date().toISOString().split('T')[0];
            } catch (e) {
                return new Date().toISOString().split('T')[0];
            }
        };

        const processDate = (val: any) => {
            if (!val) return;
            const t = new Date(val).getTime();
            if (isNaN(t)) return;
            if (t < minTime) minTime = t;
            if (t > maxTime) maxTime = t;
            allDates.add(getTurkeyDateString(val));
        };

        const extractFromArr = (arr: any[]) => {
            if (!Array.isArray(arr)) return;
            arr.forEach(item => {
                processDate(item.start_time);
                processDate(item.end_time);
            });
        };

        extractFromArr(body.steps);
        extractFromArr(body.distance);
        extractFromArr(body.active_calories_burned);
        extractFromArr(body.total_calories_burned);
        extractFromArr(body.exercise);
        extractFromArr(body.exercise_session);

        const timestamp = body.timestamp || new Date().toISOString();
        if (allDates.size === 0) {
            processDate(timestamp);
        }

        // Fill date gaps between minTime and maxTime to ensure empty (deleted) days get overwritten with 0
        if (minTime !== Infinity && maxTime !== -Infinity) {
            let curr = minTime;
            while (curr <= maxTime) {
                allDates.add(getTurkeyDateString(curr));
                curr += 24 * 60 * 60 * 1000;
            }
        }

        const sortedDates = Array.from(allDates).sort();

        if (sortedDates.length === 0) {
            return NextResponse.json({ success: true, message: 'No valid dates found in payload' }, { status: 200 });
        }

        const results = [];

        // Sequentially process each date
        for (const dateStr of sortedDates) {
            let totalSteps = 0;
            let totalCalories = 0;

            // Steps
            if (Array.isArray(body.steps)) {
                const dSteps = body.steps.filter((s: any) => {
                    const matchStr = s.start_time ? getTurkeyDateString(s.start_time) : (s.end_time ? getTurkeyDateString(s.end_time) : null);
                    return matchStr === dateStr;
                });
                totalSteps = dSteps.reduce((acc: number, stepObj: any) => acc + (stepObj.count || 0), 0);
            }

            // Calories
            if (Array.isArray(body.active_calories_burned)) {
                const dCals = body.active_calories_burned.filter((s: any) => {
                    const matchStr = s.start_time ? getTurkeyDateString(s.start_time) : (s.end_time ? getTurkeyDateString(s.end_time) : null);
                    return matchStr === dateStr;
                });
                totalCalories = dCals.reduce((acc: number, calObj: any) => acc + (calObj.energy || calObj.kcal || calObj.count || calObj.value || 0), 0);
            } else if (Array.isArray(body.total_calories_burned)) {
                const dCals = body.total_calories_burned.filter((s: any) => {
                    const matchStr = s.start_time ? getTurkeyDateString(s.start_time) : (s.end_time ? getTurkeyDateString(s.end_time) : null);
                    return matchStr === dateStr;
                });
                totalCalories = dCals.reduce((acc: number, calObj: any) => acc + (calObj.energy || calObj.kcal || calObj.count || calObj.value || 0), 0);
            }

            // Exercise
            const exerciseArray = body.exercise || body.exercise_session;
            let currentBatchHasExercise = false;

            if (Array.isArray(exerciseArray)) {
                const dSessions = exerciseArray.filter((s: any) => {
                    const matchStr = s.start_time ? getTurkeyDateString(s.start_time) : (s.end_time ? getTurkeyDateString(s.end_time) : null);
                    return matchStr === dateStr;
                });
                for (const session of dSessions) {
                    // Ignore walking (type 79)
                    if (String(session.type) === "79") continue;

                    let durationSecs = session.duration_seconds;
                    if (durationSecs === undefined && session.start_time && session.end_time) {
                        const start = new Date(session.start_time).getTime();
                        const end = new Date(session.end_time).getTime();
                        durationSecs = Math.max(0, (end - start) / 1000);
                    }

                    if (durationSecs !== undefined && durationSecs >= 900) {
                        currentBatchHasExercise = true;
                        break;
                    }
                }
            }

            // Fallback simulation
            if (totalCalories === 0 && totalSteps > 5000) {
                totalCalories = Math.floor(totalSteps * 0.04);
            }

            // Fetch existing
            const { rows: existingRows } = await sql`SELECT * FROM daily_stats WHERE date = ${dateStr} LIMIT 1`;
            const existingRecord = existingRows[0];

            // Overwrite cleanly based on what arrays were provided. If an array cover this date range is given but with 0 matches for this specific date, it correctly sets 0.
            let newSteps = Array.isArray(body.steps) ? totalSteps : (existingRecord?.steps || 0);
            let newCalories = (Array.isArray(body.active_calories_burned) || Array.isArray(body.total_calories_burned)) ? totalCalories : (existingRecord?.calories || 0);

            let hasExercise = existingRecord?.has_exercise || false;
            if (Array.isArray(exerciseArray)) {
                hasExercise = currentBatchHasExercise;
            } else {
                hasExercise = hasExercise || currentBatchHasExercise;
            }

            const targetSteps = calculateDailyTarget(hasExercise);
            const debt = calculateDebt(newSteps, targetSteps);
            let status = debt > 0 ? 'PENDING' : 'COMPLETED';

            const currentStats: DailyStats = {
                id: existingRecord?.id || '',
                date: dateStr,
                steps: newSteps,
                calories: newCalories,
                has_exercise: hasExercise,
                target_steps: targetSteps,
                debt_steps: debt,
                status: status as any,
                debt_source_date: debt > 0 ? [dateStr] : [],
                created_at: new Date(),
                updated_at: new Date(),
            };

            // Process existing debts prior to this date
            if (newSteps > targetSteps) {
                const { rows: pendingDays } = await sql`
                    SELECT * FROM daily_stats 
                    WHERE status = 'PENDING' AND date < ${dateStr}
                    ORDER BY date ASC
                `;

                if (pendingDays.length > 0) {
                    const resolution = resolveDebt(currentStats, pendingDays as DailyStats[]);

                    currentStats.debt_steps = resolution.updatedCurrentStats.debt_steps;
                    currentStats.status = resolution.updatedCurrentStats.status;

                    for (const pd of resolution.updatedPendingDays) {
                        await sql`
                            UPDATE daily_stats 
                            SET debt_steps = ${pd.debt_steps}, status = ${pd.status}, updated_at = NOW()
                            WHERE id = ${pd.id}
                        `;
                    }
                }
            }

            // Upsert
            await sql`
                INSERT INTO daily_stats (
                    date, steps, calories, has_exercise, target_steps, debt_steps, status, debt_source_date, updated_at
                ) VALUES (
                    ${currentStats.date}, ${currentStats.steps}, ${currentStats.calories}, 
                    ${currentStats.has_exercise}, ${currentStats.target_steps}, ${currentStats.debt_steps}, 
                    ${currentStats.status}, ARRAY[${currentStats.date}]::date[], NOW()
                )
                ON CONFLICT (date) DO UPDATE SET
                    steps = EXCLUDED.steps,
                    calories = EXCLUDED.calories,
                    has_exercise = EXCLUDED.has_exercise,
                    target_steps = EXCLUDED.target_steps,
                    debt_steps = EXCLUDED.debt_steps,
                    status = EXCLUDED.status,
                    debt_source_date = EXCLUDED.debt_source_date,
                    updated_at = NOW()
            `;

            results.push(currentStats);
        }

        // Close previous weeks
        const todayStr = getTurkeyDateString(new Date());
        const today = new Date(todayStr); // Parses as midnight UTC, mathematically equivalent to today's start
        const dayOfWeek = today.getDay();
        const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        const monday = new Date(today);
        monday.setDate(monday.getDate() - diffToMonday);
        const currentWeekMondayStr = monday.toISOString().split('T')[0];

        await sql`
            UPDATE daily_stats
            SET status = 'FAILED', updated_at = NOW()
            WHERE status = 'PENDING' AND date < ${currentWeekMondayStr}
        `;

        return NextResponse.json({ success: true, processed_dates: sortedDates.length, dates: sortedDates, data_preview: results.length > 0 ? results[results.length - 1] : null });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
