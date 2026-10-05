# Original Request (reference)

> This file is the source-of-truth spec. `PROGRESS.md` tracks what is done.

## User's own words (summary)

React + Node.js(-free, Firebase) website to track my weight-loss journey. Extremely good-looking, rich transitions and animations,
mobile-first (used mostly on phone, must work on PC), hosted on GitHub Pages.

- Weight tracking + weight logger.
- Daily "Today" log with checkboxes: morning workout, evening workout, no junk, no sugar, no oil items, walking steps 20,000,
  cold-water bath, drinking 3 L water — litres & steps configurable in a settings pane. Add more fields if useful.
- Number of times pooped, "did you over eat?", diet drinks / zero-sugar drinks.
- Logs page: each day — what was ticked and what was not, water, weight, checkboxes.
- Dashboard with all KPIs, weight-loss chart (week, month, ...), date pickers, maintenance calories at the top.
- Consistency graphs in different forms + GitHub-style matrix coloured by % of goals achieved, with a legend.
- Dashboard ranges: 3D, 10D, week, month, year (configurable).
- Water logger that sums litres drunk and shows it in the dashboard.
- Login page: user `Rohith` / password `Rohith`, user `Sastika` / password `Sastika` — and tell me where to change it.
- Email reminders: morning (carry water bottle), drink-water reminders, 7 PM "are steps fulfilled?" check.
- Colourful.

## Full detailed spec

🏃 Personal Weight Loss Journey Tracker
Build a premium, highly animated, mobile-first personal weight-loss and lifestyle tracking web application.
The application is primarily intended to be used from a mobile phone but must also provide an excellent desktop experience.
The application should feel like a real premium health/productivity application, not a basic CRUD dashboard.

### 1. TECHNOLOGY STACK
Frontend: React.js, Vite, Tailwind CSS, Framer Motion, Recharts, Lucide React, React Router, PWA support.
Backend / Cloud Data — Firebase: Firebase Authentication, Cloud Firestore, Firebase Storage only if required.
Do NOT create a traditional Node.js/Express backend unless a future feature genuinely requires it.
Hosting: GitHub Pages. The application must be compatible with GitHub Pages deployment.
Email Automation: Google Apps Script + Gmail/MailApp. Do NOT require a paid email API.
Google Apps Script will handle scheduled emails such as: Morning reminder, Water reminders, Evening check-in, Nightly review.
The React application itself must never contain email credentials.

### 2. HIGH-LEVEL ARCHITECTURE
```text
GitHub Pages (React + Vite, Tailwind, Framer Motion, Recharts, PWA)
        ▼
Firebase (Authentication, Firestore, Storage optional)
        ▼
Google Apps Script (Scheduled reminders, Gmail / MailApp)
        ▼
      Email
```
Target infrastructure cost ₹0 for normal personal usage (free quotas of GitHub, Firebase, Apps Script/Gmail). No paid services.

### 3. CORE PURPOSE
Track: Weight, Target weight, Weight loss, Maintenance calories, Daily calorie target, Water, Steps, Walking, Exercise,
Morning workout, Evening workout, Food quality, Junk food, Sugar, Oil, Sugary drinks, Diet/zero-sugar drinks, Overeating,
Snacking, Late-night eating, Sleep, Bathroom habits, Mood, Energy, Hunger, Daily journal, Personal habits, Consistency,
Streaks, Missed goals.
The app should answer: How am I doing today? Am I progressing toward my target weight? What did I accomplish?
What did I miss? How consistent have I been? What should I improve?

### 4. DESIGN REQUIREMENTS
Extremely polished, modern, premium, colorful, mobile-first, responsive, smooth, interactive, motivating, fast.
Not a generic Bootstrap/admin dashboard. Use: rounded cards, soft shadows, gradients, glass effects where appropriate,
animated progress rings, animated counters, interactive charts, smooth transitions, animated checkboxes, animated progress
bars, streak animations, heatmaps, micro-interactions, haptic-like visual feedback. Framer Motion throughout.
Animations premium, not excessive.

### 5. THEME
Dark mode, Light mode, System mode. Dark palette suggestion: Background #08090B, Cards #111318, Primary Emerald/Green,
Secondary Blue, Success Green, Warning Amber, Danger Red. Keep all theme colors centralized.

### 6. MOBILE-FIRST DESIGN
Bottom navigation, large touch targets, swipe-friendly components, floating quick actions, sticky progress indicators,
minimal typing, quick-add buttons. Desktop: sidebar, multi-column dashboard, larger charts, more information density.

### 7. PWA
Installable: Add to Home Screen, app icon, splash screen, standalone mode, offline caching where practical, fast loading.
No APK needed.

### 8. AUTHENTICATION
Firebase Authentication. Initially two users: Rohith, Sastika. Do NOT hard-code passwords inside React source code.
Create users through Firebase Authentication. Create a doc "HOW TO CHANGE USERS": add, remove, reset password,
change password. Each user has a unique Firebase UID.

### 9. FIRESTORE DATA STRUCTURE
```text
users/{uid}/ profile, settings, goals, habits,
  dailyLogs/YYYY-MM-DD, weightLogs/YYYY-MM-DD, waterLogs/YYYY-MM-DD, achievements/achievementId
```
UID isolates data. Rohith must never access Sastika's data. Proper security rules.

### 10. PROFILE
Name, Age, Height, Gender, Starting weight, Current weight, Target weight, Activity level, Email, Profile image (optional).

### 11. MAINTENANCE CALORIES
Estimate BMR and TDEE from age, height, weight, gender, activity level. Display prominently
("🔥 Estimated Maintenance 2,340 kcal/day"). Allow manual override. Configurable daily calorie target.
Clearly mark as estimates.

### 12. DASHBOARD (primary screen)
Top: "GOOD MORNING, ROHITH 👋 How are you doing today?" Display current weight, target, weight lost, remaining,
maintenance calories, today's consistency %, current streak.

### 13. DASHBOARD KPI CARDS
Current weight, weight lost, target weight, remaining weight, maintenance calories, water, steps, workout, sleep,
consistency, streak, junk-free days, sugar-free days, overeating-free days. Each: current value, target, percentage,
trend, optional sparkline.

### 14. WEIGHT TRACKING
Enter date, weight, optional note. Display: starting, current, target, highest, lowest, total lost, remaining,
average weekly loss, average monthly loss, % toward target, estimated target date.

### 15. WEIGHT CHART
Animated line chart. Ranges: 3D 7D 10D 1M 3M 6M 1Y ALL CUSTOM. Show actual, starting, target (reference lines).
Clicking a point shows date, weight, change from previous entry.

### 16. TODAY PAGE
Fastest page; complete daily tracking within 30 seconds. Weight, water quick buttons (+250/+500/+750/+1L),
steps, morning/evening workout, no junk, no sugar...

### 17. CONFIGURABLE GOALS
Nothing important hard-coded:
```js
goals: { stepTarget: 20000, waterTarget: 3, workoutTarget: 2, sleepTarget: 8, calorieTarget: 1800, consistencyTarget: 80 }
```
Changeable from Settings; changes update dashboard, progress bars, charts, daily score, analytics, notifications, heatmap.

### 18. WATER TRACKER
"2.4 L / 3.0 L 80%", animated bottle, quick buttons +250/+500/+750/+1L, custom amounts. Track daily, weekly avg,
monthly avg, best day, goal achievement, total consumed.

### 19. WATER HISTORY
Consumption by date (e.g. "October 5 — 2.8 / 3 L") + water trend chart.

### 20. STEPS
Today's steps, step target (default 20,000, configurable). Show current, remaining, completion %, weekly avg,
monthly avg, best day, total. Charts: daily steps, weekly avg, monthly avg, goal achievement.

### 21. WORKOUT TRACKING
Morning, evening, other workouts, duration, type. Allow count, duration, notes. Display weekly/monthly workouts,
workout streak, workout consistency.

### 22. DAILY HABITS (defaults, all configurable)
Exercise: Morning workout, Evening workout, Stretching, Walking, Steps target reached.
Food: No junk food, No added sugar, No unnecessary oil, Ate enough protein, Ate fruits/vegetables, Stayed within calorie
target, Did not overeat, No unnecessary snacking, No late-night eating.
Drinks: Water target achieved, No sugary drinks, No soft drinks, No unnecessary diet/zero-sugar drinks.
Lifestyle: Cold-water bath, Morning routine, Brushed teeth morning, Brushed teeth night, Slept on time, Woke on time,
Meditation, Reading, Reduced screen time.

### 23. CUSTOM HABITS
Add, edit, delete, enable/disable, set target, set unit, set frequency.
Types: Boolean, Number, Quantity, Duration, Repetition. (e.g. Drink water 3 litres; Walk 20,000 steps; Workout 2 times)

### 24. FOOD TRACKING (optional)
Meals: Breakfast, Lunch, Dinner, Snacks. Optional: meal name, calories, protein, carbs, fat, notes. Not forced.

### 25. FOOD DISCIPLINE
Ask daily "Did you overeat?" If yes: Why? Stress, Boredom, Cravings, Social event, Hunger, Other.
Also track: junk food, added sugar, sugary drinks, diet/zero-sugar drinks, excess oil, unnecessary snacking, late-night eating.

### 26. DIET / ZERO-SUGAR DRINKS
Sugary drink? Y/N. Diet/zero-sugar drink? Y/N. Number consumed. Stats: zero-sugar drinks this week, sugary drinks this
week, days without sugary drinks.

### 27. BATHROOM TRACKING (optional, private)
Number of bowel movements, quick input 0/1/2/3/4+, optional Morning/Afternoon/Evening/Night. No medical claims.

### 28. SLEEP
Sleep time, wake time, total sleep, target. Show average, consistency, goal achievement.

### 29. DAILY JOURNAL
How was your day? What went well? What went wrong? What caused cravings? What should I improve tomorrow?
Mood 1-10, Energy 1-10, Hunger 1-10. Saved by date.

### 30. DAILY CONSISTENCY SCORE
Daily % ("12 / 15 goals completed 80%"). Support weighted goals (e.g. Steps 20%, Water 15%, Workout 20%, Food 20%,
Sleep 10%, Other 15%). Weights configurable later.

### 31. MISSED GOALS
Prominently show "TODAY'S MISSED GOALS" (❌ Evening workout, ❌ 2,800 steps remaining, ❌ 400 ml water remaining...).

### 32. DAILY SUMMARY
End of day: "12 / 15 goals 80%", Completed list, Missed list.

### 33. GITHUB-STYLE CONSISTENCY HEATMAP
Square per day, colour: 0% grey, 1-25 very low, 26-50 low, 51-75 medium, 76-99 high, 100 perfect. Legend "Less □□□□□ More".
Ranges 1M 3M 6M 1Y ALL. Clicking a day opens its full daily log.

### 34. CALENDAR
Monthly. Each day shows consistency %, weight, water %, steps %, goal status; coloured by consistency; click → detail.

### 35. ANALYTICS
Weight (trend, weekly loss, monthly loss, total loss, avg rate), Water (avg, goal achievement, consistency),
Steps (avg, total, goal achievement), Workout (count, consistency), Food (junk-free, sugar-free, no-overeating,
sugary-drink days, diet-drink days), Sleep (avg, goal achievement), Overall (consistency, current streak, longest streak,
perfect days, missed days).

### 36. DATE FILTER
3D 7D 10D 1M 3M 6M 1Y ALL CUSTOM (From/To) on every major analytics section; charts & KPIs update dynamically.

### 37. STREAKS
Overall, weight logging, water, steps, workout, food discipline, journal. ("🔥 12 DAY STREAK")

### 38. ACHIEVEMENTS
Auto: Lost 1 kg, Lost 5 kg, Reached 75 kg, 7/14/30-day streak, Water goal 7 days, 20K steps 7 days, 30 days tracking.
Animated achievement cards.

### 39. WEIGHT JOURNEY
Large visual journey START 83 → 81 → 79 → 78.4 → 75 → TARGET 68. "You've completed 30.6% of your weight-loss journey."
Animated.

### 40. SMART INSIGHTS
JS-computed insights (steps change vs last week, water goal days, best consistency weekday, weekday you miss workouts,
weekly weight change, consistency vs last week). No AI required.

### 41–44. REMINDERS (Google Apps Script)
Morning (default 7:00 AM) with today's goals + "Don't forget your water bottle".
Water reminders every 1/2/3 h/custom; skip if goal reached ("You've consumed 1.5 / 3 L").
Evening check-in 7:00 PM (steps, water, workout, consistency, remaining items).
Night review 9:30 PM (have you completed tracking? + link to app).

### 45. GOOGLE APPS SCRIPT folder
`google-apps-script/` with Code.gs, config.gs, emailTemplates.gs, firestore.gs, README.md explaining: create script,
add script, configure Gmail, triggers, recipient, Firestore connection, test email, change times, disable. No secrets in GitHub.

### 46. EMAIL CONFIGURATION in settings
Email reminders ON/OFF, email, morning 07:00, water every 2 hours, evening 19:00, night 21:30.

### 47. LOGS PAGE
Complete history per day (weight, water x/y, steps x/y, consistency, workout, food, sleep, mood). Filtering.

### 48. QUICK ACTIONS
Mobile floating "+" → + Weight, + Water, + Steps, + Workout, + Journal. Minimal interaction.

### 49. SETTINGS
Profile, Goals, Habits (add/edit/delete/disable), Notifications, Appearance (light/dark/system),
Data (export JSON, export CSV, import, delete).

### 50. DATA EXPORT
JSON and CSV of weight, water, steps, habits, daily logs, journal, food, sleep, achievements.

### 51–52. PRIVACY & SECURITY
Users access only `/users/{theirOwnUID}` and its subcollections. Test the rules. No private data in public files.

### 53. CONFIGURATION FILES
`src/config/firebase.js`, `appConfig.js`, `defaultGoals.js` — easy to find defaults.

### 54. FIREBASE_SETUP.md
Create project, enable auth, create users, create Firestore, rules, register web app, add config, run locally,
deploy to GitHub Pages. Never commit Admin SDK credentials.

### 55. DEPLOYMENT.md
npm install / npm run dev / npm run build / npm run deploy. Vite base path for GitHub Pages. Router works on Pages
(SPA fallback if needed).

### 56. ENV
`.env.example` with only safe frontend Firebase config. Never private keys / SMTP / admin / service-account keys.

### 57–59. EMPTY / ERROR / LOADING STATES
Polished empty states with CTA everywhere. Friendly errors, never raw Firebase errors. Skeleton loaders.

### 60. ACCESSIBILITY
Keyboard nav, screen readers, focus states, contrast, large touch targets, reduced motion.

### 61. PERFORMANCE
Lazy loading, code splitting, efficient Firestore queries (range only), memoized charts, optimized animations.

### 62. COMPONENT ARCHITECTURE
components/{dashboard, habits, water, weight, logs, analytics, notifications, common}/... reusable.

### 63. ROUTES
/login /dashboard /today /weight /water /habits /activity /food /calendar /logs /analytics /settings /profile —
all protected except /login.

### 64–66. NAVIGATION
Mobile bottom nav: Home, Today, Analytics, Calendar, Settings. Desktop sidebar: Dashboard, Today, Weight, Water,
Activity, Food, Calendar, Logs, Analytics, Settings. Responsive dashboard (1 col mobile; 2–4 col desktop).

### 67–68. ANIMATION & CELEBRATIONS
Page transitions, cards, numbers, bars, rings, checkboxes, bottle, streaks, achievements, modals, charts, heatmap,
bottom nav. Respect prefers-reduced-motion. Tasteful milestone celebrations ("🎉 AMAZING! You've lost 5 kg!").

### 69. ONBOARDING
First login wizard: current weight, target, height, age, gender, activity, steps, water, workout, sleep, email,
reminder prefs → Firestore.

### 70. DAILY FLOW
Open → dashboard → weight → water → steps → habits → food questions → journal → score → missed → close. Very fast.

### 71. HEALTH UX
No medical claims. Calculations are estimates. No diagnosis.

### 72. TESTING CHECKLIST
Auth (login/logout/invalid/isolation), Weight (add/edit/delete/chart/range), Water, Steps, Habits, Daily logs,
Analytics ranges, Calendar, Settings, PWA, Firebase (rules/persistence/refresh), GitHub Pages (build/routing), Email.

### 73. CODE QUALITY
Clean components, reusable hooks (useAuth, useUser, useDailyLog, useWeight, useWater, useHabits, useAnalytics, useGoals),
centralized config, no duplicated logic, no hard-coded goals, no passwords/secrets in source.

### 74. FINAL UX
"My personal weight-loss command center." Greeting, streak, consistency bar, weight/lost/target, water/steps/workout,
weight chart, today's goals, missed, heatmap, insights.

### 75. DELIVERABLES
README.md, FIREBASE_SETUP.md, DEPLOYMENT.md, EMAIL_SETUP.md, ARCHITECTURE.md, .env.example,
google-apps-script/{Code.gs, config.gs, emailTemplates.gs, firestore.gs, README.md},
src/{components, pages, hooks, services, config, utils, firebase}. `npm install && npm run dev`, `npm run build`,
deployable to GitHub Pages.

### 76. PRIORITY
Phase 1 Core → Phase 2 Analytics → Phase 3 Premium UX → Phase 4 Email → Phase 5 Polish.

### 77. MOST IMPORTANT
Premium personal health dashboard, not form-and-table. Priorities: beautiful UI, easy logging, accurate calculations,
reliable persistence, useful analytics, clear missed-goal feedback, strong visual progress, configurable goals, mobile,
smooth animations, ₹0 architecture, security/privacy.
