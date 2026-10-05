import { activityLevels } from '../config/defaultGoals';
import { addDaysKey, diffDays, todayKey } from './date';

/**
 * BMR — Mifflin-St Jeor equation (an ESTIMATE):
 *   men:   10·kg + 6.25·cm − 5·age + 5
 *   women: 10·kg + 6.25·cm − 5·age − 161
 */
export function calcBmr({ weight, heightCm, age, gender }) {
  if (!weight || !heightCm || !age) return null;
  const base = 10 * weight + 6.25 * heightCm - 5 * age;
  return Math.round(base + (gender === 'female' ? -161 : 5));
}

/** TDEE (maintenance) = BMR × activity factor. Manual override wins if set. */
export function calcMaintenance(profile, currentWeight) {
  const bmr = calcBmr({ ...profile, weight: currentWeight || profile.startWeight });
  const level = activityLevels.find((a) => a.id === profile.activityLevel) || activityLevels[1];
  const estimated = bmr ? Math.round(bmr * level.factor) : null;
  const override = Number(profile.maintenanceOverride) || null;
  return { bmr, estimated, maintenance: override || estimated, overridden: Boolean(override), level };
}

export const calcBmi = (kg, cm) => (kg && cm ? Math.round((kg / (cm / 100) ** 2) * 10) / 10 : null);

/** Least-squares slope (kg per day) over [{x: dayIndex, y: kg}]. */
function slope(points) {
  const n = points.length;
  if (n < 2) return null;
  const mx = points.reduce((s, p) => s + p.x, 0) / n;
  const my = points.reduce((s, p) => s + p.y, 0) / n;
  const num = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  return den ? num / den : null;
}

/** Everything the weight page / dashboard needs, computed from weight logs + profile. */
export function weightStats(weightLogs = {}, profile = {}) {
  const entries = Object.values(weightLogs)
    .filter((e) => e && e.weight)
    .map((e) => ({ date: e.date, weight: Number(e.weight), note: e.note || '' }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const start = Number(profile.startWeight) || entries[0]?.weight || null;
  const target = Number(profile.targetWeight) || null;
  const current = entries.at(-1)?.weight ?? start;
  const weights = entries.map((e) => e.weight);
  const highest = weights.length ? Math.max(...weights, start || 0) : start;
  const lowest = weights.length ? Math.min(...weights) : start;
  const lost = start && current ? start - current : 0;
  const remaining = target && current ? Math.max(0, current - target) : null;
  const totalToLose = start && target ? start - target : null;
  const progress = totalToLose > 0 ? Math.max(0, Math.min(100, (lost / totalToLose) * 100)) : 0;

  // Average loss rate over the whole journey
  const firstDate = profile.startDate || entries[0]?.date;
  const daysElapsed = firstDate ? Math.max(1, diffDays(entries.at(-1)?.date || todayKey(), firstDate)) : null;
  const perDay = daysElapsed && lost ? lost / daysElapsed : null;
  const avgWeekly = perDay != null ? perDay * 7 : null;
  const avgMonthly = perDay != null ? perDay * 30.44 : null;

  // Recent trend (last 28 days, linear regression) → ETA to target
  const since = addDaysKey(todayKey(), -28);
  const recent = entries.filter((e) => e.date >= since).map((e) => ({ x: diffDays(e.date, since), y: e.weight }));
  const trendPerDay = slope(recent);
  let eta = null;
  const rate = trendPerDay != null && trendPerDay < 0 ? -trendPerDay : perDay > 0 ? perDay : null;
  if (rate && remaining > 0) eta = addDaysKey(todayKey(), Math.ceil(remaining / rate));

  return {
    entries, start, target, current, highest, lowest, lost, remaining, totalToLose, progress,
    avgWeekly, avgMonthly, trendPerWeek: trendPerDay != null ? trendPerDay * 7 : null, eta,
    reached: target && current ? current <= target : false,
  };
}

/** Weight closest on/before a date (for "change this week"). */
export function weightOn(entries, dateKey) {
  let found = null;
  for (const e of entries) {
    if (e.date <= dateKey) found = e;
    else break;
  }
  return found;
}
