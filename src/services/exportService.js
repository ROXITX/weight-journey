// Export / import of all personal data (JSON + CSV). Runs fully in the browser.
import { db, COLLECTIONS } from './db';
import { buildDay } from '../utils/scoring';
import { todayKey } from '../utils/date';

export async function collectAll(uid, userDoc) {
  const out = { exportedAt: new Date().toISOString(), user: userDoc };
  for (const c of COLLECTIONS) out[c] = await db.fetchCollection(uid, c);
  return out;
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

export async function exportJson(uid, userDoc) {
  const data = await collectAll(uid, userDoc);
  download(`weight-journey-${todayKey()}.json`, JSON.stringify(data, null, 2), 'application/json');
}

const esc = (v) => {
  if (v == null) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per day with every tracked field (habits flattened as columns). */
export async function exportCsv(uid, userDoc, habits) {
  const data = await collectAll(uid, userDoc);
  const dates = new Set([...Object.keys(data.dailyLogs), ...Object.keys(data.waterLogs), ...Object.keys(data.weightLogs)]);
  const sorted = [...dates].sort();
  const daily = data.dailyLogs, water = data.waterLogs, weight = data.weightLogs;
  const head = [
    'date', 'weight_kg', 'weight_note', 'water_ml', 'steps', 'extra_workouts', 'sleep_bed', 'sleep_wake', 'sleep_hours',
    'overate', 'overeat_reasons', 'sugary_drinks', 'diet_drinks', 'meals', 'bowel_count', 'bowel_times',
    'mood', 'energy', 'hunger', 'journal_day', 'journal_well', 'journal_wrong', 'journal_cravings', 'journal_improve',
    ...habits.map((h) => `habit_${h.id}`),
  ];
  const rows = sorted.map((date) => {
    const d = buildDay(date, { daily, water, weight });
    return [
      date, d.weight, d.weightNote, d.waterMl, d.steps, d.workouts.map((w) => `${w.type} ${w.duration || ''}m`).join('; '),
      d.sleep.bed, d.sleep.wake, d.sleep.hours, d.food.overate, (d.food.overeatReasons || []).join('; '),
      d.food.sugaryDrinks, d.food.dietDrinks, (d.food.meals || []).map((m) => `${m.meal}: ${m.name || ''} ${m.calories || ''}kcal`).join('; '),
      d.bowel.count, (d.bowel.times || []).join('; '), d.mood, d.energy, d.hunger,
      d.journal.day, d.journal.well, d.journal.wrong, d.journal.cravings, d.journal.improve,
      ...habits.map((h) => d.habits[h.id]),
    ].map(esc).join(',');
  });
  download(`weight-journey-${todayKey()}.csv`, [head.join(','), ...rows].join('\n'), 'text/csv');
}

/** Import a JSON file produced by exportJson (merges into existing data). */
export async function importJson(uid, file) {
  const data = JSON.parse(await file.text());
  if (data.user) {
    const { profile, goals, habits, notifications, settings, onboarded } = data.user;
    await db.saveUser(uid, { profile, goals, habits, notifications, settings, onboarded });
  }
  let count = 0;
  for (const c of COLLECTIONS) {
    for (const [id, doc] of Object.entries(data[c] || {})) {
      await db.saveDoc(uid, c, id, doc);
      count++;
    }
  }
  return count;
}

