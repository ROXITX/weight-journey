/**
 * Weight Journey — email reminders.
 *
 *   setup()           → run ONCE: creates the time trigger (every CONFIG.TRIGGER_EVERY_MINUTES min)
 *   tick()            → called by the trigger: sends whatever reminders are due
 *   removeTriggers()  → turns all reminders off (deletes the trigger)
 *   testMorning() / testWater() / testEvening() / testNight() / testAll()
 *                     → send a sample immediately to the first user with reminders enabled
 *   listUsers()       → logs which users / settings the script can see
 *
 * Each reminder is sent at most once per day (water: once per slot), tracked in Script Properties.
 */

// ── Triggers ────────────────────────────────────────────────────────────────

function setup() {
  removeTriggers();
  ScriptApp.newTrigger('tick').timeBased().everyMinutes(CONFIG.TRIGGER_EVERY_MINUTES).create();
  Logger.log('✅ Trigger created: tick() every ' + CONFIG.TRIGGER_EVERY_MINUTES + ' minutes.');
  listUsers();
}

function removeTriggers() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'tick') ScriptApp.deleteTrigger(t);
  });
  Logger.log('Reminder triggers removed.');
}

// ── Main loop ───────────────────────────────────────────────────────────────

function tick() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  try {
    cleanupSentFlags_();
    getUsers_().forEach(function (u) {
      try {
        processUser_(u, new Date());
      } catch (e) {
        Logger.log('⚠️ ' + u.id + ': ' + e);
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function processUser_(u, now) {
  const n = u.notifications;
  const tz = n.timezone || Session.getScriptTimeZone();
  const today = Utilities.formatDate(now, tz, 'yyyy-MM-dd');
  const nowMin = toMin_(Utilities.formatDate(now, tz, 'HH:mm'));
  const win = CONFIG.SEND_WINDOW_MINUTES;
  const due = function (at) {
    const m = toMin_(at);
    return m != null && nowMin >= m && nowMin - m < win;
  };
  let ctx = null; // loaded lazily (saves Firestore reads)
  const getCtx = function () {
    return ctx || (ctx = buildContext_(u, today, tz));
  };

  if (n.morningOn && due(n.morning) && !wasSent_(u.id, today, 'morning')) {
    send_(u, morningEmail(getCtx()));
    markSent_(u.id, today, 'morning');
  }

  if (n.waterOn) {
    const start = toMin_(n.waterStart || '09:00');
    const end = toMin_(n.waterEnd || '21:00');
    const every = Math.max(30, Math.round((Number(n.waterEveryHours) || 2) * 60));
    if (nowMin >= start && nowMin <= end + win) {
      const slot = Math.floor((nowMin - start) / every);
      const slotTime = start + slot * every;
      if (slotTime <= end && nowMin - slotTime < win && !wasSent_(u.id, today, 'water' + slot)) {
        const c = getCtx();
        // Don't nag once the water goal is reached.
        if (c.status.waterMl < c.goals.waterTarget * 1000) send_(u, waterEmail(c));
        markSent_(u.id, today, 'water' + slot);
      }
    }
  }

  if (n.eveningOn && due(n.evening) && !wasSent_(u.id, today, 'evening')) {
    send_(u, eveningEmail(getCtx()));
    markSent_(u.id, today, 'evening');
  }

  if (n.nightOn && due(n.night) && !wasSent_(u.id, today, 'night')) {
    send_(u, nightEmail(getCtx()));
    markSent_(u.id, today, 'night');
  }
}

// ── Data ────────────────────────────────────────────────────────────────────

/** Users who enabled reminders in the app → [{ id, doc, notifications, email }] */
function getUsers_() {
  return fsList('users')
    .filter(function (d) {
      return !CONFIG.ONLY_UIDS.length || CONFIG.ONLY_UIDS.indexOf(d.id) !== -1;
    })
    .map(function (d) {
      const n = d.data.notifications || {};
      return { id: d.id, doc: d.data, notifications: n, email: n.email || (d.data.profile || {}).email || CONFIG.FALLBACK_EMAIL };
    })
    .filter(function (u) {
      return u.notifications.enabled && u.email;
    });
}

function buildContext_(u, date, tz) {
  const goals = Object.assign({}, DEFAULT_GOALS, u.doc.goals || {});
  const habits = u.doc.habits && u.doc.habits.length ? u.doc.habits : FALLBACK_HABITS;
  const day = loadDay_(u.id, date);
  const yDate = Utilities.formatDate(new Date(new Date(date + 'T12:00:00Z').getTime() - 864e5), 'UTC', 'yyyy-MM-dd');
  return {
    name: (u.doc.profile && u.doc.profile.name) || 'there',
    date: date,
    tz: tz,
    goals: goals,
    status: evaluateDay_(day, habits, goals),
    yesterday: evaluateDay_(loadDay_(u.id, yDate), habits, goals),
    appUrl: CONFIG.APP_URL,
  };
}

function loadDay_(uid, date) {
  const base = 'users/' + uid + '/';
  const daily = fsGet(base + 'dailyLogs/' + date) || {};
  const water = fsGet(base + 'waterLogs/' + date) || {};
  const weight = fsGet(base + 'weightLogs/' + date);
  return {
    date: date,
    logged: Boolean(Object.keys(daily).length || water.totalMl || weight),
    habits: daily.habits || {},
    steps: daily.steps || 0,
    workouts: daily.workouts || [],
    food: daily.food || {},
    sleep: daily.sleep || {},
    bowel: daily.bowel || {},
    journal: daily.journal || {},
    waterMl: water.totalMl || 0,
    weight: weight ? weight.weight : null,
  };
}

const FALLBACK_HABITS = [
  { id: 'morning_workout', label: 'Morning workout', icon: '🌅', weight: 2, enabled: true },
  { id: 'evening_workout', label: 'Evening workout', icon: '🌆', weight: 2, enabled: true },
  { id: 'steps_target', label: 'Steps target', icon: '🚶', weight: 2, enabled: true, auto: 'steps' },
  { id: 'water_target', label: 'Water target', icon: '💧', weight: 2, enabled: true, auto: 'water' },
  { id: 'no_junk', label: 'No junk food', icon: '🍔', weight: 2, enabled: true },
  { id: 'no_sugar', label: 'No added sugar', icon: '🍬', weight: 2, enabled: true },
];

/**
 * Same scoring as the app (src/utils/scoring.js):
 * pct = Σ weight of completed habits / Σ weight of enabled habits.
 */
function evaluateDay_(day, habits, goals) {
  const wd = new Date(day.date + 'T12:00:00Z').getUTCDay();
  const weekend = wd === 0 || wd === 6;
  const items = habits
    .filter(function (h) {
      if (!h.enabled) return false;
      if (h.frequency === 'weekdays') return !weekend;
      if (h.frequency === 'weekends') return weekend;
      return true;
    })
    .map(function (h) {
      let done;
      let miss = h.label;
      if (h.auto === 'steps') {
        done = day.steps >= goals.stepTarget;
        miss = fmtInt_(goals.stepTarget - day.steps) + ' steps remaining';
      } else if (h.auto === 'water') {
        done = day.waterMl >= goals.waterTarget * 1000;
        miss = fmtInt_(goals.waterTarget * 1000 - day.waterMl) + ' ml water remaining';
      } else if (h.auto === 'sleep') {
        done = (day.sleep.hours || 0) >= goals.sleepTarget;
        miss = 'Sleep target (' + (day.sleep.hours || 0) + 'h / ' + goals.sleepTarget + 'h)';
      } else if (h.auto === 'bowel') {
        done = (day.bowel.count || 0) >= 1;
      } else if (!h.type || h.type === 'boolean') {
        done = day.habits[h.id] === true;
      } else {
        const v = Number(day.habits[h.id] || 0);
        done = v >= (Number(h.target) || 1);
        miss = h.label + ': ' + v + ' / ' + h.target + ' ' + (h.unit || '');
      }
      return { habit: h, done: done, miss: miss, weight: Number(h.weight) || 1 };
    });
  const wTotal = items.reduce(function (s, i) { return s + i.weight; }, 0);
  const wDone = items.reduce(function (s, i) { return s + (i.done ? i.weight : 0); }, 0);
  const workouts = (day.habits.morning_workout ? 1 : 0) + (day.habits.evening_workout ? 1 : 0) + (day.workouts || []).length;
  return {
    logged: day.logged,
    pct: wTotal ? Math.round((wDone / wTotal) * 100) : 0,
    done: items.filter(function (i) { return i.done; }).length,
    total: items.length,
    completed: items.filter(function (i) { return i.done; }).map(function (i) { return (i.habit.icon || '') + ' ' + i.habit.label; }),
    missed: items.filter(function (i) { return !i.done; }).map(function (i) { return (i.habit.icon || '') + ' ' + i.miss; }),
    steps: day.steps,
    waterMl: day.waterMl,
    workouts: workouts,
    sleepHours: day.sleep.hours || null,
    weight: day.weight,
    foodAnswered: day.food.overate === true || day.food.overate === false,
    journal: Object.keys(day.journal).some(function (k) { return day.journal[k] && String(day.journal[k]).trim(); }),
  };
}

// ── Sending ─────────────────────────────────────────────────────────────────

function send_(u, mail) {
  if (CONFIG.DRY_RUN) {
    Logger.log('[DRY RUN] to ' + u.email + ': ' + mail.subject + '\n' + mail.text);
    return;
  }
  MailApp.sendEmail({ to: u.email, subject: mail.subject, htmlBody: mail.html, body: mail.text, name: CONFIG.SENDER_NAME });
  Logger.log('📧 ' + mail.subject + ' → ' + u.email);
}

// Sent flags: "sent|<uid>|<yyyy-MM-dd>|<type>"
function wasSent_(uid, date, type) {
  return PropertiesService.getScriptProperties().getProperty(['sent', uid, date, type].join('|')) === '1';
}
function markSent_(uid, date, type) {
  PropertiesService.getScriptProperties().setProperty(['sent', uid, date, type].join('|'), '1');
}
function cleanupSentFlags_() {
  const props = PropertiesService.getScriptProperties();
  const cutoff = Utilities.formatDate(new Date(Date.now() - 3 * 864e5), 'UTC', 'yyyy-MM-dd');
  Object.keys(props.getProperties()).forEach(function (k) {
    const parts = k.split('|');
    if (parts[0] === 'sent' && parts[2] < cutoff) props.deleteProperty(k);
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function toMin_(hhmm) {
  if (!hhmm) return null;
  const p = String(hhmm).split(':');
  return Number(p[0]) * 60 + Number(p[1] || 0);
}
function fmtInt_(n) {
  return Math.max(0, Math.round(n || 0)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// ── Manual tests (run from the editor) ──────────────────────────────────────

function testUser_() {
  const users = getUsers_();
  if (!users.length) throw new Error('No user has reminders enabled with an email. Turn them on in the app: Settings → Reminders.');
  const u = users[0];
  const tz = u.notifications.timezone || Session.getScriptTimeZone();
  return { u: u, ctx: buildContext_(u, Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd'), tz) };
}
function testMorning() { const t = testUser_(); send_(t.u, morningEmail(t.ctx)); }
function testWater() { const t = testUser_(); send_(t.u, waterEmail(t.ctx)); }
function testEvening() { const t = testUser_(); send_(t.u, eveningEmail(t.ctx)); }
function testNight() { const t = testUser_(); send_(t.u, nightEmail(t.ctx)); }
function testAll() { testMorning(); testWater(); testEvening(); testNight(); }

function listUsers() {
  const all = fsList('users');
  Logger.log('Users in Firestore: ' + all.length);
  all.forEach(function (d) {
    const n = d.data.notifications || {};
    Logger.log('• ' + ((d.data.profile || {}).name || '?') + ' (' + d.id + ') reminders=' + (n.enabled ? 'ON' : 'off') + ' email=' + (n.email || '—') +
      ' tz=' + (n.timezone || 'script') + ' morning=' + n.morning + ' water every ' + n.waterEveryHours + 'h ' + n.waterStart + '–' + n.waterEnd +
      ' evening=' + n.evening + ' night=' + n.night);
  });
}
