import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { DailyStats } from '@/lib/db';
import { startOfWeek, endOfWeek, parseISO } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date'); // YYYY-MM-DD

        // Default to the current week if no specific date is provided
        const baseDate = dateParam ? parseISO(dateParam) : new Date();

        // Week starts on Monday (weekStartsOn: 1)
        const startDate = startOfWeek(baseDate, { weekStartsOn: 1 });
        const endDate = endOfWeek(baseDate, { weekStartsOn: 1 });

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const { rows } = await sql`
      SELECT * FROM daily_stats
      WHERE date >= ${startDateStr} AND date <= ${endDateStr}
      ORDER BY date ASC
    `;

        const dailyStats = rows as DailyStats[];

        // Calculate weekly metrics
        const exerciseCount = dailyStats.filter(day => day.has_exercise).length;
        const allDaysCompleted = dailyStats.length === 7 && dailyStats.every(day => day.status === 'COMPLETED');
        const isWeekPassed = allDaysCompleted && exerciseCount >= 3;

        return NextResponse.json({
            success: true,
            weekRange: { start: startDateStr, end: endDateStr },
            metrics: {
                exerciseCount,
                allDaysCompleted,
                isWeekPassed
            },
            data: dailyStats
        });
    } catch (error) {
        console.error('Error fetching weekly stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
