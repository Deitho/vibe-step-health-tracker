"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHasExercise = calculateHasExercise;
exports.calculateDailyTarget = calculateDailyTarget;
exports.calculateDebt = calculateDebt;
exports.resolveDebt = resolveDebt;
function calculateHasExercise(calories) {
    return calories >= 150;
}
function calculateDailyTarget(hasExercise) {
    return hasExercise ? 8000 : 12000;
}
/**
 * Calculates debt (if any) based on current steps and target.
 */
function calculateDebt(steps, target) {
    return steps < target ? target - steps : 0;
}
/**
 * Resolves debt based on the FIFO algorithm defined in the SOP.
 * Returns the modified currentStats and an array of updated previousPendingDays.
 *
 * @param currentStats The stats for the day with excess steps (steps > target)
 * @param previousPendingDays The past days sorted by date ascending that are currently PENDING
 */
function resolveDebt(currentStats, previousPendingDays) {
    // Only proceed if the current day has exceeded the target
    if (currentStats.steps <= currentStats.target_steps) {
        return {
            updatedCurrentStats: currentStats,
            updatedPendingDays: previousPendingDays,
        };
    }
    // Calculate total extra steps available to pay off debts
    var extraSteps = currentStats.steps - currentStats.target_steps;
    // Clone the array to avoid mutating original references directly
    var updatedPendingDays = JSON.parse(JSON.stringify(previousPendingDays));
    // Loop through previous pending days and pay off debts (FIFO)
    for (var _i = 0, updatedPendingDays_1 = updatedPendingDays; _i < updatedPendingDays_1.length; _i++) {
        var pendingDay = updatedPendingDays_1[_i];
        if (extraSteps <= 0)
            break; // No more extra steps to distribute
        // Only resolve days that are still genuinely PENDING and have debt > 0
        if (pendingDay.status === 'PENDING' && pendingDay.debt_steps > 0) {
            if (extraSteps >= pendingDay.debt_steps) {
                // We have enough steps to fully clear this day's debt
                extraSteps -= pendingDay.debt_steps;
                pendingDay.debt_steps = 0;
                pendingDay.status = 'COMPLETED';
            }
            else {
                // We can only partially pay off this day's debt
                pendingDay.debt_steps -= extraSteps;
                extraSteps = 0;
            }
        }
    }
    // Current stats is always COMPLETED because its own debt_steps is 0 since it exceeded the target
    var updatedCurrentStats = __assign({}, currentStats);
    updatedCurrentStats.debt_steps = 0;
    updatedCurrentStats.status = 'COMPLETED';
    return {
        updatedCurrentStats: updatedCurrentStats,
        updatedPendingDays: updatedPendingDays,
    };
}
