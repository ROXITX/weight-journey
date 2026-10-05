import { addDaysKey, todayKey } from './date';

export const RANGES = [
  { id: '3D', days: 3 },
  { id: '7D', days: 7 },
  { id: '10D', days: 10 },
  { id: '1M', days: 30 },
  { id: '3M', days: 91 },
  { id: '6M', days: 182 },
  { id: '1Y', days: 365 },
  { id: 'ALL' },
  { id: 'CUSTOM' },
];

/**
 * Resolves a range selection into { from, to } date keys.
 * `earliest` = first date with any data (used for ALL).
 */
export function resolveRange(range, custom = {}, earliest) {
  const to = todayKey();
  if (range === 'CUSTOM' && custom.from && custom.to) return { from: custom.from, to: custom.to };
  if (range === 'ALL') return { from: earliest && earliest < to ? earliest : addDaysKey(to, -29), to };
  const r = RANGES.find((x) => x.id === range) || RANGES[1];
  return { from: addDaysKey(to, -((r.days || 7) - 1)), to };
}
