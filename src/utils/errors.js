// Turns raw Firebase / network errors into friendly messages (never show raw errors to the user).
const MAP = {
  'auth/invalid-credential': 'That username or password doesn’t look right.',
  'auth/wrong-password': 'That username or password doesn’t look right.',
  'auth/user-not-found': 'That username or password doesn’t look right.',
  'auth/invalid-email': 'Please enter a valid username.',
  'auth/too-many-requests': 'Too many attempts. Please wait a minute and try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/requires-recent-login': 'Please log out and log in again, then retry.',
  'permission-denied': 'You don’t have access to this data.',
  unavailable: 'You seem to be offline. Changes will sync when you reconnect.',
  'local/unsupported': 'Not available in local demo mode.',
  'friends/not-found': 'No one has that friend code. Check it and try again.',
  'friends/self': 'That’s your own code 😄 Share it with a friend instead.',
  'friends/code-failed': 'Could not create a friend code. Please try again.',
};

export function friendlyError(err, fallback = 'Something went wrong. Check your connection and try again.') {
  const code = err?.code || '';
  if (import.meta.env.DEV && err) console.warn('[app error]', err);
  return MAP[code] || fallback;
}
