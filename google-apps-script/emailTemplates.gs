/**
 * Email templates. Each returns { subject, html, text }.
 * Inline styles + tables only (what email clients support). Works in Gmail light & dark.
 */

function esc_(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function litres_(ml) {
  return (Math.round((ml || 0) / 100) / 10).toFixed(1);
}
function bar_(pct, color) {
  const p = Math.max(0, Math.min(100, Math.round(pct || 0)));
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#E5E7EB;border-radius:99px"><tr>' +
    '<td width="' + Math.max(p, 1) + '%" style="background:' + color + ';height:8px;border-radius:99px;font-size:0;line-height:0">&nbsp;</td>' +
    (p < 100 ? '<td style="font-size:0;line-height:0">&nbsp;</td>' : '') + '</tr></table>';
}

/** Metric row: label, "value / target", progress bar. */
function metric_(icon, label, value, target, pct, color) {
  const done = pct >= 100;
  return '<tr><td style="padding:10px 0">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>' +
    '<td style="font:600 14px Arial,sans-serif;color:#111827">' + icon + ' ' + esc_(label) + '</td>' +
    '<td align="right" style="font:700 14px Arial,sans-serif;color:' + (done ? '#059669' : '#111827') + '">' + esc_(value) +
    '<span style="color:#6B7280;font-weight:400"> / ' + esc_(target) + '</span>' + (done ? ' ✅' : '') + '</td></tr>' +
    '<tr><td colspan="2" style="padding-top:6px">' + bar_(pct, done ? '#10B981' : color) + '</td></tr></table></td></tr>';
}

function list_(items, color, mark) {
  if (!items.length) return '';
  return items.map(function (i) {
    return '<div style="font:14px Arial,sans-serif;color:#111827;padding:7px 12px;margin:4px 0;border-radius:10px;background:' + color + '">' + mark + ' ' + esc_(i) + '</div>';
  }).join('');
}

/** Shared layout: gradient header, white card, CTA button, footer. */
function layout_(o) {
  return '<!doctype html><html><body style="margin:0;padding:0;background:#F4F5F9">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F9;padding:24px 12px"><tr><td align="center">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px">' +
    // header
    '<tr><td style="background:linear-gradient(135deg,' + o.from + ',' + o.to + ');background-color:' + o.from + ';border-radius:20px 20px 0 0;padding:28px 24px;text-align:center">' +
    '<div style="font-size:44px;line-height:1">' + o.emoji + '</div>' +
    '<div style="font:800 22px Arial,sans-serif;color:#FFFFFF;margin-top:10px">' + esc_(o.title) + '</div>' +
    (o.subtitle ? '<div style="font:14px Arial,sans-serif;color:#FFFFFF;opacity:.9;margin-top:6px">' + esc_(o.subtitle) + '</div>' : '') +
    '</td></tr>' +
    // body
    '<tr><td style="background:#FFFFFF;border-radius:0 0 20px 20px;padding:22px 24px 26px">' + o.body +
    '<div style="text-align:center;margin-top:22px"><a href="' + esc_(o.ctaUrl) + '" style="display:inline-block;background:' + o.from +
    ';background-image:linear-gradient(135deg,#10B981,#3B82F6);color:#FFFFFF;text-decoration:none;font:700 15px Arial,sans-serif;padding:13px 26px;border-radius:14px">' +
    esc_(o.cta) + ' →</a></div>' +
    '</td></tr>' +
    '<tr><td style="text-align:center;font:12px Arial,sans-serif;color:#9CA3AF;padding:16px">Weight Journey · change or stop reminders in the app: Settings → Reminders<br>Estimates only — not medical advice.</td></tr>' +
    '</table></td></tr></table></body></html>';
}

function section_(title, inner) {
  return '<div style="font:700 12px Arial,sans-serif;letter-spacing:1.5px;color:#6B7280;text-transform:uppercase;margin:18px 0 6px">' + title + '</div>' + inner;
}

// ── 🌅 Morning ──────────────────────────────────────────────────────────────
function morningEmail(c) {
  const g = c.goals;
  const y = c.yesterday;
  const goals = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    [['💧', 'Water', g.waterTarget + ' L'], ['🚶', 'Steps', fmtInt_(g.stepTarget)], ['🏋️', 'Workouts', g.workoutTarget], ['😴', 'Sleep', g.sleepTarget + ' hours'], ['🔥', 'Calories', fmtInt_(g.calorieTarget) + ' kcal']]
      .map(function (r) {
        return '<tr><td style="font:15px Arial,sans-serif;color:#111827;padding:6px 0">' + r[0] + ' ' + r[1] + '</td><td align="right" style="font:700 15px Arial,sans-serif;color:#111827">' + r[2] + '</td></tr>';
      }).join('') + '</table>';
  const bottle = '<div style="margin-top:16px;padding:14px;border-radius:14px;background:#E0F2FE;font:700 15px Arial,sans-serif;color:#0369A1;text-align:center">🧴 Don\'t forget your water bottle!</div>';
  const yest = y.logged
    ? section_('Yesterday', '<div style="font:15px Arial,sans-serif;color:#111827">You completed <b>' + y.done + ' / ' + y.total + '</b> goals (<b>' + y.pct + '%</b>). ' +
        (y.pct >= g.consistencyTarget ? 'Great job — keep the streak alive! 🔥' : "Today's a fresh start 💪") + '</div>')
    : '';
  const html = layout_({
    emoji: '🌅', title: 'Good morning ' + c.name + '!', subtitle: "Here are today's goals",
    from: '#F59E0B', to: '#EC4899', ctaUrl: c.appUrl + '#/today', cta: 'Open today',
    body: section_("Today's goals", goals) + bottle + yest,
  });
  const text = 'Good morning ' + c.name + ' 🌅\n\nToday\'s goals:\n💧 Water: ' + g.waterTarget + ' L\n🚶 Steps: ' + fmtInt_(g.stepTarget) +
    '\n🏋️ Workout: ' + g.workoutTarget + '\n😴 Sleep: ' + g.sleepTarget + ' hours\n\nDon\'t forget your water bottle.\n\n' + c.appUrl + '#/today';
  return { subject: '🌅 Good morning ' + c.name + ' — today\'s goals', html: html, text: text };
}

// ── 💧 Water ────────────────────────────────────────────────────────────────
function waterEmail(c) {
  const s = c.status;
  const target = c.goals.waterTarget * 1000;
  const pct = target ? (s.waterMl / target) * 100 : 0;
  const left = Math.max(0, target - s.waterMl);
  const body = '<div style="text-align:center;font:800 40px Arial,sans-serif;color:#0284C7">' + litres_(s.waterMl) +
    '<span style="font-size:20px;color:#6B7280"> / ' + c.goals.waterTarget.toFixed(1) + ' L</span></div>' +
    '<div style="margin:12px 0 6px">' + bar_(pct, '#0EA5E9') + '</div>' +
    '<div style="text-align:center;font:15px Arial,sans-serif;color:#111827;margin-top:10px">' + Math.round(pct) + '% · <b>' + fmtInt_(left) + ' ml</b> to go. Keep going! 💪</div>' +
    '<div style="text-align:center;font:13px Arial,sans-serif;color:#6B7280;margin-top:6px">Tip: drink a glass (≈250 ml) right now and log it.</div>';
  return {
    subject: '💧 Water reminder — ' + litres_(s.waterMl) + ' / ' + c.goals.waterTarget + ' L',
    html: layout_({ emoji: '💧', title: 'Water reminder', subtitle: "You've consumed", from: '#0EA5E9', to: '#3B82F6', ctaUrl: c.appUrl + '#/water', cta: 'Log water', body: body }),
    text: '💧 Water Reminder\n\nYou\'ve consumed:\n' + litres_(s.waterMl) + ' / ' + c.goals.waterTarget + ' L\n\nKeep going!\n\n' + c.appUrl + '#/water',
  };
}

// ── 📊 Evening check-in ─────────────────────────────────────────────────────
function eveningEmail(c) {
  const s = c.status;
  const g = c.goals;
  const metrics = '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' +
    metric_('🚶', 'Steps', fmtInt_(s.steps), fmtInt_(g.stepTarget), (s.steps / g.stepTarget) * 100, '#F97316') +
    metric_('💧', 'Water', litres_(s.waterMl), g.waterTarget + ' L', (s.waterMl / (g.waterTarget * 1000)) * 100, '#0EA5E9') +
    metric_('🏋️', 'Workout', s.workouts, g.workoutTarget, (s.workouts / g.workoutTarget) * 100, '#8B5CF6') +
    metric_('📊', 'Consistency', s.pct + '%', g.consistencyTarget + '%', (s.pct / g.consistencyTarget) * 100, '#3B82F6') +
    '</table>';
  const stepsOk = s.steps >= g.stepTarget;
  const headline = stepsOk ? '🎉 Step goal done!' : 'Steps fulfilled? Not yet — ' + fmtInt_(g.stepTarget - s.steps) + ' to go';
  const missed = s.missed.slice(0, 10);
  const body = '<div style="font:700 16px Arial,sans-serif;color:' + (stepsOk ? '#059669' : '#B45309') + ';text-align:center;margin-bottom:6px">' + headline + '</div>' +
    metrics + (missed.length ? section_('Remaining', list_(missed, '#FEF2F2', '❌')) : section_('Remaining', '<div style="font:15px Arial,sans-serif;color:#059669">Nothing left — perfect day so far! 🎉</div>')) +
    (s.missed.length > missed.length ? '<div style="font:12px Arial,sans-serif;color:#6B7280">+ ' + (s.missed.length - missed.length) + ' more in the app</div>' : '');
  return {
    subject: '📊 Daily check-in — ' + s.pct + '% · ' + (stepsOk ? 'steps done ✅' : fmtInt_(g.stepTarget - s.steps) + ' steps to go'),
    html: layout_({ emoji: '📊', title: 'Daily check-in', subtitle: c.name + ', here\'s how today is going', from: '#3B82F6', to: '#8B5CF6', ctaUrl: c.appUrl + '#/today', cta: 'Update today', body: body }),
    text: '📊 DAILY CHECK-IN\n\nSteps: ' + fmtInt_(s.steps) + ' / ' + fmtInt_(g.stepTarget) + '\nWater: ' + litres_(s.waterMl) + ' / ' + g.waterTarget + ' L\nWorkout: ' + s.workouts + ' / ' + g.workoutTarget +
      '\nConsistency: ' + s.pct + '%\n\nRemaining:\n' + s.missed.map(function (m) { return '❌ ' + m; }).join('\n') + '\n\n' + c.appUrl + '#/today',
  };
}

// ── 🌙 Night review ─────────────────────────────────────────────────────────
function nightEmail(c) {
  const s = c.status;
  const g = c.goals;
  const checks = [
    ['⚖️ Weight', s.weight != null],
    ['💧 Water', s.waterMl > 0],
    ['🚶 Steps', s.steps > 0],
    ['🏋️ Workout', s.workouts > 0],
    ['🍽️ Food (did you overeat?)', s.foodAnswered],
    ['😴 Sleep', s.sleepHours != null],
    ['📝 Journal', s.journal],
  ];
  const pending = checks.filter(function (x) { return !x[1]; }).length;
  const rows = checks.map(function (x) {
    return '<tr><td style="font:15px Arial,sans-serif;color:#111827;padding:7px 0;border-bottom:1px solid #F3F4F6">' + x[0] + '</td>' +
      '<td align="right" style="font:700 14px Arial,sans-serif;color:' + (x[1] ? '#059669' : '#DC2626') + ';border-bottom:1px solid #F3F4F6">' + (x[1] ? '✓ Logged' : '✗ Missing') + '</td></tr>';
  }).join('');
  const summary = '<div style="text-align:center;margin-bottom:8px"><span style="font:800 36px Arial,sans-serif;color:#111827">' + s.pct + '%</span>' +
    '<div style="font:14px Arial,sans-serif;color:#6B7280">' + s.done + ' / ' + s.total + ' goals today</div></div>' + bar_(s.pct, s.pct >= g.consistencyTarget ? '#10B981' : '#F59E0B');
  const body = summary +
    section_('Have you completed today\'s tracking?', '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows + '</table>') +
    (s.missed.length ? section_('Missed today', list_(s.missed.slice(0, 8), '#FEF2F2', '✗')) : '') +
    '<div style="font:14px Arial,sans-serif;color:#6B7280;margin-top:14px;text-align:center">' +
    (pending ? pending + ' item' + (pending > 1 ? 's' : '') + ' still to log — it takes 30 seconds.' : 'Everything is logged. Sleep well! 😴') + '</div>';
  return {
    subject: '🌙 Daily review — ' + s.pct + '%' + (pending ? ' · ' + pending + ' to log' : ' · all logged ✅'),
    html: layout_({ emoji: '🌙', title: 'Daily review', subtitle: 'Wrap up your day, ' + c.name, from: '#4F46E5', to: '#0F172A', ctaUrl: c.appUrl + '#/today', cta: 'Complete tracking', body: body }),
    text: '🌙 DAILY REVIEW\n\nHave you completed today\'s tracking?\n\n' + checks.map(function (x) { return (x[1] ? '✓ ' : '✗ ') + x[0]; }).join('\n') +
      '\n\nToday: ' + s.pct + '% (' + s.done + '/' + s.total + ')\n\n' + c.appUrl + '#/today',
  };
}
