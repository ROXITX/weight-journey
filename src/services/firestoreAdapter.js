// Cloud Firestore storage. Layout:
//   users/{uid}                     → { profile, goals, habits, notifications, settings, onboarded }
//   users/{uid}/dailyLogs/{date}    → habits, steps, workouts, food, sleep, journal, mood…
//   users/{uid}/weightLogs/{date}   → { date, weight, note }
//   users/{uid}/waterLogs/{date}    → { date, totalMl, entries[] }
//   users/{uid}/achievements/{id}   → { id, unlockedAt }
// Queries only fetch the needed date window (where date >= from).
import { getFirebase } from '../firebase/client';

const toMap = (snap) => Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]));

export const firestoreAdapter = {
  watchUser(uid, cb, onError) {
    let unsub = () => {};
    let cancelled = false;
    getFirebase().then(({ db, fsMod }) => {
      if (cancelled) return;
      unsub = fsMod.onSnapshot(fsMod.doc(db, 'users', uid), (s) => cb(s.exists() ? s.data() : null), onError);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  },
  async saveUser(uid, data) {
    const { db, fsMod } = await getFirebase();
    await fsMod.setDoc(fsMod.doc(db, 'users', uid), { ...data, updatedAt: Date.now() }, { merge: true });
  },
  watchCollection(uid, col, from, cb, onError) {
    let unsub = () => {};
    let cancelled = false;
    getFirebase().then(({ db, fsMod }) => {
      if (cancelled) return;
      const ref = fsMod.collection(db, 'users', uid, col);
      const q = from ? fsMod.query(ref, fsMod.where('date', '>=', from)) : ref;
      unsub = fsMod.onSnapshot(q, (snap) => cb(toMap(snap)), onError);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  },
  async fetchCollection(uid, col, from, to) {
    const { db, fsMod } = await getFirebase();
    const ref = fsMod.collection(db, 'users', uid, col);
    const cons = [];
    if (from) cons.push(fsMod.where('date', '>=', from));
    if (to) cons.push(fsMod.where('date', '<=', to));
    return toMap(await fsMod.getDocs(cons.length ? fsMod.query(ref, ...cons) : ref));
  },
  async saveDoc(uid, col, id, data) {
    const { db, fsMod } = await getFirebase();
    await fsMod.setDoc(fsMod.doc(db, 'users', uid, col, id), { ...data, updatedAt: Date.now() }, { merge: true });
  },
  async deleteDoc(uid, col, id) {
    const { db, fsMod } = await getFirebase();
    await fsMod.deleteDoc(fsMod.doc(db, 'users', uid, col, id));
  },
  async deleteAll(uid, cols) {
    const { db, fsMod } = await getFirebase();
    for (const c of cols) {
      const snap = await fsMod.getDocs(fsMod.collection(db, 'users', uid, c));
      await Promise.all(snap.docs.map((d) => fsMod.deleteDoc(d.ref)));
    }
    await fsMod.deleteDoc(fsMod.doc(db, 'users', uid));
  },
};
