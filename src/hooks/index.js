// Reusable hooks — thin, focused views over the central DataContext.
import { useEffect, useMemo } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { buildDay, evaluateDay } from '../utils/scoring';
import { resolveRange } from '../utils/ranges';
import { summarize } from '../utils/analytics';
import { addDaysKey, todayKey } from '../utils/date';
import { appConfig } from '../config/appConfig';
import { computeAchievements } from '../utils/achievements';

export const useAuth = () => useAuthContext();

export function useUser() {
  const d = useData();
  return { profile: d.profile, userDoc: d.userDoc, saveUser: d.saveUser, calories: d.calories, settings: d.settings };
}

export function useGoals() {
  const d = useData();
  return { goals: d.goals, saveGoals: (g) => d.saveUser({ goals: { ...d.goals, ...g } }) };
}

export function useHabits() {
  const d = useData();
  return { habits: d.habits, saveHabits: (list) => d.saveUser({ habits: list }) };
}

/** Evaluated day + save helpers for one date. */
export function useDailyLog(date) {
  const d = useData();
  const day = useMemo(
    () => d.byDate[date] || evaluateDay(buildDay(date, d.logs), d.habits, d.goals),
    [d.byDate, d.logs, d.habits, d.goals, date],
  );
  return {
    day,
    save: (partial) => d.saveDaily(date, partial),
    setHabit: (id, v) => d.setHabit(date, id, v),
  };
}

export function useWeight() {
  const d = useData();
  return { stats: d.stats, entries: d.stats.entries, saveWeight: d.saveWeight, deleteWeight: d.deleteWeight };
}

export function useWater(date = todayKey()) {
  const d = useData();
  const doc = d.logs.water[date] || {};
  const target = d.goals.waterTarget * 1000;
  return {
    totalMl: doc.totalMl || 0,
    entries: doc.entries || [],
    target,
    pct: Math.min(100, Math.round(((doc.totalMl || 0) / target) * 100)),
    add: (ml) => d.addWater(date, ml),
    remove: (id) => d.removeWater(date, id),
  };
}

/**
 * Analytics for a range selection { range, from, to }.
 * Loads older-than-window data on demand (ALL / long CUSTOM ranges).
 */
export function useAnalytics(sel) {
  const d = useData();
  const { from, to } = resolveRange(sel.range, sel, d.earliest);
  const windowFrom = addDaysKey(todayKey(), -appConfig.liveWindowDays);
  const { loadAll } = d;
  useEffect(() => {
    if (sel.range === 'ALL' || from < windowFrom) loadAll();
  }, [sel.range, from, windowFrom, loadAll]);

  return useMemo(() => {
    const days = d.days.filter((x) => x.date >= from && x.date <= to);
    return { ...summarize(days, d.goals, d.stats.entries, from, to), days };
  }, [d.days, d.goals, d.stats.entries, from, to]);
}

/** All achievements with unlocked flag + progress (0..1). */
export function useAchievements() {
  const d = useData();
  return useMemo(
    () =>
      computeAchievements({
        stats: d.stats,
        longest: d.streaks.overall.longest,
        longestWater: d.streaks.water.longest,
        longestSteps: d.streaks.steps.longest,
        longestWorkout: d.streaks.workout.longest,
        loggedDays: d.days.filter((x) => x.logged).length,
        perfectDays: d.days.filter((x) => x.logged && x.pct >= 100).length,
      }),
    [d.stats, d.streaks, d.days],
  );
}
