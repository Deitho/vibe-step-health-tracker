import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export async function setupDatabase() {
    try {
        console.log('Connecting to database and creating schema...');

        await sql`
      CREATE TABLE IF NOT EXISTS daily_stats (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        steps INTEGER NOT NULL DEFAULT 0,
        calories INTEGER NOT NULL DEFAULT 0,
        has_exercise BOOLEAN NOT NULL DEFAULT false,
        target_steps INTEGER NOT NULL,
        debt_steps INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
        debt_source_date DATE[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

        // Create index on date for faster lookups
        await sql`CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);`;

        console.log('Schema created successfully!');
    } catch (error) {
        console.error('Error creating schema:', error);
        process.exit(1);
    }
}

// Allow running from command line
if (require.main === module) {
    setupDatabase().catch(console.error);
}
