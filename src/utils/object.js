const isPlain = (v) => v && typeof v === 'object' && !Array.isArray(v);

/** Deep merge like Firestore `set(..., {merge:true})`: objects merge recursively, arrays/values replace. */
export function deepMerge(target, source) {
  if (!isPlain(source)) return source;
  const out = { ...(isPlain(target) ? target : {}) };
  for (const [k, v] of Object.entries(source)) {
    if (v === undefined) continue;
    out[k] = isPlain(v) ? deepMerge(out[k], v) : v;
  }
  return out;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
