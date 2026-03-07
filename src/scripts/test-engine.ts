import {
    calculateHasExercise,
    calculateDailyTarget,
    calculateDebt,
    resolveDebt
} from '../utils/debt-engine';
import { DailyStats } from '../lib/db';

// Mock the current state of the database with some pending days
const mondayDate = '2026-03-02';
const tuesdayDate = '2026-03-03';
const wednesdayDate = '2026-03-04';

console.log("--- Vibe-Step Engine Test ---");
console.log("Scenario: Monday & Tuesday have debts. Wednesday we do extra exercise.");

// MONDAY: No exercise, Target 12,000. We do 10,000 -> 2,000 debt.
const monHasExercise = calculateHasExercise(0); // false
const monTarget = calculateDailyTarget(monHasExercise); // 12000
const monDebt = calculateDebt(10000, monTarget); // 2000

const mondayStats: DailyStats = {
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

console.log(`\nMonday Stats:`);
console.table({
    Date: mondayStats.date,
    Steps: mondayStats.steps,
    Target: mondayStats.target_steps,
    Debt: mondayStats.debt_steps,
    Status: mondayStats.status
});

// TUESDAY: Exercise, Target 8,000. We do 7,000 -> 1,000 debt.
const tueHasExercise = calculateHasExercise(200); // true
const tueTarget = calculateDailyTarget(tueHasExercise); // 8000
const tueDebt = calculateDebt(7000, tueTarget); // 1000

const tuesdayStats: DailyStats = {
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

console.log(`\nTuesday Stats:`);
console.table({
    Date: tuesdayStats.date,
    Steps: tuesdayStats.steps,
    Target: tuesdayStats.target_steps,
    Debt: tuesdayStats.debt_steps,
    Status: tuesdayStats.status
});

// WEDNESDAY: Exercise, Target 8,000. We do 12,000 -> +4,000 extra steps.
const wedHasExercise = calculateHasExercise(300); // true
const wedTarget = calculateDailyTarget(wedHasExercise); // 8000
const wedDebt = calculateDebt(12000, wedTarget); // 0 (we exceeded)

const wednesdayStats: DailyStats = {
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

console.log(`\nWednesday Stats (Before FIFO):`);
console.table({
    Date: wednesdayStats.date,
    Steps: wednesdayStats.steps,
    Target: wednesdayStats.target_steps,
    Debt: wednesdayStats.debt_steps,
    Status: wednesdayStats.status
});

// RUN FIFO ALGORITHM
console.log("\n--- RUNNING FIFO ALGORITHM ---");
const pendingDaysFromDB = [mondayStats, tuesdayStats];
const result = resolveDebt(wednesdayStats, pendingDaysFromDB);

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
const displayPending = result.updatedPendingDays.map(d => ({
    Date: d.date,
    Steps: d.steps,
    Target: d.target_steps,
    NewDebt: d.debt_steps,
    NewStatus: d.status
}));
console.table(displayPending);

if (displayPending[0].NewDebt === 0 && displayPending[1].NewDebt === 0) {
    console.log("\n✅ TEST PASSED: All FIFO debts correctly paid off using Wednesday's extra steps.");
} else {
    console.error("\n❌ TEST FAILED: Debts were not adequately resolved.");
}
