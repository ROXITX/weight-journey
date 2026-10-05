import { fmtInt, fmtHours } from './format';

/** Merges the three per-day documents into one "day" object used everywhere. */
export function buildDay(date, { daily = {}, water = {}, weight = {} }) {
  const d = daily[date] || {};
  const w = water[date] || {};
  const wt = weight[date];
  const day = {
    date,
    steps: d.steps ?? null,
    waterMl: w.totalMl || 0,
    waterEntries: w.entries || [],
    weight: wt?.weight ?? null,
    weightNote: wt?.note || '',
    habits: d.habits || {},
    workouts: d.workouts || [],
    food: d.food || {},
    bowel: d.bowel || {},
    sleep: d.sleep || {},
    journal: d.journal || {},
    mood: d.mood ?? null,
    energy: d.energy ?? null,
    hunger: d.hunger ?? null,
  };
  day.logged = Boolean(daily[date] || water[date] || wt);
  return day;
}

/** Number of workouts done (morning + evening checkboxes + extra logged workouts). */
export const workoutCount = (day) =>
  (day.habits.morning_workout ? 1 : 0) + (day.habits.evening_workout ? 1 : 0) + (day.workouts?.length || 0);

/** Evaluate one habit for one day → { done, value, target } */
export function evalHabit(habit, day, goals) {
  switch (habit.auto) {
    case 'steps':
      return { value: day.steps || 0, target: goals.stepTarget, done: (day.steps || 0) >= goals.stepTarget };
    case 'water':
      return { value: day.waterMl, target: goals.waterTarget * 1000, done: day.waterMl >= goals.waterTarget * 1000 };
    case 'sleep': {
      const h = day.sleep?.hours || 0;
      return { value: h, target: goals.sleepTarget, done: h >= goals.sleepTarget };
    }
    case 'bowel': {
      const c = day.bowel?.count || 0;
      return { value: c, target: 1, done: c >= 1 };
    }
    default:
      break;
  }
  if (habit.type === 'boolean' || !habit.type) {
    return { value: day.habits[habit.id] ? 1 : 0, target: 1, done: day.habits[habit.id] === true };
  }
  const v = Number(day.habits[habit.id] || 0);
  return { value: v, target: Number(habit.target) || 1, done: v >= (Number(habit.target) || 1) };
}

/** Human text for a missed goal. */
function missText(habit, r) {
  switch (habit.auto) {
    case 'steps':
      return `${fmtInt(r.target - r.value)} steps remaining`;
    case 'water':
      return `${fmtInt(r.target - r.value)} ml water remaining`;
    case 'sleep':
      return `Sleep target (${fmtHours(r.value)} / ${r.target}h)`;
    default:
      return habit.type && habit.type !== 'boolean'
        ? `${habit.label}: ${r.value} / ${r.target} ${habit.unit || ''}`.trim()
        : habit.label;
  }
}

/**
 * Daily consistency score.
 * pct = Σ(weight of completed habits) / Σ(weight of enabled habits) × 100
 * Each habit's weight is configurable (Settings → Habits).
 */
/** Whether a habit applies on a given date (frequency: daily | weekdays | weekends). */
export function appliesOn(habit, date) {
  if (!habit.frequency || habit.frequency === 'daily') return true;
  const wd = new Date(`${date}T12:00:00`).getDay();
  const weekend = wd === 0 || wd === 6;
  return habit.frequency === 'weekends' ? weekend : !weekend;
}

export function evaluateDay(day, habits, goals) {
  const items = habits
    .filter((h) => h.enabled && appliesOn(h, day.date))
    .map((h) => {
      const r = evalHabit(h, day, goals);
      return { habit: h, ...r, miss: r.done ? null : missText(h, r) };
    });
  const wTotal = items.reduce((s, i) => s + (Number(i.habit.weight) || 1), 0);
  const wDone = items.reduce((s, i) => s + (i.done ? Number(i.habit.weight) || 1 : 0), 0);
  const done = items.filter((i) => i.done).length;
  return {
    ...day,
    items,
    done,
    total: items.length,
    pct: wTotal ? Math.round((wDone / wTotal) * 100) : 0,
    workoutCount: workoutCount(day),
    completed: items.filter((i) => i.done),
    missed: items.filter((i) => !i.done),
  };
}

/** Heatmap bucket 0..5 for a percentage. */
export function heatLevel(pct, logged = true) {
  if (!logged || !pct) return 0;
  if (pct >= 100) return 5;
  if (pct > 75) return 4;
  if (pct > 50) return 3;
  if (pct > 25) return 2;
  return 1;
}
