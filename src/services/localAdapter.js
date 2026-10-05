// LOCAL DEMO MODE storage (localStorage). Mirrors the Firestore adapter's interface so the
// rest of the app does not care which one is active.
import { deepMerge } from '../utils/object';

const key = (uid, name) => `wlj:${uid}:${name}`;
const listeners = new Map(); // key -> Set<fn>

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  localStorage.setItem(k, JSON.stringify(v));
  listeners.get(k)?.forEach((fn) => fn());
};
const listen = (k, fn) => {
  if (!listeners.has(k)) listeners.set(k, new Set());
  listeners.get(k).add(fn);
  return () => listeners.get(k)?.delete(fn);
};

const filterRange = (map, from, to) =>
  Object.fromEntries(Object.entries(map).filter(([d]) => (!from || d >= from) && (!to || d <= to)));

export const localAdapter = {
  watchUser(uid, cb) {
    const k = key(uid, 'user');
    const emit = () => cb(read(k, null));
    emit();
    return listen(k, emit);
  },
  async saveUser(uid, data) {
    const k = key(uid, 'user');
    write(k, deepMerge(read(k, {}) || {}, data));
  },
  watchCollection(uid, col, from, cb) {
    const k = key(uid, col);
    const emit = () => cb(filterRange(read(k, {}), from));
    emit();
    return listen(k, emit);
  },
  async fetchCollection(uid, col, from, to) {
    return filterRange(read(key(uid, col), {}), from, to);
  },
  async saveDoc(uid, col, id, data) {
    const k = key(uid, col);
    const all = read(k, {});
    all[id] = deepMerge(all[id] || {}, data);
    write(k, all);
  },
  async deleteDoc(uid, col, id) {
    const k = key(uid, col);
    const all = read(k, {});
    delete all[id];
    write(k, all);
  },
  async deleteAll(uid, cols) {
    cols.forEach((c) => write(key(uid, c), {}));
    write(key(uid, 'user'), null);
  },
};
