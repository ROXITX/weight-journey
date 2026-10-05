# Email reminders: setup

The full step-by-step guide is in **[google-apps-script/README.md](google-apps-script/README.md)**.

## Quick version
1. Finish Firebase setup first (the app must be using Firebase, not local demo mode).
2. In the app: **Settings → Reminders** → turn on, enter your email + time zone, pick times → **Save reminders**.
3. Go to https://script.google.com with the **same Google account that owns the Firebase project** → New project.
4. Paste `google-apps-script/config.gs`, `firestore.gs`, `emailTemplates.gs`, `Code.gs` and `appsscript.json`.
5. In `config.gs` set `FIREBASE_PROJECT_ID` and `APP_URL`.
6. Run `listUsers` → allow permissions → run `testMorning` → check your inbox.
7. Run `setup` once to start the 15-minute schedule. Run `removeTriggers` to stop it.

| Reminder | Default | Notes |
|---|---|---|
| 🌅 Morning | 07:00 | Today's goals + "carry your water bottle" |
| 💧 Water | every 2 h, 09:00–21:00 | Stops once the water goal is reached |
| 📊 Evening check-in | 19:00 | Steps fulfilled? + what's remaining |
| 🌙 Night review | 21:30 | What's logged vs missing |

No email passwords or keys are stored in the app or in GitHub.
