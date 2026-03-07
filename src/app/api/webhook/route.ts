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

        let totalSteps = 0;
        let totalCalories = 0;
        let totalActiveMinutes = 0;
        const timestamp = body.timestamp || new Date().toISOString();

        // Sum up the step counts for TODAY
        if (Array.isArray(body.steps)) {
            const todayStr = format(new Date(timestamp), 'yyyy-MM-dd');
            const todaysSteps = body.steps.filter((s: any) => s.end_time?.startsWith(todayStr) || s.start_time?.startsWith(todayStr));

            // If the filter found today's steps, use them, otherwise fallback to all steps if no dates exist
            const stepsToCount = todaysSteps.length > 0 ? todaysSteps : body.steps;

            // Sum the counts (HC Webhook payload sends distinct time blocks, not cumulative duplicates)
            totalSteps = stepsToCount.reduce((acc: number, stepObj: any) => acc + (stepObj.count || 0), 0);
        }

        // Sum up calories if present
        if (Array.isArray(body.active_calories_burned)) {
            totalCalories = body.active_calories_burned.reduce((acc: number, calObj: any) => acc + (calObj.energy || calObj.kcal || calObj.count || calObj.value || 0), 0);
        } else if (Array.isArray(body.total_calories_burned)) {
            totalCalories = body.total_calories_burned.reduce((acc: number, calObj: any) => acc + (calObj.energy || calObj.kcal || calObj.count || calObj.value || 0), 0);
        }

        // Calculate active minutes from exercise or exercise_session if present
        const exerciseArray = body.exercise || body.exercise_session;
        if (Array.isArray(exerciseArray)) {
            const todayStr = format(new Date(timestamp), 'yyyy-MM-dd');
            const todaysSessions = exerciseArray.filter((s: any) => s.end_time?.startsWith(todayStr) || s.start_time?.startsWith(todayStr));
            const sessionsToCount = todaysSessions.length > 0 ? todaysSessions : exerciseArray;

            totalActiveMinutes = sessionsToCount.reduce((acc: number, session: any) => {
                if (session.start_time && session.end_time) {
                    const start = new Date(session.start_time).getTime();
                    const end = new Date(session.end_time).getTime();
                    return acc + Math.max(0, (end - start) / 60000);
                }
                return acc;
            }, 0);
        }

        // As a fallback simulation, if we don't have calories but we have heart rate > 100 or huge steps
        if (totalCalories === 0 && totalSteps > 5000) {
            totalCalories = Math.floor(totalSteps * 0.04);
        }

        if (totalSteps === 0 && (!body.steps || body.steps.length === 0)) {
            return NextResponse.json({ error: 'Missing step data' }, { status: 400 });
        }

        const steps = totalSteps;
        const calories = totalCalories;

        const dateStr = format(new Date(timestamp), 'yyyy-MM-dd');

        // 1. Fetch existing record for today (if any)
        const { rows: existingRows } = await sql`SELECT * FROM daily_stats WHERE date = ${dateStr} LIMIT 1`;
        let existingRecord = existingRows[0];

        // OVERWRITE the database with the fresh values from the webhook.
        // If the webhook somehow sends 0 (e.g. lack of permissions), we safely keep the existing count.
        let newSteps = steps > 0 ? steps : (existingRecord?.steps || 0);
        let newCalories = calories > 0 ? calories : (existingRecord?.calories || 0);

        // Provide exercise credit if the new payload has exercise, or if it was already achieved today.
        const currentBatchHasExercise = calculateHasExercise(calories, totalActiveMinutes);
        const hasExercise = existingRecord?.has_exercise || currentBatchHasExercise || calculateHasExercise(newCalories, 0);

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

        // 2. Fetch PENDING past days to clear debts if we exceeded target
        if (newSteps > targetSteps) {
            const { rows: pendingDays } = await sql`
        SELECT * FROM daily_stats 
        WHERE status = 'PENDING' AND date < ${dateStr}
        ORDER BY date ASC
      `;

            if (pendingDays.length > 0) {
                const resolution = resolveDebt(currentStats, pendingDays as DailyStats[]);

                // Update currentStats
                currentStats.debt_steps = resolution.updatedCurrentStats.debt_steps;
                currentStats.status = resolution.updatedCurrentStats.status;

                // Persist the updated pending days
                for (const pd of resolution.updatedPendingDays) {
                    await sql`
            UPDATE daily_stats 
            SET debt_steps = ${pd.debt_steps}, status = ${pd.status}, updated_at = NOW()
            WHERE id = ${pd.id}
          `;
                }
            }
        }

        // 3. Upsert current day
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

        return NextResponse.json({ success: true, date: dateStr, status: 'upserted', data: currentStats });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
