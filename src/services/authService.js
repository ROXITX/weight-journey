import { isFirebaseConfigured } from '../config/firebase';
import { appConfig } from '../config/appConfig';
import { localUsers } from '../config/localUsers';
import { getFirebase } from '../firebase/client';

const SESSION_KEY = 'wlj:session';
const localListeners = new Set();

/** "Rohith" → "rohith@weightjourney.app" (a full email is used as-is). */
export const usernameToEmail = (u) => {
  const v = u.trim();
  return v.includes('@') ? v.toLowerCase() : `${v.toLowerCase()}@${appConfig.authEmailDomain}`;
};

const nameFromEmail = (email = '') => {
  const n = email.split('@')[0] || 'Friend';
  return n.charAt(0).toUpperCase() + n.slice(1);
};

const shapeFirebaseUser = (u) =>
  u && { uid: u.uid, email: u.email, displayName: u.displayName || nameFromEmail(u.email) };

export async function signIn(username, password) {
  if (!isFirebaseConfigured) {
    const user = localUsers.find(
      (x) => x.username.toLowerCase() === username.trim().toLowerCase() && x.password === password,
    );
    if (!user) throw { code: 'auth/invalid-credential' };
    const session = { uid: `local-${user.username.toLowerCase()}`, email: usernameToEmail(user.username), displayName: user.displayName };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localListeners.forEach((fn) => fn(session));
    return session;
  }
  const { auth, authMod } = await getFirebase();
  const cred = await authMod.signInWithEmailAndPassword(auth, usernameToEmail(username), password);
  return shapeFirebaseUser(cred.user);
}

export async function signOut() {
  if (!isFirebaseConfigured) {
    localStorage.removeItem(SESSION_KEY);
    localListeners.forEach((fn) => fn(null));
    return;
  }
  const { auth, authMod } = await getFirebase();
  await authMod.signOut(auth);
}

export function watchAuth(cb) {
  if (!isFirebaseConfigured) {
    let s = null;
    try {
      s = JSON.parse(localStorage.getItem(SESSION_KEY));
    } catch {}
    cb(s);
    localListeners.add(cb);
    return () => localListeners.delete(cb);
  }
  let unsub = () => {};
  getFirebase().then(({ auth, authMod }) => {
    unsub = authMod.onAuthStateChanged(auth, (u) => cb(shapeFirebaseUser(u)));
  });
  return () => unsub();
}

export async function changePassword(currentPassword, newPassword) {
  if (!isFirebaseConfigured) throw { code: 'local/unsupported' };
  const { auth, authMod } = await getFirebase();
  const user = auth.currentUser;
  const cred = authMod.EmailAuthProvider.credential(user.email, currentPassword);
  await authMod.reauthenticateWithCredential(user, cred);
  await authMod.updatePassword(user, newPassword);
}
