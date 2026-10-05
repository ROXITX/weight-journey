// Lazily initialises Firebase only when configured (keeps local demo mode light).
import { firebaseConfig, isFirebaseConfigured } from '../config/firebase';

let cache = null;

export async function getFirebase() {
  if (!isFirebaseConfigured) return null;
  if (cache) return cache;
  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]);
  const app = initializeApp(firebaseConfig);
  const auth = authMod.getAuth(app);
  // Offline cache: the app keeps working without a connection and syncs later.
  const db = fsMod.initializeFirestore(app, {
    localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() }),
  });
  cache = { app, auth, db, authMod, fsMod };
  return cache;
}
