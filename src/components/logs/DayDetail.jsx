import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import ProgressRing from '../common/ProgressRing';
import { Button, Pill } from '../common/ui';
import { useData } from '../../context/DataContext';
import { useDailyLog } from '../../hooks';
import { fmtKey, todayKey } from '../../utils/date';
import { fmtHours, fmtInt } from '../../utils/format';
import { habitCategories } from '../../config/defaultHabits';

const Row = ({ label, children }) => (
  <div className="flex items-start justify-between gap-3 border-b border-line py-2 text-sm last:border-0">
    <span className="text-muted">{label}</span>
    <span className="text-right font-semibold">{children}</span>
  </div>
);

/** Everything logged for one date — what was ticked and what was not. */
export default function DayDetail({ date }) {
  const { goals } = useData();
  const { day } = useDailyLog(date);
  const j = day.journal || {};
  const meals = day.food?.meals || [];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <ProgressRing value={day.pct} size={92} stroke={10}>
          <span className="font-display text-xl font-bold">{day.pct}%</span>
        </ProgressRing>
        <div className="flex-1">
          <div className="font-display text-lg font-bold">{fmtKey(date, 'EEEE, d MMMM yyyy')}</div>
          <div className="text-sm text-muted">{day.done} / {day.total} goals completed</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {!day.logged && <Pill>Not logged</Pill>}
            {day.pct >= 100 && <Pill tone="good">💯 Perfect</Pill>}
            {day.logged && day.pct >= goals.consistencyTarget && day.pct < 100 && <Pill tone="good">Good day</Pill>}
            {day.logged && day.pct < goals.consistencyTarget && <Pill tone="bad">Below target</Pill>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-card-2/60 px-3">
        <Row label="⚖️ Weight">{day.weight ? `${day.weight} kg` : '—'}{day.weightNote && <div className="text-xs font-normal text-muted">{day.weightNote}</div>}</Row>
        <Row label="💧 Water">{(day.waterMl / 1000).toFixed(2)} / {goals.waterTarget} L {day.waterMl >= goals.waterTarget * 1000 ? '✅' : '❌'}</Row>
        <Row label="🚶 Steps">{fmtInt(day.steps || 0)} / {fmtInt(goals.stepTarget)} {(day.steps || 0) >= goals.stepTarget ? '✅' : '❌'}</Row>
        <Row label="🏋️ Workouts">{day.workoutCount} / {goals.workoutTarget}{day.workouts.length > 0 && <div className="text-xs font-normal text-muted">{day.workouts.map((w) => `${w.type} ${w.duration || 0}m`).join(', ')}</div>}</Row>
        <Row label="😴 Sleep">{day.sleep?.hours ? `${fmtHours(day.sleep.hours)} (${day.sleep.bed}–${day.sleep.wake})` : '—'}</Row>
        <Row label="🍽️ Overate">{day.food?.overate == null ? '—' : day.food.overate ? `Yes${day.food.overeatReasons?.length ? ` (${day.food.overeatReasons.join(', ')})` : ''}` : 'No ✅'}</Row>
        <Row label="🥤 Sugary / 🧃 diet drinks">{day.food?.sugaryDrinks || 0} / {day.food?.dietDrinks || 0}</Row>
        <Row label="🚽 Bathroom">{day.bowel?.count != null ? `${day.bowel.count}×${day.bowel.times?.length ? ` · ${day.bowel.times.join(', ')}` : ''}` : '—'}</Row>
        <Row label="🙂 Mood · ⚡ Energy · 😋 Hunger">{day.mood ?? '–'} · {day.energy ?? '–'} · {day.hunger ?? '–'}</Row>
        {meals.length > 0 && <Row label="🥗 Meals">{meals.map((m) => `${m.meal}: ${m.name || '—'}${m.calories ? ` (${m.calories} kcal)` : ''}`).join(' · ')}</Row>}
      </div>

      {habitCategories.map((c) => {
        const items = day.items.filter((i) => (i.habit.category || 'custom') === c.id);
        if (!items.length) return null;
        return (
          <div key={c.id}>
            <div className="mb-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: c.color }}>{c.label}</div>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {items.map((i) => (
                <div key={i.habit.id} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${i.done ? 'bg-primary/10' : 'bg-danger/8'}`}>
                  <span className={i.done ? 'text-primary' : 'text-danger'}>{i.done ? '✓' : '✗'}</span>
                  {i.habit.icon} {i.habit.label}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {Object.values(j).some(Boolean) && (
        <div className="space-y-2 rounded-2xl bg-card-2/60 p-3 text-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-muted">📝 Journal</div>
          {[['Day', j.day], ['Went well', j.well], ['Went wrong', j.wrong], ['Cravings', j.cravings], ['Improve tomorrow', j.improve]].map(([l, v]) => v && <p key={l}><b>{l}:</b> {v}</p>)}
        </div>
      )}

      <Link to={date === todayKey() ? '/today' : `/today?date=${date}`}>
        <Button variant="soft" className="w-full" icon={Pencil}>Edit this day</Button>
      </Link>
    </div>
  );
}
