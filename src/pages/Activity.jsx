import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { startOfWeek, startOfMonth } from 'date-fns';
import { useData } from '../context/DataContext';
import { useAnalytics, useDailyLog } from '../hooks';
import { Card, PageHeader, SectionTitle, Segmented, IconButton, EmptyState, stagger } from '../components/common/ui';
import DateRangeSelector from '../components/common/DateRangeSelector';
import ProgressRing from '../components/common/ProgressRing';
import AnimatedNumber from '../components/common/AnimatedNumber';
import { StepsForm, WorkoutForm } from '../components/quick/QuickForms';
import { GoalBars } from '../components/charts/Charts';
import { fmtKey, fromKey, toKey, todayKey } from '../utils/date';
import { fmtInt, pct } from '../utils/format';

/** Group days into weeks/months → [{date, v}] averages. */
const groupAvg = (days, by, value) => {
  const map = {};
  days.forEach((d) => {
    const k = toKey(by === 'week' ? startOfWeek(fromKey(d.date), { weekStartsOn: 1 }) : startOfMonth(fromKey(d.date)));
    const v = value(d);
    if (v == null) return;
    (map[k] ||= []).push(v);
  });
  return Object.entries(map).sort().map(([date, arr]) => ({ date, v: Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) }));
};

const Mini = ({ label, value, hint }) => (
  <Card className="!p-4">
    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
    <div className="mt-1 font-display text-xl font-bold">{value}</div>
    {hint && <div className="text-[11px] text-muted">{hint}</div>}
  </Card>
);

export default function Activity() {
  const { goals, streaks } = useData();
  const { day, save } = useDailyLog(todayKey());
  const [sel, setSel] = useState({ range: '1M' });
  const [stepView, setStepView] = useState('Daily');
  const a = useAnalytics(sel);
  const week = useAnalytics({ range: '7D' });
  const month = useAnalytics({ range: '1M' });
  const stepData = useMemo(() => {
    if (stepView === 'Daily') return a.days;
    return groupAvg(a.days.filter((d) => d.steps), stepView === 'Weekly avg' ? 'week' : 'month', (d) => d.steps);
  }, [a.days, stepView]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <PageHeader emoji="🏃" title="Activity" subtitle="Steps, walking and workouts." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle>🚶 Steps today</SectionTitle>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ProgressRing value={pct(day.steps, goals.stepTarget)} size={150} stroke={14} from="var(--c-orange)" to="var(--c-warning)">
              <div>
                <AnimatedNumber value={day.steps || 0} className="font-display text-2xl font-bold" />
                <div className="text-xs text-muted">/ {fmtInt(goals.stepTarget)}</div>
                <div className="text-xs font-bold text-orange">{pct(day.steps, goals.stepTarget)}%</div>
              </div>
            </ProgressRing>
            <div className="w-full flex-1">
              <p className="mb-2 text-center text-sm font-semibold">{(day.steps || 0) >= goals.stepTarget ? '🎉 Goal reached!' : `${fmtInt(goals.stepTarget - (day.steps || 0))} steps remaining`}</p>
              <StepsForm key={day.steps} />
            </div>
          </div>
        </Card>
        <Card>
          <SectionTitle action={<span className="text-sm font-bold text-primary">{day.workoutCount} / {goals.workoutTarget}</span>}>🏋️ Workouts today</SectionTitle>
          <WorkoutForm />
          {day.workouts.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {day.workouts.map((w) => (
                <li key={w.id} className="flex items-center gap-2 rounded-xl bg-card-2/60 px-3 py-2 text-sm">
                  <span className="flex-1"><b>{w.type}</b> · {w.duration || 0} min {w.notes && <span className="text-muted">· {w.notes}</span>}</span>
                  <IconButton icon={Trash2} size={15} label="Remove workout" onClick={() => save({ workouts: day.workouts.filter((x) => x.id !== w.id) })} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Stats</h2>
        <DateRangeSelector value={sel} onChange={setSel} layoutId="act-range" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Mini label="Weekly avg steps" value={fmtInt(week.steps.avg || 0)} />
        <Mini label="Monthly avg steps" value={fmtInt(month.steps.avg || 0)} />
        <Mini label="Best day" value={a.steps.best ? fmtInt(a.steps.best.steps) : '—'} hint={a.steps.best ? fmtKey(a.steps.best.date, 'd MMM') : sel.range} />
        <Mini label="Total steps" value={fmtInt(a.steps.total)} hint={sel.range} />
        <Mini label="Step goal hit" value={`${a.steps.goalDays} / ${a.totalDays}`} hint={`${pct(a.steps.goalDays, a.totalDays)}% of days`} />
        <Mini label="Workouts" value={a.workouts.total} hint={`this week: ${week.workouts.total} · month: ${month.workouts.total}`} />
        <Mini label="Workout goal days" value={`${a.workouts.goalDays} / ${a.totalDays}`} hint={`${pct(a.workouts.goalDays, a.totalDays)}% consistency`} />
        <Mini label="Workout streak" value={`🔥 ${streaks.workout.current}`} hint={`best ${streaks.workout.longest} · steps streak ${streaks.steps.current}`} />
      </div>

      <Card>
        <SectionTitle action={<Segmented size="sm" layoutId="step-view" options={['Daily', 'Weekly avg', 'Monthly avg']} value={stepView} onChange={setStepView} />}>Steps</SectionTitle>
        {stepView === 'Daily' ? (
          <GoalBars days={stepData} value={(d) => d.steps} goal={goals.stepTarget} color="var(--c-orange)" height={240} />
        ) : stepData.length ? (
          <GoalBars days={stepData} value={(d) => d.v} goal={goals.stepTarget} color="var(--c-orange)" height={240} />
        ) : (
          <EmptyState icon="👟" title="No steps logged yet" />
        )}
      </Card>
      <Card>
        <SectionTitle>Workouts per day</SectionTitle>
        <GoalBars days={a.days} value={(d) => d.workoutCount} goal={goals.workoutTarget} color="var(--c-primary)" height={200} />
      </Card>
    </motion.div>
  );
}
