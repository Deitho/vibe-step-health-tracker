import { sql } from '@vercel/postgres';

export const db = sql;

export type DailyStatus = 'PENDING' | 'COMPLETED' | 'FAILED';

export interface DailyStats {
    id: string; // uuid
    date: string; // YYYY-MM-DD
    steps: number;
    calories: number;
    has_exercise: boolean;
    target_steps: number;
    debt_steps: number;
    status: DailyStatus;
    debt_source_date: string[]; // YYYY-MM-DD format
    exercise_duration_seconds?: number;
    created_at: Date;
    updated_at: Date;
}
