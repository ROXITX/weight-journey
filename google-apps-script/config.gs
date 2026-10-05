/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CONFIG — edit these values after pasting the script into script.google.com
 *
 * Reminder TIMES, ON/OFF switches, recipient EMAIL and TIME ZONE are NOT set here —
 * each user sets them in the app: Settings → Reminders (stored in Firestore).
 *
 * No passwords or keys are needed: the script talks to Firestore with the OAuth
 * token of the Google account that owns this script (must be an Owner/Editor of
 * the Firebase project), and sends mail from that account's Gmail.
 * ─────────────────────────────────────────────────────────────────────────────
 */
const CONFIG = {
  // Firebase Console → Project settings → General → Project ID
  FIREBASE_PROJECT_ID: 'weight-loss-rohith',

  // Your deployed app URL (GitHub Pages). Used for the links in every email.
  APP_URL: 'https://roxitx.github.io/weight-journey/',

  // Limit reminders to these Firebase UIDs. Empty = every user who enabled reminders in the app.
  ONLY_UIDS: [],

  // Used when a user enabled reminders but left the email field empty.
  FALLBACK_EMAIL: '',

  // How often the trigger runs (minutes). Allowed: 1, 5, 10, 15 or 30.
  TRIGGER_EVERY_MINUTES: 15,

  // A reminder is sent if the trigger runs within this many minutes AFTER its scheduled time.
  // (Prevents a flood of late emails if the script was paused.) Keep ≥ TRIGGER_EVERY_MINUTES.
  SEND_WINDOW_MINUTES: 45,

  // true = log emails instead of sending (for testing).
  DRY_RUN: false,

  // Sender display name
  SENDER_NAME: 'Weight Journey',
};

/** Goals used if a user has none saved (mirror of src/config/defaultGoals.js). */
const DEFAULT_GOALS = {
  stepTarget: 20000,
  waterTarget: 3,
  workoutTarget: 2,
  sleepTarget: 8,
  calorieTarget: 1800,
  consistencyTarget: 80,
};
