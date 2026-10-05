// Achievement definitions. Each is evaluated from a context object; unlocked ones are saved to
// users/{uid}/achievements/{id} the first time they are reached (and celebrated once).

/**
 * ctx = { stats (weightStats), longest (overall longest streak), loggedDays, perfectDays,
 *         longestWater, longestSteps, longestWorkout }
 */
export function computeAchievements(ctx) {
  const { stats } = ctx;
  const list = [];
  const add = (id, icon, title, desc, unlocked, progress = unlocked ? 1 : 0) =>
    list.push({ id, icon, title, desc, unlocked, progress: Math.max(0, Math.min(1, progress)) });

  add('first_weigh_in', '⚖️', 'First weigh-in', 'Logged your first weight', stats.entries.length > 0);
  [1, 2, 5, 10, 15, 20].forEach((kg) =>
    add(`lost_${kg}`, kg >= 10 ? '🏅' : '🎉', `Lost ${kg} kg`, `Dropped ${kg} kg from your start`, stats.lost >= kg, stats.lost / kg),
  );

  // "Reached 75 kg" style milestones: every 5 kg mark between start and target
  if (stats.start && stats.target && stats.start > stats.target) {
    for (let m = Math.floor((stats.start - 0.01) / 5) * 5; m > stats.target; m -= 5) {
      const span = stats.start - m;
      add(`reach_${m}`, '📍', `Reached ${m} kg`, `Hit the ${m} kg milestone`, stats.current <= m, (stats.start - stats.current) / span);
    }
    add('target', '🏆', 'Target reached!', `Reached ${stats.target} kg`, stats.reached, stats.progress / 100);
  }

  [3, 7, 14, 30, 60, 100].forEach((n) =>
    add(`streak_${n}`, '🔥', `${n}-day streak`, `${n} good days in a row`, ctx.longest >= n, ctx.longest / n),
  );
  add('water_7', '💧', 'Hydration hero', 'Water goal 7 days in a row', ctx.longestWater >= 7, ctx.longestWater / 7);
  add('steps_7', '👟', 'Step master', 'Step goal 7 days in a row', ctx.longestSteps >= 7, ctx.longestSteps / 7);
  add('workout_7', '💪', 'Workout warrior', 'Workout goal 7 days in a row', ctx.longestWorkout >= 7, ctx.longestWorkout / 7);
  [7, 30, 100].forEach((n) =>
    add(`track_${n}`, '📅', `${n} days tracked`, `Logged ${n} days`, ctx.loggedDays >= n, ctx.loggedDays / n),
  );
  add('perfect_1', '💯', 'Perfect day', 'Completed 100% of goals in a day', ctx.perfectDays >= 1);
  add('perfect_10', '🌟', '10 perfect days', '10 days at 100%', ctx.perfectDays >= 10, ctx.perfectDays / 10);
  return list;
}
