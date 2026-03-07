"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var debt_engine_1 = require("../utils/debt-engine");
// Mock the current state of the database with some pending days
var mondayDate = '2026-03-02';
var tuesdayDate = '2026-03-03';
var wednesdayDate = '2026-03-04';
console.log("--- Vibe-Step Engine Test ---");
console.log("Scenario: Monday & Tuesday have debts. Wednesday we do extra exercise.");
// MONDAY: No exercise, Target 12,000. We do 10,000 -> 2,000 debt.
var monHasExercise = (0, debt_engine_1.calculateHasExercise)(0); // false
var monTarget = (0, debt_engine_1.calculateDailyTarget)(monHasExercise); // 12000
var monDebt = (0, debt_engine_1.calculateDebt)(10000, monTarget); // 2000
var mondayStats = {
    id: 'mon-id',
    date: mondayDate,
    steps: 10000,
    calories: 0,
    has_exercise: monHasExercise,
    target_steps: monTarget,
    debt_steps: monDebt,
    status: 'PENDING',
    debt_source_date: [mondayDate],
    created_at: new Date(),
    updated_at: new Date()
};
console.log("\nMonday Stats:");
console.table({
    Date: mondayStats.date,
    Steps: mondayStats.steps,
    Target: mondayStats.target_steps,
    Debt: mondayStats.debt_steps,
    Status: mondayStats.status
});
// TUESDAY: Exercise, Target 8,000. We do 7,000 -> 1,000 debt.
var tueHasExercise = (0, debt_engine_1.calculateHasExercise)(200); // true
var tueTarget = (0, debt_engine_1.calculateDailyTarget)(tueHasExercise); // 8000
var tueDebt = (0, debt_engine_1.calculateDebt)(7000, tueTarget); // 1000
var tuesdayStats = {
    id: 'tue-id',
    date: tuesdayDate,
    steps: 7000,
    calories: 200,
    has_exercise: tueHasExercise,
    target_steps: tueTarget,
    debt_steps: tueDebt,
    status: 'PENDING',
    debt_source_date: [tuesdayDate],
    created_at: new Date(),
    updated_at: new Date()
};
console.log("\nTuesday Stats:");
console.table({
    Date: tuesdayStats.date,
    Steps: tuesdayStats.steps,
    Target: tuesdayStats.target_steps,
    Debt: tuesdayStats.debt_steps,
    Status: tuesdayStats.status
});
// WEDNESDAY: Exercise, Target 8,000. We do 12,000 -> +4,000 extra steps.
var wedHasExercise = (0, debt_engine_1.calculateHasExercise)(300); // true
var wedTarget = (0, debt_engine_1.calculateDailyTarget)(wedHasExercise); // 8000
var wedDebt = (0, debt_engine_1.calculateDebt)(12000, wedTarget); // 0 (we exceeded)
var wednesdayStats = {
    id: 'wed-id',
    date: wednesdayDate,
    steps: 12000,
    calories: 300,
    has_exercise: wedHasExercise,
    target_steps: wedTarget,
    debt_steps: wedDebt,
    status: 'COMPLETED',
    debt_source_date: [],
    created_at: new Date(),
    updated_at: new Date()
};
console.log("\nWednesday Stats (Before FIFO):");
console.table({
    Date: wednesdayStats.date,
    Steps: wednesdayStats.steps,
    Target: wednesdayStats.target_steps,
    Debt: wednesdayStats.debt_steps,
    Status: wednesdayStats.status
});
// RUN FIFO ALGORITHM
console.log("\n--- RUNNING FIFO ALGORITHM ---");
var pendingDaysFromDB = [mondayStats, tuesdayStats];
var result = (0, debt_engine_1.resolveDebt)(wednesdayStats, pendingDaysFromDB);
console.log("\nResulting Wednesday Stats (No changes to current day):");
console.table({
    Date: result.updatedCurrentStats.date,
    Steps: result.updatedCurrentStats.steps,
    Target: result.updatedCurrentStats.target_steps,
    Debt: result.updatedCurrentStats.debt_steps,
    Status: result.updatedCurrentStats.status
});
console.log("\nResulting Pending Days (Monday & Tuesday should be COMPLETED padding debts):");
// We can use console.table directly on the array because it's uniform objects
var displayPending = result.updatedPendingDays.map(function (d) { return ({
    Date: d.date,
    Steps: d.steps,
    Target: d.target_steps,
    NewDebt: d.debt_steps,
    NewStatus: d.status
}); });
console.table(displayPending);
if (displayPending[0].NewDebt === 0 && displayPending[1].NewDebt === 0) {
    console.log("\n✅ TEST PASSED: All FIFO debts correctly paid off using Wednesday's extra steps.");
}
else {
    console.error("\n❌ TEST FAILED: Debts were not adequately resolved.");
}
