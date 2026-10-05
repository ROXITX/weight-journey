// ─────────────────────────────────────────────────────────────────────────────
// LOCAL DEMO MODE USERS
//
// Used ONLY when Firebase is NOT configured (no VITE_FIREBASE_* values in .env).
// In local mode all data lives in this browser's localStorage (no sync between devices).
//
// Once Firebase is configured these are IGNORED — real users & passwords live in
// Firebase Console → Authentication (never in source code). See HOW_TO_CHANGE_USERS.md.
//
// To change local-mode logins: edit the list below.
// ─────────────────────────────────────────────────────────────────────────────
export const localUsers = [
  { username: 'Rohith', password: 'Rohith', displayName: 'Rohith' },
  { username: 'Sastika', password: 'Sastika', displayName: 'Sastika' },
];
