// Central data store: live-syncs the signed-in user's document + recent logs, exposes
// save actions, and computes derived data (evaluated days, weight stats, streaks) ONCE.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../services/db';
import { useAuthContext } from './AuthContext';
import { useToast } from './ToastContext';
import { appConfig } from '../config/appConfig';
import { defaultGoals, defaultNotifications, defaultProfile, defaultSettings } from '../config/defaultGoals';
import { defaultHabits } from '../config/defaultHabits';
import { addDaysKey, keysBetween, todayKey } from '../utils/date';
import { buildDay, evaluateDay } from '../utils/scoring';
import { weightStats, calcMaintenance } from '../utils/calc';
import { currentStreak, longestStreak, streakTests } from '../utils/streaks';
import { friendlyError } from '../utils/errors';
import { uid as makeId } from '../utils/object';

const DataContext = createContext(null);
const LOG_COLS = { daily: 'dailyLogs', water: 'waterLogs', weight: 'weightLogs' };

export function DataProvider({ children }) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const uid = user?.uid;

  const [userDoc, setUserDoc] = useState(undefined); // undefined = loading
  const [live, setLive] = useState({ daily: {}, water: {}, weight: {} });
  const [older, setOlder] = useState({ daily: {}, water: {}, weight: {} });
  const [achievements, setAchievements] = useState(null);
  const [ready, setReady] = useState({ daily: false, water: false, weight: false });
  const [allLoaded, setAllLoaded] = useState(false);
  const windowFrom = useMemo(() => addDaysKey(todayKey(), -appConfig.liveWindowDays), []);
  const waterRef = useRef({});

  const onError = useCallback((e) => toast(friendlyError(e, 'Unable to load your data. Check your connection.'), 'error'), [toast]);

  useEffect(() => {
    if (!uid) return;
    setUserDoc(undefined);
    setReady({ daily: false, water: false, weight: false });
    setAllLoaded(false);
    setOlder({ daily: {}, water: {}, weight: {} });
    const unsubs = [db.watchUser(uid, (d) => setUserDoc(d || null), onError)];
    Object.entries(LOG_COLS).forEach(([k, col]) =>
      unsubs.push(
        db.watchCollection(uid, col, windowFrom, (map) => {
          if (k === 'water') waterRef.current = map;
          setLive((s) => ({ ...s, [k]: map }));
          setReady((r) => ({ ...r, [k]: true }));
        }, onError),
      ),
    );
    unsubs.push(db.watchCollection(uid, 'achievements', null, setAchievements, onError));
    return () => unsubs.forEach((u) => u());
  }, [uid, windowFrom, onError]);

  /** Fetch data older than the live window (used by "ALL" ranges). */
  const loadAll = useCallback(async () => {
    if (!uid || allLoaded) return;
    setAllLoaded(true);
    const before = addDaysKey(windowFrom, -1);
    const entries = await Promise.all(Object.entries(LOG_COLS).map(async ([k, col]) => [k, await db.fetchCollection(uid, col, null, before)]));
    setOlder(Object.fromEntries(entries));
  }, [uid, allLoaded, windowFrom]);

  // ── Config with defaults ───────────────────────────────────────────────
  const profile = useMemo(() => ({ ...defaultProfile, name: user?.displayName || '', ...userDoc?.profile }), [userDoc, user]);
  const goals = useMemo(() => ({ ...defaultGoals, ...userDoc?.goals }), [userDoc]);
  const habits = useMemo(() => (userDoc?.habits?.length ? userDoc.habits : defaultHabits), [userDoc]);
  const notifications = useMemo(() => ({ ...defaultNotifications, ...userDoc?.notifications }), [userDoc]);
  const settings = useMemo(() => ({ ...defaultSettings, ...userDoc?.settings }), [userDoc]);

  const logs = useMemo(
    () => ({
      daily: { ...older.daily, ...live.daily },
      water: { ...older.water, ...live.water },
      weight: { ...older.weight, ...live.weight },
    }),
    [live, older],
  );

  // ── Derived data (computed once for the whole app) ─────────────────────
  const derived = useMemo(() => {
    const today = todayKey();
    const keys = [...Object.keys(logs.daily), ...Object.keys(logs.water), ...Object.keys(logs.weight)].filter((k) => k <= today).sort();
    const earliest = [keys[0], profile.startDate].filter(Boolean).sort()[0] || today;
    const days = keysBetween(earliest, today).map((k) => evaluateDay(buildDay(k, logs), habits, goals));
    const byDate = Object.fromEntries(days.map((d) => [d.date, d]));
    const stats = weightStats(logs.weight, profile);
    const tests = streakTests(goals);
    const streaks = Object.fromEntries(
      Object.entries(tests).map(([k, t]) => [k, { current: currentStreak(byDate, t), longest: longestStreak(days, t) }]),
    );
    const calories = calcMaintenance(profile, stats.current);
    return { days, byDate, earliest, stats, streaks, calories, today: byDate[today] };
  }, [logs, habits, goals, profile]);

  // ── Actions (optimistic: listeners update instantly; errors show a friendly toast) ──
  const run = useCallback(
    (p, msg) => p.catch((e) => toast(friendlyError(e, msg || 'Unable to save. Check your connection and try again.'), 'error')),
    [toast],
  );

  const actions = useMemo(() => {
    const saveDaily = (date, partial) => run(db.saveDoc(uid, 'dailyLogs', date, { ...partial, date }));
    return {
      saveUser: (partial) => run(db.saveUser(uid, partial)),
      saveDaily,
      setHabit: (date, id, value) => saveDaily(date, { habits: { [id]: value } }),
      saveWeight: (date, weight, note = '') =>
        run(db.saveDoc(uid, 'weightLogs', date, { date, weight: Number(weight), note }), 'Unable to save your weight. Check your connection and try again.'),
      deleteWeight: (date) => run(db.deleteDoc(uid, 'weightLogs', date)),
      addWater: (date, ml) => {
        const cur = waterRef.current[date] || { entries: [] };
        const entries = [...(cur.entries || []), { id: makeId(), ml: Number(ml), at: Date.now() }];
        const next = { date, entries, totalMl: Math.max(0, entries.reduce((s, e) => s + e.ml, 0)) };
        waterRef.current = { ...waterRef.current, [date]: next };
        return run(db.saveDoc(uid, 'waterLogs', date, next), 'Unable to save water. Check your connection and try again.');
      },
      removeWater: (date, id) => {
        const cur = waterRef.current[date] || { entries: [] };
        const entries = (cur.entries || []).filter((e) => e.id !== id);
        const next = { date, entries, totalMl: entries.reduce((s, e) => s + e.ml, 0) };
        waterRef.current = { ...waterRef.current, [date]: next };
        return run(db.saveDoc(uid, 'waterLogs', date, next));
      },
      unlockAchievement: (id) => run(db.saveDoc(uid, 'achievements', id, { id, unlockedAt: Date.now() })),
    };
  }, [uid, run]);

  const value = {
    uid,
    user,
    userDoc,
    loading: userDoc === undefined || !ready.daily || !ready.water || !ready.weight,
    profile, goals, habits, notifications, settings,
    logs, achievements, loadAll, allLoaded,
    ...derived,
    ...actions,
  };
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
