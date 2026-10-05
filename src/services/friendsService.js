// Friends: friend codes + shared summaries.
//   friendCodes/{CODE}                  → { uid, name }            (any signed-in user can GET one code)
//   publicStats/{uid}                   → summary from utils/friends.js + friendCode
//   publicStats/{uid}/followers/{fid}   → fid may read publicStats/{uid}
// Adding a friend by code creates follower docs in BOTH directions (mutual).
import { isFirebaseConfigured } from '../config/firebase';
import { getFirebase } from '../firebase/client';
import { makeCode } from '../utils/friends';

// ── Firestore ──────────────────────────────────────────────────────────
const fsImpl = {
  watchMine(uid, cb) {
    let unsub = () => {};
    let off = false;
    getFirebase().then(({ db, fsMod }) => {
      if (!off) unsub = fsMod.onSnapshot(fsMod.doc(db, 'publicStats', uid), (s) => cb(s.exists() ? s.data() : null), () => cb(null));
    });
    return () => ((off = true), unsub());
  },
  async ensureCode(uid, name) {
    const { db, fsMod } = await getFirebase();
    const snap = await fsMod.getDoc(fsMod.doc(db, 'publicStats', uid));
    if (snap.exists() && snap.data().friendCode) return snap.data().friendCode;
    return fsImpl.regenerate(uid, name, null);
  },
  async regenerate(uid, name, oldCode) {
    const { db, fsMod } = await getFirebase();
    for (let i = 0; i < 8; i++) {
      const code = makeCode();
      try {
        // Rules allow CREATE only → fails if someone already owns this code
        await fsMod.setDoc(fsMod.doc(db, 'friendCodes', code), { uid, name });
      } catch (e) {
        if (e.code === 'permission-denied') continue;
        throw e;
      }
      await fsMod.setDoc(fsMod.doc(db, 'publicStats', uid), { friendCode: code, name }, { merge: true });
      if (oldCode) await fsMod.deleteDoc(fsMod.doc(db, 'friendCodes', oldCode)).catch(() => {});
      return code;
    }
    throw { code: 'friends/code-failed' };
  },
  async publish(uid, data) {
    const { db, fsMod } = await getFirebase();
    await fsMod.setDoc(fsMod.doc(db, 'publicStats', uid), { ...data, updatedAt: Date.now() }, { merge: true });
  },
  async addByCode(uid, myName, rawCode) {
    const { db, fsMod } = await getFirebase();
    const code = rawCode.trim().toUpperCase();
    const c = await fsMod.getDoc(fsMod.doc(db, 'friendCodes', code));
    if (!c.exists()) throw { code: 'friends/not-found' };
    const fid = c.data().uid;
    if (fid === uid) throw { code: 'friends/self' };
    // I may read them (proved by their code)…
    await fsMod.setDoc(fsMod.doc(db, 'publicStats', fid, 'followers', uid), { code, name: myName, addedAt: Date.now() });
    // …and they may read me.
    await fsMod.setDoc(fsMod.doc(db, 'publicStats', uid, 'followers', fid), { name: c.data().name, addedAt: Date.now() });
    return c.data().name;
  },
  watchFriends(uid, cb) {
    let off = false;
    const subs = new Map();
    const data = new Map();
    let unsubList = () => {};
    const emit = () => cb([...data.values()]);
    getFirebase().then(({ db, fsMod }) => {
      if (off) return;
      unsubList = fsMod.onSnapshot(fsMod.collection(db, 'publicStats', uid, 'followers'), (snap) => {
        const ids = new Set(snap.docs.map((d) => d.id));
        snap.docs.forEach((d) => {
          if (subs.has(d.id)) return;
          data.set(d.id, { uid: d.id, name: d.data().name, pending: true });
          subs.set(
            d.id,
            fsMod.onSnapshot(
              fsMod.doc(db, 'publicStats', d.id),
              (s) => (data.set(d.id, { uid: d.id, ...(s.data() || { name: d.data().name, pending: true }) }), emit()),
              () => (data.set(d.id, { uid: d.id, name: d.data().name, blocked: true }), emit()),
            ),
          );
        });
        [...subs.keys()].forEach((id) => !ids.has(id) && (subs.get(id)(), subs.delete(id), data.delete(id)));
        emit();
      }, () => cb([]));
    });
    return () => {
      off = true;
      unsubList();
      subs.forEach((u) => u());
    };
  },
  async remove(uid, fid) {
    const { db, fsMod } = await getFirebase();
    await Promise.all([
      fsMod.deleteDoc(fsMod.doc(db, 'publicStats', uid, 'followers', fid)),
      fsMod.deleteDoc(fsMod.doc(db, 'publicStats', fid, 'followers', uid)).catch(() => {}),
    ]);
  },
};

// ── Local demo mode (same browser; switch between Rohith / Sastika to try it) ──
const K = { codes: 'wlj:global:friendCodes', stats: 'wlj:global:publicStats', fol: (u) => `wlj:global:followers:${u}` };
const rd = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k)) || {};
  } catch {
    return {};
  }
};
const listeners = new Set();
const wr = (k, v) => (localStorage.setItem(k, JSON.stringify(v)), listeners.forEach((f) => f()));
const listen = (fn) => (fn(), listeners.add(fn), () => listeners.delete(fn));

const localImpl = {
  watchMine: (uid, cb) => listen(() => cb(rd(K.stats)[uid] || null)),
  async ensureCode(uid, name) {
    return rd(K.stats)[uid]?.friendCode || localImpl.regenerate(uid, name, null);
  },
  async regenerate(uid, name, oldCode) {
    const codes = rd(K.codes);
    let code;
    do code = makeCode();
    while (codes[code]);
    codes[code] = { uid, name };
    if (oldCode) delete codes[oldCode];
    wr(K.codes, codes);
    const s = rd(K.stats);
    s[uid] = { ...s[uid], friendCode: code, name };
    wr(K.stats, s);
    return code;
  },
  async publish(uid, data) {
    const s = rd(K.stats);
    s[uid] = { ...s[uid], ...data, updatedAt: Date.now() };
    wr(K.stats, s);
  },
  async addByCode(uid, myName, rawCode) {
    const c = rd(K.codes)[rawCode.trim().toUpperCase()];
    if (!c) throw { code: 'friends/not-found' };
    if (c.uid === uid) throw { code: 'friends/self' };
    const a = rd(K.fol(c.uid));
    a[uid] = { name: myName, addedAt: Date.now() };
    wr(K.fol(c.uid), a);
    const b = rd(K.fol(uid));
    b[c.uid] = { name: c.name, addedAt: Date.now() };
    wr(K.fol(uid), b);
    return c.name;
  },
  watchFriends: (uid, cb) =>
    listen(() => {
      const stats = rd(K.stats);
      cb(Object.entries(rd(K.fol(uid))).map(([fid, f]) => ({ uid: fid, ...(stats[fid] || { name: f.name, pending: true }) })));
    }),
  async remove(uid, fid) {
    const a = rd(K.fol(uid));
    delete a[fid];
    wr(K.fol(uid), a);
    const b = rd(K.fol(fid));
    delete b[uid];
    wr(K.fol(fid), b);
  },
};

export const friendsApi = isFirebaseConfigured ? fsImpl : localImpl;
