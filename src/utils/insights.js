// Smart insights — plain JS statistics over the evaluated days (no AI needed).
import { addDaysKey, todayKey, fromKey } from './date';
import { weightOn } from './calc';
import { fmtNum } from './format';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const avg = (arr) => (arr.length ? arr.reduce((s, v) => s + v, 0) / arr.length : null);

/**
 * @param byDate map dateKey → evaluated day (from useAllDays)
 * @param weightEntries sorted [{date, weight}]
 * @returns [{ icon, tone: 'good'|'bad'|'info', text }]
 */
export function buildInsights(byDate, weightEntries, goals) {
  const out = [];
  const t = todayKey();
  const week = (offset) =>
    Array.from({ length: 7 }, (_, i) => byDate[addDaysKey(t, -(i + offset))]).filter((d) => d && d.logged);
  const thisWeek = week(0);
  const lastWeek = week(7);

  // Steps change
  const sThis = avg(thisWeek.filter((d) => d.steps != null).map((d) => d.steps));
  const sLast = avg(lastWeek.filter((d) => d.steps != null).map((d) => d.steps));
  if (sThis && sLast) {
    const ch = ((sThis - sLast) / sLast) * 100;
    out.push({
      icon: '🚶',
      tone: ch >= 0 ? 'good' : 'bad',
      text: `Your average steps ${ch >= 0 ? 'increased' : 'dropped'} by ${Math.abs(ch).toFixed(0)}% this week (${fmtNum(sThis)} / day).`,
    });
  }

  // Water goal days
  if (thisWeek.length) {
    const hit = thisWeek.filter((d) => d.waterMl >= goals.waterTarget * 1000).length;
    out.push({
      icon: '💧',
      tone: hit >= 5 ? 'good' : hit >= 3 ? 'info' : 'bad',
      text: `You reached your water goal ${hit}/${thisWeek.length} logged days this week.`,
    });
  }

  // Consistency vs last week
  const cThis = avg(thisWeek.map((d) => d.pct));
  const cLast = avg(lastWeek.map((d) => d.pct));
  if (cThis != null && cLast != null) {
    const diff = cThis - cLast;
    out.push({
      icon: diff >= 0 ? '📈' : '📉',
      tone: diff >= 0 ? 'good' : 'bad',
      text: `Your consistency is ${diff >= 0 ? '+' : ''}${diff.toFixed(0)}% compared with last week (${cThis.toFixed(0)}% avg).`,
    });
  }

  // Weekday patterns (last ~8 weeks)
  const recent = Object.values(byDate).filter((d) => d.logged && d.date >= addDaysKey(t, -56));
  if (recent.length >= 7) {
    const byWd = Array.from({ length: 7 }, () => ({ pct: [], missW: 0, n: 0 }));
    recent.forEach((d) => {
      const wd = fromKey(d.date).getDay();
      byWd[wd].pct.push(d.pct);
      byWd[wd].n++;
      if (d.workoutCount < goals.workoutTarget) byWd[wd].missW++;
    });
    const scored = byWd.map((x, i) => ({ i, a: avg(x.pct), miss: x.n ? x.missW / x.n : 0 })).filter((x) => x.a != null);
    const best = scored.reduce((a, b) => (b.a > a.a ? b : a), scored[0]);
    if (best) out.push({ icon: '🏆', tone: 'good', text: `Your best consistency day is ${WEEKDAYS[best.i]} (${best.a.toFixed(0)}% avg).` });
    const worst = scored.reduce((a, b) => (b.miss > a.miss ? b : a), scored[0]);
    if (worst && worst.miss >= 0.5)
      out.push({ icon: '🏋️', tone: 'bad', text: `You tend to miss workouts on ${WEEKDAYS[worst.i]}s. Plan ahead for it!` });
  }

  // Weight change this week
  if (weightEntries.length >= 2) {
    const latest = weightEntries.at(-1);
    const before = weightOn(weightEntries, addDaysKey(t, -7));
    if (before && before.date !== latest.date) {
      const ch = latest.weight - before.weight;
      out.push({
        icon: '⚖️',
        tone: ch <= 0 ? 'good' : 'bad',
        text: `Your weight ${ch <= 0 ? 'decreased' : 'increased'} ${Math.abs(ch).toFixed(1)} kg this week.`,
      });
    }
  }

  // Sugary drinks & overeating
  const sugary = thisWeek.reduce((s, d) => s + (Number(d.food?.sugaryDrinks) || 0), 0);
  const diet = thisWeek.reduce((s, d) => s + (Number(d.food?.dietDrinks) || 0), 0);
  if (thisWeek.length) {
    out.push({
      icon: '🥤',
      tone: sugary === 0 ? 'good' : 'bad',
      text: sugary === 0 ? `Zero sugary drinks this week — great job!` : `${sugary} sugary drink${sugary > 1 ? 's' : ''} this week. Try to cut down.`,
    });
    if (diet) out.push({ icon: '🧃', tone: 'info', text: `${diet} diet / zero-sugar drink${diet > 1 ? 's' : ''} this week.` });
  }
  const reasons = {};
  recent.forEach((d) => d.food?.overate && (d.food.overeatReasons || []).forEach((r) => (reasons[r] = (reasons[r] || 0) + 1)));
  const top = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
  if (top) out.push({ icon: '🧠', tone: 'info', text: `Most common overeating trigger lately: ${top[0]} (${top[1]}×).` });

  if (!out.length) out.push({ icon: '✨', tone: 'info', text: 'Log a few days of data and personalised insights will appear here.' });
  return out;
}
