// ─────────────────────────────────────────────────────────────────────────────
// APP CONFIG — central place for app-wide settings.
// ─────────────────────────────────────────────────────────────────────────────
export const appConfig = {
  appName: 'Weight Journey',

  // LOGIN: users type a short username ("Rohith"). It is turned into the Firebase email
  //   `${username.toLowerCase()}@${authEmailDomain}`  →  rohith@weightjourney.app
  // Create users with exactly those emails in Firebase Console → Authentication.
  // (Typing a full email address on the login screen also works.)
  // See HOW_TO_CHANGE_USERS.md.
  authEmailDomain: 'weightjourney.app',

  // Quick-add water buttons (ml)
  waterQuickAmounts: [250, 500, 750, 1000],

  // Reasons offered when "Did you overeat?" = Yes
  overeatReasons: ['Stress', 'Boredom', 'Cravings', 'Social event', 'Hunger', 'Other'],

  // Window of data kept live-synced. Older data is fetched on demand (e.g. "ALL" range).
  liveWindowDays: 400,

  // Workout types for the Activity page
  workoutTypes: ['Walking', 'Running', 'Gym', 'Home workout', 'Yoga', 'Cycling', 'Sports', 'Swimming', 'Other'],

  // Consistency heatmap buckets (percent). Colours live in src/index.css (--heat-0..5).
  heatBuckets: [
    { min: 0, max: 0, label: '0%' },
    { min: 1, max: 25, label: '1–25%' },
    { min: 26, max: 50, label: '26–50%' },
    { min: 51, max: 75, label: '51–75%' },
    { min: 76, max: 99, label: '76–99%' },
    { min: 100, max: 100, label: '100%' },
  ],
};
