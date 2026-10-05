import { addDaysKey, todayKey } from './date';

/**
 * Current streak: consecutive days satisfying `test`, counting back from today.
 * If TODAY isn't satisfied yet it doesn't break the streak (the day is still in progress) —
 * counting then starts from yesterday.
 * `byDate` = map dateKey → evaluated day.
 */
export function currentStreak(byDate, test) {
  let k = todayKey();
  if (!byDate[k] || !test(byDate[k])) k = addDaysKey(k, -1);
  let n = 0;
  while (byDate[k] && test(byDate[k])) {
    n++;
    k = addDaysKey(k, -1);
  }
  return n;
}

/** Longest run of consecutive days satisfying `test` within a sorted array of days. */
export function longestStreak(days, test) {
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    if (test(d) && (prev === null || addDaysKey(prev, 1) === d.date) && run > 0) run++;
    else run = test(d) ? 1 : 0;
    prev = d.date;
    best = Math.max(best, run);
  }
  return best;
}

/** Predicates used for the different streak types. */
export const streakTests = (goals) => ({
  overall: (d) => d.logged && d.pct >= goals.consistencyTarget,
  weight: (d) => d.weight != null,
  water: (d) => d.waterMl >= goals.waterTarget * 1000,
  steps: (d) => (d.steps || 0) >= goals.stepTarget,
  workout: (d) => d.workoutCount >= goals.workoutTarget,
  food: (d) => d.habits.no_junk && d.habits.no_sugar && d.food?.overate !== true,
  journal: (d) => Boolean(d.journal && Object.values(d.journal).some((v) => v && String(v).trim())),
  logging: (d) => d.logged,
});
