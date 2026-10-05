const nf = new Intl.NumberFormat('en-IN');

export const fmtNum = (n, d = 0) =>
  n == null || Number.isNaN(n) ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: 0 });
export const fmtInt = (n) => (n == null ? '—' : nf.format(Math.round(n)));
export const fmtKg = (n, d = 1) => (n == null ? '—' : `${Number(n).toFixed(d)} kg`);
export const fmtL = (ml, d = 1) => (ml == null ? '—' : `${(ml / 1000).toFixed(d)} L`);
export const fmtCompact = (n) =>
  n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 1 : 1).replace(/\.0$/, '')}K` : `${Math.round(n)}`;
export const fmtHours = (h) => {
  if (h == null) return '—';
  const hrs = Math.floor(h);
  const m = Math.round((h - hrs) * 60);
  return m ? `${hrs}h ${m}m` : `${hrs}h`;
};
export const pct = (v, t) => (t ? Math.max(0, Math.min(100, Math.round(((Number(v) || 0) / t) * 100))) : 0);
export const signed = (n, d = 1, unit = '') =>
  n == null ? '—' : `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(d)}${unit}`;
