import { sql } from "@vercel/postgres";
import { format, subDays } from "date-fns";
import * as dotenv from "dotenv";
import { calculateHasExercise, calculateDailyTarget, calculateDebt } from "../utils/debt-engine";

dotenv.config({ path: ".env.local" });

async function seedDatabase() {
    console.log("Seeding Vercel Postgres Database with mock data...");
    const today = new Date();

    // Create an array to hold 7 days of mock data ending today
    const mockDays = [];

    for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, "yyyy-MM-dd");

        // Create interesting data patterns based on index
        let steps = 0;
        let calories = 0;
        let has_exercise = false;
        let target = 12000;
        let debt = 0;
        let status = "COMPLETED";

        // Day 0 (6 days ago): Passed with exercise
        if (i === 6) {
            steps = 9000;
            calories = 200;
            has_exercise = calculateHasExercise(calories);
            target = calculateDailyTarget(has_exercise);
            debt = 0;
            status = "COMPLETED";
        }
        // Day 1: Did not exercise, failed target -> Debt
        else if (i === 5) {
            steps = 10000;
            calories = 0;
            has_exercise = calculateHasExercise(calories);
            target = calculateDailyTarget(has_exercise);
            debt = calculateDebt(steps, target); // 2000 debt
            status = "PENDING";
        }
        // Day 2: Exercised, but failed target -> Debt
        else if (i === 4) {
            steps = 7000;
            calories = 400;
            has_exercise = calculateHasExercise(calories);
            target = calculateDailyTarget(has_exercise);
            debt = calculateDebt(steps, target); // 1000 debt
            status = "PENDING";
        }
        // Day 3: Exercised, passed target. (FIFO would ideally run here but we'll mock the state)
        else if (i === 3) {
            steps = 15000;
            calories = 300;
            has_exercise = calculateHasExercise(calories);
            target = calculateDailyTarget(has_exercise);
            debt = 0;
            status = "COMPLETED";
        }
        // Day 4: Did not exercise, barely passed
        else if (i === 2) {
            steps = 12500;
            calories = 0;
            has_exercise = calculateHasExercise(calories);
            target = calculateDailyTarget(has_exercise);
            debt = 0;
            status = "COMPLETED";
        }
        // Day 5 (Yesterday): Failed completely
        else if (i === 1) {
            steps = 3000;
            calories = 50;
            has_exercise = calculateHasExercise(calories);
            target = calculateDailyTarget(has_exercise);
            debt = calculateDebt(steps, target); // 9000 debt
            status = "PENDING";
        }
        // Today
        else if (i === 0) {
            steps = 4000;
            calories = 50;
            has_exercise = calculateHasExercise(calories);
            target = calculateDailyTarget(has_exercise);
            debt = calculateDebt(steps, target);
            status = "PENDING";
        }

        mockDays.push({
            dateStr, steps, calories, has_exercise, target, debt, status
        });
    }

    try {
        for (const data of mockDays) {
            await sql`
        INSERT INTO daily_stats (
          date, steps, calories, has_exercise, target_steps, debt_steps, status
        ) VALUES (
          ${data.dateStr}, ${data.steps}, ${data.calories}, ${data.has_exercise}, 
          ${data.target}, ${data.debt}, ${data.status}
        )
        ON CONFLICT (date) DO UPDATE SET 
          steps = EXCLUDED.steps,
          calories = EXCLUDED.calories,
          has_exercise = EXCLUDED.has_exercise,
          target_steps = EXCLUDED.target_steps,
          debt_steps = EXCLUDED.debt_steps,
          status = EXCLUDED.status,
          updated_at = NOW();
      `;
            console.log(`Inserted mock data for ${data.dateStr}`);
        }
        console.log("Mock data seeding complete.");
    } catch (error) {
        console.error("Error seeding database:", error);
    }
}

seedDatabase();
