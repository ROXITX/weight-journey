// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT GOALS — change defaults for NEW users here.
// Existing users change their own goals in the app: Settings → Goals.
// ─────────────────────────────────────────────────────────────────────────────
export const defaultGoals = {
  stepTarget: 20000, // steps per day
  waterTarget: 3, // litres per day
  workoutTarget: 2, // workouts per day (morning + evening)
  sleepTarget: 8, // hours per night
  calorieTarget: 1800, // kcal per day (eating target)
  consistencyTarget: 80, // % of weighted daily goals that counts as a "good day" (streaks)
};

// Activity multipliers used for the TDEE (maintenance calories) estimate.
export const activityLevels = [
  { id: 'sedentary', label: 'Sedentary', hint: 'Desk job, little exercise', factor: 1.2 },
  { id: 'light', label: 'Lightly active', hint: 'Exercise 1–3 days/week', factor: 1.375 },
  { id: 'moderate', label: 'Moderately active', hint: 'Exercise 3–5 days/week', factor: 1.55 },
  { id: 'active', label: 'Very active', hint: 'Exercise 6–7 days/week', factor: 1.725 },
  { id: 'athlete', label: 'Extra active', hint: 'Hard training / physical job', factor: 1.9 },
];

export const defaultProfile = {
  name: '',
  age: 28,
  heightCm: 170,
  gender: 'male',
  startWeight: null,
  targetWeight: null,
  activityLevel: 'light',
  email: '',
  maintenanceOverride: null, // set a number to override the estimated maintenance calories
  startDate: null,
};

export const defaultNotifications = {
  enabled: false,
  email: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
  morningOn: true,
  morning: '07:00',
  waterOn: true,
  waterEveryHours: 2,
  waterStart: '09:00',
  waterEnd: '21:00',
  eveningOn: true,
  evening: '19:00',
  nightOn: true,
  night: '21:30',
};

export const defaultSettings = {
  theme: 'system', // 'light' | 'dark' | 'system'
  shareWithFriends: true, // share a progress SUMMARY with friends (Friends tab)
  shareWeight: false, // also share exact body weight with friends
};
