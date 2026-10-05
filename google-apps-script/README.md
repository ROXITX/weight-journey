# 📧 Email reminders (Google Apps Script)

Free scheduled emails sent from **your own Gmail**: no server, no paid email API, and no passwords or keys in GitHub.

| Email | Default | What it says |
|---|---|---|
| 🌅 Morning | 07:00 | Today's goals (water, steps, workouts, sleep, calories), **"Don't forget your water bottle!"**, yesterday's score |
| 💧 Water | every 2 h, 09:00–21:00 | `1.5 / 3 L` progress. **Skipped automatically once your water goal is reached** |
| 📊 Evening check-in | 19:00 | "Steps fulfilled?", steps / water / workouts / consistency bars, ❌ what's still remaining |
| 🌙 Night review | 21:30 | Checklist of what's logged vs missing (weight, water, steps, workout, food, sleep, journal) + link to the app |

Each user sets their own times, on/off switches, email address and time zone in the app: **Settings → Reminders**.
The script reads those settings from Firestore every 15 minutes and sends whatever is due. Each email is sent at most once per day (water: once per time slot).

## How it works

```
Every 15 min → tick()
   ├─ read users/* from Firestore (only users with reminders ON + an email)
   ├─ is a reminder due in the user's time zone?  (scheduled time ≤ now < time + 45 min)
   ├─ already sent today? (Script Properties flag) → skip
   ├─ read today's dailyLogs / waterLogs / weightLogs → compute score (same formula as the app)
   └─ MailApp.sendEmail(...)  from your Gmail
```

Firestore is read with the **script owner's own Google login** (`ScriptApp.getOAuthToken()`), so no service-account key is needed. That's also why the script must be created by the **same Google account that owns the Firebase project** (or one added as Owner/Editor in Firebase → Project settings → Users and permissions).

---

## Setup (≈ 10 minutes)

### 1. Create the Apps Script project
1. Sign in to the Google account that owns your Firebase project.
2. Open **https://script.google.com** → **New project**. Rename it to `Weight Journey Reminders`.

### 2. Add the script files
1. Left sidebar → ⚙️ **Project Settings** → tick **"Show 'appsscript.json' manifest file in editor"**.
2. Back in **Editor** (`< >`), create these files with **+ → Script** (names without `.gs`) and paste the contents from this folder:
   - `config.gs`
   - `firestore.gs`
   - `emailTemplates.gs`
   - `Code.gs` (replace the default `Code.gs` content)
3. Open `appsscript.json` and replace its content with this folder's `appsscript.json`.
4. Click 💾 **Save**.

### 3. Configure (`config.gs`)
```js
FIREBASE_PROJECT_ID: 'weight-journey-12345',            // Firebase → Project settings → Project ID
APP_URL: 'https://<your-github-username>.github.io/<repo>/', // your deployed app
```
Everything else can stay as it is. The `appsscript.json` time zone is only a fallback, because each user's time zone comes from the app.

### 4. Set the recipient email (in the app)
In the app open **Settings → Reminders** and:
- turn **Email reminders** ON
- enter your **email** (e.g. your Gmail)
- check the **time zone** (e.g. `Asia/Kolkata`)
- choose the times and water frequency, then tap **Save reminders**

Do this for each user (Rohith, Sastika…). Each person gets their own emails.

### 5. Authorize and test an email
1. In the editor choose the function **`listUsers`** from the dropdown → **Run**.
2. Google asks for permission → **Review permissions** → pick your account →
   *"Google hasn't verified this app"* → **Advanced** → **Go to Weight Journey Reminders (unsafe)** → **Allow**.
   (It's your own script; this warning is normal for personal scripts.)
3. **Execution log** should list your users with `reminders=ON`.
4. Run **`testMorning`**, then check your inbox (and the Spam folder the first time; mark it *Not spam*).
   `testWater`, `testEvening`, `testNight` and `testAll` send the other emails immediately.

### 6. Turn on the schedule
Run **`setup`** once. It creates a trigger that runs `tick()` every 15 minutes.
Check it under ⏰ **Triggers** in the left sidebar.

That's it ✅

---

## Everyday changes

| I want to… | Do this |
|---|---|
| Change reminder times / water frequency | App → Settings → Reminders → Save. Takes effect within 15 min. |
| Turn one reminder off | App → toggle that reminder off |
| Pause all my emails | App → turn **Email reminders** OFF |
| Change who receives emails | App → Settings → Reminders → Email |
| Stop the whole system | Apps Script → run **`removeTriggers`** (or delete the trigger under ⏰ Triggers) |
| Only send to some users | `config.gs` → `ONLY_UIDS: ['uid1']` (UIDs: Firebase → Authentication) |
| Try without sending | `config.gs` → `DRY_RUN: true`, then check the Execution log |
| Change email text / design | `emailTemplates.gs` |

After editing script files, click 💾 Save. The trigger picks up the new code automatically.

## Troubleshooting

| Problem | Fix |
|---|---|
| `Firestore 403 … PERMISSION_DENIED` | The script's Google account isn't Owner/Editor of the Firebase project → add it in Firebase → Project settings → Users and permissions. |
| `Firestore 403 … SERVICE_DISABLED / API has not been used in project` | Check `FIREBASE_PROJECT_ID` is correct. If it still fails: Apps Script → Project Settings → **Google Cloud Platform (GCP) Project → Change project** → enter your Firebase project's **project number** (Firebase → Project settings). |
| `Firestore 404` / `Users in Firestore: 0` | Wrong project ID, or nobody has logged in and finished onboarding yet. |
| `listUsers` shows `reminders=off` | Turn reminders ON in the app and tap **Save reminders**. |
| Emails arrive at the wrong time | The time zone in the app is wrong (use names like `Asia/Kolkata`, `Europe/London`). |
| Emails in Spam | Mark one as *Not spam* or add a Gmail filter "Never send it to Spam". |
| "Service invoked too many times: email" | Gmail limit (~100 emails/day on a free account). Use a longer water interval. |

## Free-tier usage (₹0)
- Gmail (MailApp): ~100 recipients/day on a consumer account. One user gets about 10 emails a day.
- Apps Script triggers: 96 runs/day at 15 min, well within the limits.
- Firestore: about 3 small reads per user per reminder, far below the free 50,000 reads/day.

## Security
- No passwords, API keys or service-account JSON anywhere.
- The script only **reads** Firestore. It never writes your data.
- Only someone with access to *your* Google account / Firebase project can run it.
