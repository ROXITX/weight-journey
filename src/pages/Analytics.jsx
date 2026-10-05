import { useState } from 'react';
import { motion } from 'framer-motion';
import { useData } from '../context/DataContext';
import { useAnalytics } from '../hooks';
import { Card, PageHeader, SectionTitle, EmptyState, stagger } from '../components/common/ui';
import DateRangeSelector from '../components/common/DateRangeSelector';
import AnimatedNumber from '../components/common/AnimatedNumber';
import { ProgressBar } from '../components/common/ProgressRing';
import { WeightChart, GoalBars, ConsistencyBars, ConsistencyTrend, CategoryRadar, WeekdayChart } from '../components/charts/Charts';
import ConsistencyHeatmap from '../components/dashboard/ConsistencyHeatmap';
import { fmtInt, fmtHours, pct, signed } from '../utils/format';

function Stat({ label, value, decimals = 0, unit, sub, color }) {
  return (
    <div className="rounded-2xl bg-card-2/60 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 font-display text-xl font-bold" style={{ color }}>
        {typeof value === 'number' ? <AnimatedNumber value={value} decimals={decimals} /> : value ?? '—'}
        {unit && <span className="ml-1 text-xs text-muted">{unit}</span>}
      </div>
      {sub && <div className="text-[11px] text-muted">{sub}</div>}
    </div>
  );
}

const STREAK_LABELS = { overall: '🔥 Overall', logging: '📅 Logging', weight: '⚖️ Weight logging', water: '💧 Water', steps: '🚶 Steps', workout: '🏋️ Workout', food: '🥗 Food discipline', journal: '📝 Journal' };

export default function Analytics() {
  const { goals, stats, streaks, byDate } = useData();
  const [sel, setSel] = useState({ range: '1M' });
  const a = useAnalytics(sel);
  const td = a.totalDays || 1;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <PageHeader emoji="📊" title="Analytics" subtitle={`${a.from} → ${a.to} · ${a.loggedDays} of ${a.totalDays} days logged`}>
        <DateRangeSelector value={sel} onChange={setSel} layoutId="an-range" />
      </PageHeader>

      {!a.loggedDays && <Card><EmptyState icon="📊" title="No data in this range" text="Log a few days and your analytics will fill in." /></Card>}

      <Card>
        <SectionTitle>🏁 Overall</SectionTitle>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Stat label="Avg consistency" value={a.avgPct ?? 0} unit="%" color="var(--c-secondary)" sub={`target ${goals.consistencyTarget}%`} />
          <Stat label="Current streak" value={streaks.overall.current} unit="days" color="var(--c-orange)" />
          <Stat label="Longest streak" value={streaks.overall.longest} unit="days" />
          <Stat label="Perfect days" value={a.perfectDays} color="var(--c-primary)" sub="100% of goals" />
          <Stat label="Good days" value={a.goodDays} sub={`≥ ${goals.consistencyTarget}%`} />
          <Stat label="Missed days" value={a.missedDays} color="var(--c-danger)" sub="below target / not logged" />
          <Stat label="Days logged" value={a.loggedDays} sub={`${pct(a.loggedDays, td)}% of range`} />
          <Stat label="Workouts" value={a.workouts.total} sub={`${a.workouts.activeDays} active days`} />
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionTitle>📈 Daily consistency</SectionTitle>
          <ConsistencyBars days={a.days} target={goals.consistencyTarget} />
        </Card>
        <Card>
          <SectionTitle>〰️ 7-day rolling average</SectionTitle>
          <ConsistencyTrend days={a.days} />
        </Card>
        <Card>
          <SectionTitle>🕸️ Balance by category</SectionTitle>
          <CategoryRadar days={a.days} />
        </Card>
        <Card>
          <SectionTitle>📆 By weekday</SectionTitle>
          <WeekdayChart days={a.days} height={240} />
        </Card>
      </div>

      <Card>
        <SectionTitle>🟩 Consistency map</SectionTitle>
        <ConsistencyHeatmap byDate={byDate} from={a.from} to={a.to} />
      </Card>

      <Card>
        <SectionTitle>⚖️ Weight</SectionTitle>
        <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-5">
          <Stat label="Range change" value={a.weight.change != null ? signed(a.weight.change, 1) : '—'} unit="kg" color={a.weight.change > 0 ? 'var(--c-danger)' : 'var(--c-primary)'} />
          <Stat label="Weekly rate" value={a.weight.perWeek != null ? signed(a.weight.perWeek, 2) : '—'} unit="kg/wk" />
          <Stat label="Avg monthly loss" value={stats.avgMonthly != null ? stats.avgMonthly.toFixed(2) : '—'} unit="kg" />
          <Stat label="Total lost" value={stats.lost} decimals={1} unit="kg" color="var(--c-primary)" />
          <Stat label="Avg weekly loss" value={stats.avgWeekly != null ? stats.avgWeekly.toFixed(2) : '—'} unit="kg" />
        </div>
        <WeightChart entries={a.weight.entries} start={stats.start} target={stats.target} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>💧 Water</SectionTitle>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Stat label="Average" value={((a.water.avg || 0) / 1000).toFixed(2)} unit="L" />
            <Stat label="Goal days" value={`${a.water.goalDays}/${a.totalDays}`} sub={`${pct(a.water.goalDays, td)}%`} />
            <Stat label="Total" value={(a.water.total / 1000).toFixed(1)} unit="L" />
          </div>
          <GoalBars days={a.days} value={(d) => d.waterMl} goal={goals.waterTarget * 1000} color="var(--c-water)" unit=" ml" />
        </Card>
        <Card>
          <SectionTitle>🚶 Steps</SectionTitle>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Stat label="Average" value={fmtInt(a.steps.avg || 0)} />
            <Stat label="Goal days" value={`${a.steps.goalDays}/${a.totalDays}`} sub={`${pct(a.steps.goalDays, td)}%`} />
            <Stat label="Total" value={fmtInt(a.steps.total)} />
          </div>
          <GoalBars days={a.days} value={(d) => d.steps} goal={goals.stepTarget} color="var(--c-orange)" />
        </Card>
        <Card>
          <SectionTitle>🏋️ Workouts</SectionTitle>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Stat label="Count" value={a.workouts.total} />
            <Stat label="Goal days" value={`${a.workouts.goalDays}/${a.totalDays}`} sub={`${pct(a.workouts.goalDays, td)}% consistency`} />
            <Stat label="Streak" value={streaks.workout.current} unit="days" />
          </div>
          <GoalBars days={a.days} value={(d) => d.workoutCount} goal={goals.workoutTarget} color="var(--c-primary)" />
        </Card>
        <Card>
          <SectionTitle>😴 Sleep</SectionTitle>
          <div className="mb-3 grid grid-cols-3 gap-2">
            <Stat label="Average" value={fmtHours(a.sleep.avg)} />
            <Stat label="Goal days" value={`${a.sleep.goalDays}/${a.sleep.trackedDays}`} sub={`${pct(a.sleep.goalDays, a.sleep.trackedDays)}% of tracked`} />
            <Stat label="Target" value={`${goals.sleepTarget}h`} />
          </div>
          <GoalBars days={a.days} value={(d) => d.sleep?.hours} goal={goals.sleepTarget} color="var(--c-accent)" unit=" h" format={(v) => v} />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>🥗 Food</SectionTitle>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat label="Junk-free" value={a.food.junkFree} sub={`of ${a.food.trackedDays} days`} />
            <Stat label="Sugar-free" value={a.food.sugarFree} sub={`of ${a.food.trackedDays} days`} />
            <Stat label="No overeating" value={a.food.noOvereat} sub={`of ${a.food.trackedDays} days`} />
            <Stat label="Sugary-drink days" value={a.food.sugaryDays} color="var(--c-danger)" sub={`${a.food.sugaryTotal} drinks`} />
            <Stat label="Diet-drink days" value={a.food.dietDays} color="var(--c-warning)" sub={`${a.food.dietTotal} drinks`} />
            <Stat label="Avg calories logged" value={a.food.calories ? fmtInt(a.food.calories) : '—'} unit="kcal" sub="estimate" />
          </div>
        </Card>
        <Card>
          <SectionTitle>🔥 Streaks</SectionTitle>
          <ul className="space-y-2">
            {Object.entries(STREAK_LABELS).map(([k, l]) => (
              <li key={k} className="flex items-center gap-3 text-sm">
                <span className="w-36 shrink-0">{l}</span>
                <ProgressBar value={streaks[k].longest ? (streaks[k].current / streaks[k].longest) * 100 : 0} className="h-2" color="linear-gradient(90deg,var(--c-orange),var(--c-warning))" />
                <span className="w-24 shrink-0 text-right"><b>{streaks[k].current}</b> <span className="text-muted">/ best {streaks[k].longest}</span></span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <SectionTitle>✅ Habit completion · {sel.range}</SectionTitle>
        {!a.habitRates.length ? (
          <EmptyState icon="✅" title="No habits logged yet" />
        ) : (
          <ul className="grid gap-x-6 gap-y-2 md:grid-cols-2">
            {a.habitRates.map((r) => (
              <li key={r.habit.id} className="flex items-center gap-3 text-sm">
                <span className="w-44 shrink-0 truncate">{r.habit.icon} {r.habit.label}</span>
                <ProgressBar value={(r.done / r.total) * 100} className="h-2" />
                <span className="w-12 shrink-0 text-right font-semibold">{Math.round((r.done / r.total) * 100)}%</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </motion.div>
  );
}
