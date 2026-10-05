import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Scale, Droplets, Footprints, Utensils, ScrollText, ListChecks, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAnalytics } from '../hooks';
import { Card, SectionTitle, Segmented, stagger, Button } from '../components/common/ui';
import ProgressRing from '../components/common/ProgressRing';
import AnimatedNumber from '../components/common/AnimatedNumber';
import DateRangeSelector from '../components/common/DateRangeSelector';
import { KpiCard, TodaySummary, WeightJourney, InsightList } from '../components/dashboard/Widgets';
import ConsistencyHeatmap from '../components/dashboard/ConsistencyHeatmap';
import { WeightChart, GoalBars, ConsistencyBars, ConsistencyTrend, CategoryRadar, WeekdayChart } from '../components/charts/Charts';
import { greeting } from '../utils/date';
import { resolveRange } from '../utils/ranges';
import { buildInsights } from '../utils/insights';
import { fmtInt, pct } from '../utils/format';

const LINKS = [
  { to: '/weight', label: 'Weight', icon: Scale, color: 'var(--c-accent)' },
  { to: '/water', label: 'Water', icon: Droplets, color: 'var(--c-water)' },
  { to: '/activity', label: 'Activity', icon: Footprints, color: 'var(--c-orange)' },
  { to: '/food', label: 'Food', icon: Utensils, color: 'var(--c-warning)' },
  { to: '/habits', label: 'Habits', icon: ListChecks, color: 'var(--c-pink)' },
  { to: '/logs', label: 'Logs', icon: ScrollText, color: 'var(--c-secondary)' },
];

export default function Dashboard() {
  const d = useData();
  const { goals, stats, calories, streaks, profile } = d;
  const t = d.today || { pct: 0, done: 0, total: 0, missed: [], completed: [], waterMl: 0, steps: 0, workoutCount: 0, sleep: {}, habits: {} };
  const [sel, setSel] = useState({ range: '7D' });
  const a = useAnalytics(sel);
  const [heatSel, setHeatSel] = useState('3M');
  const heat = resolveRange(heatSel, {}, d.earliest);
  useAnalytics({ range: heatSel }); // ensures older data is loaded for ALL
  const [view, setView] = useState('Bars');
  const insights = useMemo(() => buildInsights(d.byDate, stats.entries, goals), [d.byDate, stats.entries, goals]);
  const noData = !d.days.some((x) => x.logged);
  const weightEntries = stats.entries.filter((e) => e.date >= a.from && e.date <= a.to);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* HERO */}
      <Card className="!p-0">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_0%_0%,color-mix(in_srgb,var(--c-primary)_22%,transparent),transparent_60%),radial-gradient(100%_80%_at_100%_100%,color-mix(in_srgb,var(--c-secondary)_22%,transparent),transparent_60%)]" />
        <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex-1">
            <div className="font-display text-xs font-bold tracking-[0.2em] text-muted">
              {greeting().toUpperCase()}, {(profile.name || 'friend').toUpperCase()} 👋
            </div>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight sm:text-3xl">How are you doing today?</h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <motion.span whileHover={{ scale: 1.04 }} className="inline-flex items-center gap-1.5 rounded-full bg-orange/15 px-3 py-1.5 text-sm font-bold text-orange">
                <motion.span animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}>
                  <Flame size={16} />
                </motion.span>
                {streaks.overall.current} day streak
              </motion.span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card-2 px-3 py-1.5 text-sm font-semibold">
                🔥 Est. maintenance <b className="font-display">{fmtInt(calories.maintenance)}</b> kcal/day
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card-2 px-3 py-1.5 text-sm font-semibold">
                🎯 Eat <b className="font-display">{fmtInt(goals.calorieTarget)}</b> kcal
                {calories.maintenance ? <span className="text-muted">(−{fmtInt(calories.maintenance - goals.calorieTarget)})</span> : null}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2 text-center">
              {[
                ['Current', stats.current, 'var(--c-accent)'],
                ['Lost', stats.lost, 'var(--c-primary)'],
                ['Target', stats.target, 'var(--c-secondary)'],
                ['Left', stats.remaining, 'var(--c-orange)'],
              ].map(([l, v, c]) => (
                <div key={l} className="rounded-2xl bg-card/60 px-1 py-2 backdrop-blur">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{l}</div>
                  <div className="font-display text-lg font-bold" style={{ color: c }}>
                    <AnimatedNumber value={v} decimals={1} />
                    <span className="text-[10px] text-muted"> kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Link to="/today" className="mx-auto">
            <ProgressRing value={t.pct} size={156} stroke={14}>
              <div>
                <AnimatedNumber value={t.pct} className="font-display text-4xl font-bold" />
                <span className="font-display text-lg font-bold">%</span>
                <div className="text-xs text-muted">{t.done}/{t.total} goals</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-primary">Today</div>
              </div>
            </ProgressRing>
          </Link>
        </div>
      </Card>

      {noData && (
        <Card className="text-center">
          <div className="text-4xl">🌱</div>
          <h3 className="mt-2 font-display text-lg font-bold">Start your journey today</h3>
          <p className="text-sm text-muted">Log your weight, water and habits — your dashboard comes alive as you go.</p>
          <Link to="/today"><Button className="mt-3">Open today's checklist</Button></Link>
        </Card>
      )}

      {/* RANGE */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Overview</h2>
        <DateRangeSelector value={sel} onChange={setSel} layoutId="dash-range" />
      </div>

      {/* KPI GRID */}
      <motion.div variants={stagger} className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <KpiCard to="/weight" icon="⚖️" label="Current weight" value={stats.current} decimals={1} unit="kg" color="var(--c-accent)" spark={weightEntries.map((e) => e.weight)} trend={a.weight.change} trendGoodWhenDown />
        <KpiCard to="/weight" icon="📉" label="Weight lost" value={stats.lost} decimals={1} unit="kg" pct={stats.progress} color="var(--c-primary)" />
        <KpiCard to="/weight" icon="🎯" label="Target / remaining" value={stats.remaining} decimals={1} unit="kg left" target={stats.target ? `${stats.target} kg` : null} color="var(--c-secondary)" />
        <KpiCard to="/profile" icon="🔥" label="Maintenance (est.)" value={calories.maintenance} unit="kcal" target={`${fmtInt(goals.calorieTarget)} kcal eating target`} color="var(--c-orange)" />
        <KpiCard to="/water" icon="💧" label="Water today" value={t.waterMl / 1000} decimals={1} unit={`/ ${goals.waterTarget} L`} pct={pct(t.waterMl, goals.waterTarget * 1000)} color="var(--c-water)" spark={a.days.map((x) => x.waterMl)} />
        <KpiCard to="/activity" icon="🚶" label="Steps today" value={t.steps || 0} unit={`/ ${fmtInt(goals.stepTarget)}`} pct={pct(t.steps, goals.stepTarget)} color="var(--c-orange)" spark={a.days.map((x) => x.steps || 0)} />
        <KpiCard to="/activity" icon="🏋️" label="Workouts today" value={t.workoutCount} unit={`/ ${goals.workoutTarget}`} pct={pct(t.workoutCount, goals.workoutTarget)} color="var(--c-primary)" />
        <KpiCard to="/today" icon="😴" label="Sleep" value={t.sleep?.hours || 0} decimals={1} unit={`h / ${goals.sleepTarget}h`} pct={pct(t.sleep?.hours, goals.sleepTarget)} color="var(--c-accent)" />
        <KpiCard to="/analytics" icon="📊" label={`Consistency (${sel.range})`} value={a.avgPct ?? 0} unit="%" pct={a.avgPct} target={`${goals.consistencyTarget}% target`} color="var(--c-secondary)" spark={a.days.map((x) => x.pct)} />
        <KpiCard to="/analytics" icon="🔥" label="Current streak" value={streaks.overall.current} unit="days" target={`best ${streaks.overall.longest} days`} color="var(--c-orange)" />
        <KpiCard to="/food" icon="🍔" label="Junk-free days" value={a.food.junkFree} unit={`/ ${a.food.trackedDays}`} pct={pct(a.food.junkFree, a.food.trackedDays)} color="var(--c-warning)" />
        <KpiCard to="/food" icon="🍬" label="Sugar-free days" value={a.food.sugarFree} unit={`/ ${a.food.trackedDays}`} pct={pct(a.food.sugarFree, a.food.trackedDays)} color="var(--c-pink)" />
        <KpiCard to="/food" icon="🍽️" label="No-overeating days" value={a.food.noOvereat} unit={`/ ${a.food.trackedDays}`} pct={pct(a.food.noOvereat, a.food.trackedDays)} color="var(--c-primary)" />
        <KpiCard to="/water" icon="🥛" label={`Water avg (${sel.range})`} value={(a.water.avg || 0) / 1000} decimals={1} unit="L/day" pct={pct(a.water.avg, goals.waterTarget * 1000)} color="var(--c-water)" />
        <KpiCard to="/activity" icon="👟" label={`Steps avg (${sel.range})`} value={a.steps.avg || 0} unit="/day" pct={pct(a.steps.avg, goals.stepTarget)} color="var(--c-orange)" />
        <KpiCard to="/food" icon="🥤" label={`Sugary / diet drinks`} value={a.food.sugaryTotal} unit={`· ${a.food.dietTotal} diet`} color="var(--c-danger)" />
      </motion.div>

      {/* TODAY + MISSED */}
      <TodaySummary day={t} />

      {/* WEIGHT CHART */}
      <Card>
        <SectionTitle action={<Link to="/weight" className="flex items-center gap-1 text-xs font-semibold text-primary">Details <ArrowRight size={14} /></Link>}>
          ⚖️ Weight trend · {sel.range}
        </SectionTitle>
        <WeightChart entries={weightEntries} start={stats.start} target={stats.target} />
      </Card>

      {/* CONSISTENCY */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <SectionTitle>📈 Consistency · {sel.range}</SectionTitle>
          <Segmented size="sm" className="mb-3" layoutId="cview" options={['Bars', 'Trend', 'Radar', 'Weekday']} value={view} onChange={setView} />
          {view === 'Bars' && <ConsistencyBars days={a.days} target={goals.consistencyTarget} />}
          {view === 'Trend' && <ConsistencyTrend days={a.days} />}
          {view === 'Radar' && <CategoryRadar days={a.days} height={220} />}
          {view === 'Weekday' && <WeekdayChart days={a.days} />}
        </Card>
        <Card>
          <SectionTitle action={<Segmented size="sm" layoutId="heat-range" options={['1M', '3M', '6M', '1Y', 'ALL']} value={heatSel} onChange={setHeatSel} />}>🟩 Consistency map</SectionTitle>
          <ConsistencyHeatmap byDate={d.byDate} from={heat.from} to={heat.to} />
        </Card>
      </div>

      {/* WATER + STEPS */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>💧 Water · {sel.range}</SectionTitle>
          <GoalBars days={a.days} value={(x) => x.waterMl} goal={goals.waterTarget * 1000} color="var(--c-water)" unit=" ml" />
        </Card>
        <Card>
          <SectionTitle>🚶 Steps · {sel.range}</SectionTitle>
          <GoalBars days={a.days} value={(x) => x.steps} goal={goals.stepTarget} color="var(--c-orange)" />
        </Card>
      </div>

      <WeightJourney stats={stats} />

      <Card>
        <SectionTitle>✨ Insights</SectionTitle>
        <InsightList insights={insights} />
      </Card>

      {/* Quick links (handy on mobile) */}
      <motion.div variants={stagger} className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:hidden">
        {LINKS.map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to} className="card flex flex-col items-center gap-1.5 !rounded-2xl py-3 text-xs font-semibold active:scale-95">
            <Icon size={20} style={{ color }} />
            {label}
          </Link>
        ))}
      </motion.div>
    </motion.div>
  );
}
