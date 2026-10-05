// Aggregates evaluated days over a date range into every KPI the analytics/dashboards show.
const sum = (a) => a.reduce((s, v) => s + (Number(v) || 0), 0);
const avg = (a) => (a.length ? sum(a) / a.length : null);
const best = (arr, key) => arr.reduce((b, d) => (b == null || d[key] > b[key] ? d : b), null);

export function summarize(days, goals, weightEntries = [], from = days[0]?.date, to = days.at(-1)?.date) {
  const logged = days.filter((d) => d.logged);
  const waterDays = days.filter((d) => d.waterMl > 0);
  const stepDays = days.filter((d) => d.steps != null && d.steps > 0);
  const sleepDays = days.filter((d) => d.sleep?.hours);
  const foodDays = logged.filter((d) => Object.keys(d.habits).length || d.food?.overate != null);
  const wInRange = weightEntries.filter((e) => e.date >= from && e.date <= to);
  const wChange = wInRange.length >= 2 ? wInRange.at(-1).weight - wInRange[0].weight : null;
  const spanDays = wInRange.length >= 2 ? Math.max(1, (new Date(wInRange.at(-1).date) - new Date(wInRange[0].date)) / 864e5) : null;

  // Per-habit completion rate over logged days
  const habitRates = {};
  logged.forEach((d) =>
    d.items.forEach((i) => {
      const r = (habitRates[i.habit.id] ||= { habit: i.habit, done: 0, total: 0 });
      r.total++;
      if (i.done) r.done++;
    }),
  );

  return {
    from, to,
    totalDays: days.length,
    loggedDays: logged.length,
    avgPct: avg(logged.map((d) => d.pct)),
    goodDays: logged.filter((d) => d.pct >= goals.consistencyTarget).length,
    perfectDays: logged.filter((d) => d.pct >= 100).length,
    missedDays: days.filter((d) => !d.logged || d.pct < goals.consistencyTarget).length,
    water: {
      avg: avg(waterDays.map((d) => d.waterMl)),
      total: sum(days.map((d) => d.waterMl)),
      goalDays: days.filter((d) => d.waterMl >= goals.waterTarget * 1000).length,
      trackedDays: waterDays.length,
      best: best(waterDays, 'waterMl'),
    },
    steps: {
      avg: avg(stepDays.map((d) => d.steps)),
      total: sum(stepDays.map((d) => d.steps)),
      goalDays: stepDays.filter((d) => d.steps >= goals.stepTarget).length,
      trackedDays: stepDays.length,
      best: best(stepDays, 'steps'),
    },
    workouts: {
      total: sum(days.map((d) => d.workoutCount)),
      goalDays: days.filter((d) => d.workoutCount >= goals.workoutTarget).length,
      activeDays: days.filter((d) => d.workoutCount > 0).length,
    },
    food: {
      trackedDays: foodDays.length,
      junkFree: foodDays.filter((d) => d.habits.no_junk).length,
      sugarFree: foodDays.filter((d) => d.habits.no_sugar).length,
      oilFree: foodDays.filter((d) => d.habits.no_oil).length,
      noOvereat: foodDays.filter((d) => d.habits.no_overeat || d.food?.overate === false).length,
      overeatDays: foodDays.filter((d) => d.food?.overate === true).length,
      sugaryDays: days.filter((d) => Number(d.food?.sugaryDrinks) > 0).length,
      dietDays: days.filter((d) => Number(d.food?.dietDrinks) > 0).length,
      sugaryTotal: sum(days.map((d) => d.food?.sugaryDrinks)),
      dietTotal: sum(days.map((d) => d.food?.dietDrinks)),
      noSugaryDays: foodDays.filter((d) => !Number(d.food?.sugaryDrinks)).length,
      calories: avg(days.map((d) => sum((d.food?.meals || []).map((m) => m.calories))).filter(Boolean)),
    },
    sleep: {
      avg: avg(sleepDays.map((d) => d.sleep.hours)),
      goalDays: sleepDays.filter((d) => d.sleep.hours >= goals.sleepTarget).length,
      trackedDays: sleepDays.length,
    },
    weight: {
      entries: wInRange,
      change: wChange,
      perWeek: wChange != null ? (wChange / spanDays) * 7 : null,
    },
    habitRates: Object.values(habitRates).sort((a, b) => b.done / b.total - a.done / a.total),
  };
}
