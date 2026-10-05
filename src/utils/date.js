import { format, parseISO, addDays, differenceInCalendarDays } from 'date-fns';

/** All days are keyed by LOCAL date "YYYY-MM-DD" (also the Firestore doc id). */
export const toKey = (d) => format(d, 'yyyy-MM-dd');
export const todayKey = () => toKey(new Date());
export const fromKey = (k) => parseISO(k);
export const addDaysKey = (k, n) => toKey(addDays(fromKey(k), n));
export const diffDays = (a, b) => differenceInCalendarDays(fromKey(a), fromKey(b));
export const fmtKey = (k, f = 'd MMM yyyy') => format(fromKey(k), f);

/** Inclusive list of keys from → to. */
export function keysBetween(from, to) {
  const out = [];
  if (!from || !to || from > to) return out;
  let k = from;
  while (k <= to) {
    out.push(k);
    k = addDaysKey(k, 1);
  }
  return out;
}

/** "23:00" + "06:30" → 7.5 (handles crossing midnight). */
export function sleepHours(bed, wake) {
  if (!bed || !wake) return null;
  const [bh, bm] = bed.split(':').map(Number);
  const [wh, wm] = wake.split(':').map(Number);
  let mins = wh * 60 + wm - (bh * 60 + bm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round((mins / 60) * 100) / 100;
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 5) return 'Good night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
