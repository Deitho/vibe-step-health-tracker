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
        const authHeader = request.headers.get('x-webhook-secret');
        if (authHeader !== process.env.WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { steps, distance, calories, active_minutes, timestamp } = body;

        if (steps == null || calories == null || !timestamp) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const dateStr = format(new Date(timestamp), 'yyyy-MM-dd');

        // 1. Fetch existing record for today (if any)
        const { rows: existingRows } = await sql`SELECT * FROM daily_stats WHERE date = ${dateStr} LIMIT 1`;
        let existingRecord = existingRows[0];

        let newSteps = steps;
        let newCalories = calories;

        if (existingRecord) {
            // Upsert logic: If webhook is called multiple times, we might add steps or just take the max
            // The SOP states "Aynı güne ait sonraki istekler önceki kaydı günceller (steps toplanır, calories güncellenir)."
            // Assuming webhook sends delta or we should just add them? "steps toplanır" means accumulated.
            newSteps = existingRecord.steps + steps;
            newCalories = existingRecord.calories + calories; // Or should we take max? The SOP says "toplanır" or "en güncel değer alınır". Let's assume the Webhook sends delta because the docs say "steps toplanır".
        }

        const hasExercise = calculateHasExercise(newCalories);
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
