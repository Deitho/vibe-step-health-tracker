import { DailyStats } from '@/lib/db';

export function calculateHasExercise(calories: number): boolean {
    return calories >= 150;
}

export function calculateDailyTarget(hasExercise: boolean): number {
    return hasExercise ? 8000 : 12000;
}

/**
 * Calculates debt (if any) based on current steps and target.
 */
export function calculateDebt(steps: number, target: number): number {
    return steps < target ? target - steps : 0;
}

/**
 * Resolves debt based on the FIFO algorithm defined in the SOP.
 * Returns the modified currentStats and an array of updated previousPendingDays.
 * 
 * @param currentStats The stats for the day with excess steps (steps > target)
 * @param previousPendingDays The past days sorted by date ascending that are currently PENDING
 */
export function resolveDebt(
    currentStats: DailyStats,
    previousPendingDays: DailyStats[]
): {
    updatedCurrentStats: DailyStats;
    updatedPendingDays: DailyStats[];
} {
    // Only proceed if the current day has exceeded the target
    if (currentStats.steps <= currentStats.target_steps) {
        return {
            updatedCurrentStats: currentStats,
            updatedPendingDays: previousPendingDays,
        };
    }

    // Calculate total extra steps available to pay off debts
    let extraSteps = currentStats.steps - currentStats.target_steps;

    // Clone the array to avoid mutating original references directly
    const updatedPendingDays: DailyStats[] = JSON.parse(JSON.stringify(previousPendingDays));

    // Loop through previous pending days and pay off debts (FIFO)
    for (const pendingDay of updatedPendingDays) {
        if (extraSteps <= 0) break; // No more extra steps to distribute

        // Only resolve days that are still genuinely PENDING and have debt > 0
        if (pendingDay.status === 'PENDING' && pendingDay.debt_steps > 0) {
            if (extraSteps >= pendingDay.debt_steps) {
                // We have enough steps to fully clear this day's debt
                extraSteps -= pendingDay.debt_steps;
                pendingDay.debt_steps = 0;
                pendingDay.status = 'COMPLETED';
            } else {
                // We can only partially pay off this day's debt
                pendingDay.debt_steps -= extraSteps;
                extraSteps = 0;
            }
        }
    }

    // Current stats is always COMPLETED because its own debt_steps is 0 since it exceeded the target
    const updatedCurrentStats = { ...currentStats };
    updatedCurrentStats.debt_steps = 0;
    updatedCurrentStats.status = 'COMPLETED';

    return {
        updatedCurrentStats,
        updatedPendingDays,
    };
}
