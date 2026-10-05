// What a user shares with friends: a SUMMARY only (never journal, food, bathroom or raw logs).
// Exact body weight is only included when the user enables "Share my weight numbers".
const r1 = (n) => (n == null || Number.isNaN(n) ? null : Math.round(n * 10) / 10);
const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);

export function buildPublicStats(d) {
  const shareWeight = Boolean(d.settings.shareWeight);
  const sharing = d.settings.shareWithFriends !== false;
  const last = (n) => d.days.slice(-n);
  const d7 = last(7);
  const logged7 = d7.filter((x) => x.logged);
  const logged30 = last(30).filter((x) => x.logged);
  const t = d.today;
  const base = { name: d.profile.name || 'Friend', sharing };
  if (!sharing) return { ...base, summary: null, days: [] };
  return {
    ...base,
    shareWeight,
    goals: { stepTarget: d.goals.stepTarget, waterTarget: d.goals.waterTarget, workoutTarget: d.goals.workoutTarget },
    summary: {
      lost: r1(d.stats.lost),
      progress: r1(d.stats.progress),
      current: shareWeight ? r1(d.stats.current) : null,
      start: shareWeight ? r1(d.stats.start) : null,
      target: shareWeight ? r1(d.stats.target) : null,
      streak: d.streaks.overall.current,
      bestStreak: d.streaks.overall.longest,
      todayPct: t?.pct ?? 0,
      todayDone: t?.done ?? 0,
      todayTotal: t?.total ?? 0,
      avg7: Math.round(avg(logged7.map((x) => x.pct)) ?? 0),
      avg30: Math.round(avg(logged30.map((x) => x.pct)) ?? 0),
      steps7: Math.round(avg(d7.filter((x) => x.steps).map((x) => x.steps)) ?? 0),
      water7: Math.round(avg(d7.filter((x) => x.waterMl).map((x) => x.waterMl)) ?? 0),
      workouts7: d7.reduce((s, x) => s + x.workoutCount, 0),
      loggedDays: d.days.filter((x) => x.logged).length,
      achievements: d.achievements ? Object.keys(d.achievements).length : 0,
    },
    // Last 30 days, compact: d=date p=consistency% s=steps w=water ml k=workouts l=logged
    days: last(30).map((x) => ({ d: x.date, p: x.pct, s: x.steps || 0, w: x.waterMl, k: x.workoutCount, l: x.logged ? 1 : 0 })),
  };
}

/** Leaderboard metrics (all "higher is better"). */
export const METRICS = [
  { id: 'avg7', label: 'Consistency 7D', unit: '%', icon: '📊', get: (s) => s.avg7 },
  { id: 'streak', label: 'Streak', unit: 'd', icon: '🔥', get: (s) => s.streak },
  { id: 'progress', label: 'Journey %', unit: '%', icon: '🗺️', get: (s) => s.progress },
  { id: 'lost', label: 'Kg lost', unit: 'kg', icon: '📉', get: (s) => s.lost },
  { id: 'todayPct', label: 'Today', unit: '%', icon: '✅', get: (s) => s.todayPct },
  { id: 'steps7', label: 'Steps 7D', unit: '', icon: '🚶', get: (s) => s.steps7 },
  { id: 'water7', label: 'Water 7D', unit: 'L', icon: '💧', get: (s) => (s.water7 || 0) / 1000 },
  { id: 'workouts7', label: 'Workouts 7D', unit: '', icon: '🏋️', get: (s) => s.workouts7 },
];

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L confusion
export const makeCode = () => Array.from({ length: 6 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join('');
