import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useAnalytics, useDailyLog } from '../hooks';
import { Card, PageHeader, SectionTitle, Segmented, Button, Field, IconButton, EmptyState, stagger } from '../components/common/ui';
import DateRangeSelector from '../components/common/DateRangeSelector';
import { ProgressBar } from '../components/common/ProgressRing';
import { GoalBars } from '../components/charts/Charts';
import { todayKey, fmtKey } from '../utils/date';
import { uid } from '../utils/object';
import { fmtInt, pct } from '../utils/format';

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
const blank = { name: '', calories: '', protein: '', carbs: '', fat: '', notes: '' };

export default function Food() {
  const { goals, calories } = useData();
  const { toast } = useToast();
  const [date, setDate] = useState(todayKey());
  const { day, save } = useDailyLog(date);
  const [meal, setMeal] = useState('Breakfast');
  const [f, setF] = useState(blank);
  const [sel, setSel] = useState({ range: '7D' });
  const a = useAnalytics(sel);
  const meals = day.food?.meals || [];
  const total = (k) => meals.reduce((s, m) => s + (Number(m[k]) || 0), 0);
  const kcal = total('calories');

  const add = (e) => {
    e.preventDefault();
    if (!f.name && !f.calories) return toast('Add a meal name or calories.', 'error');
    const m = { id: uid(), meal, ...f, calories: Number(f.calories) || 0, protein: Number(f.protein) || 0, carbs: Number(f.carbs) || 0, fat: Number(f.fat) || 0 };
    save({ food: { meals: [...meals, m] } });
    setF(blank);
    toast(`${meal} added`);
  };

  const reasons = {};
  a.days.forEach((d) => d.food?.overate && (d.food.overeatReasons || []).forEach((r) => (reasons[r] = (reasons[r] || 0) + 1)));

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <PageHeader emoji="🥗" title="Food" subtitle="Optional meal tracking + food discipline. Calorie numbers are estimates.">
        <input type="date" max={todayKey()} className="field !w-auto py-2" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <SectionTitle action={<span className="text-sm font-bold">{fmtInt(kcal)} / {fmtInt(goals.calorieTarget)} kcal</span>}>🍽️ Meals · {fmtKey(date, 'd MMM')}</SectionTitle>
          <ProgressBar value={pct(kcal, goals.calorieTarget)} color={kcal > goals.calorieTarget ? 'var(--c-danger)' : 'linear-gradient(90deg,var(--c-warning),var(--c-orange))'} className="mb-1 h-2" />
          <div className="mb-4 flex justify-between text-xs text-muted">
            <span>P {total('protein')}g · C {total('carbs')}g · F {total('fat')}g</span>
            <span>Maintenance ≈ {fmtInt(calories.maintenance)} kcal</span>
          </div>
          {MEALS.map((m) => {
            const list = meals.filter((x) => x.meal === m);
            if (!list.length) return null;
            return (
              <div key={m} className="mb-3">
                <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">{m}</div>
                {list.map((x) => (
                  <motion.div layout key={x.id} className="mb-1 flex items-center gap-2 rounded-xl bg-card-2/60 px-3 py-2 text-sm">
                    <span className="flex-1"><b>{x.name || m}</b> {x.notes && <span className="text-muted">· {x.notes}</span>}</span>
                    <span className="text-xs text-muted">{x.calories ? `${x.calories} kcal` : ''}{x.protein ? ` · ${x.protein}g P` : ''}</span>
                    <IconButton icon={Trash2} size={15} label="Delete meal" onClick={() => save({ food: { meals: meals.filter((y) => y.id !== x.id) } })} />
                  </motion.div>
                ))}
              </div>
            );
          })}
          {!meals.length && <EmptyState icon="🍽️" title="No meals logged" text="Meal tracking is optional — log what helps you." />}
        </Card>

        <Card>
          <SectionTitle>Add meal</SectionTitle>
          <form onSubmit={add} className="space-y-3">
            <Segmented size="sm" layoutId="meal" options={MEALS} value={meal} onChange={setMeal} />
            <Field label="Meal name"><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Oats with banana" /></Field>
            <div className="grid grid-cols-4 gap-2">
              {[['calories', 'kcal'], ['protein', 'P g'], ['carbs', 'C g'], ['fat', 'F g']].map(([k, l]) => (
                <Field key={k} label={l}><input type="number" inputMode="numeric" className="field !px-2" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>
              ))}
            </div>
            <Field label="Notes"><input className="field" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
            <Button type="submit" className="w-full" icon={Plus}>Add {meal.toLowerCase()}</Button>
          </form>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold">Food discipline</h2>
        <DateRangeSelector value={sel} onChange={setSel} layoutId="food-range" />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['🍔 Junk-free days', a.food.junkFree, a.food.trackedDays],
          ['🍬 Sugar-free days', a.food.sugarFree, a.food.trackedDays],
          ['🛢️ Oil-free days', a.food.oilFree, a.food.trackedDays],
          ['🍽️ No-overeating days', a.food.noOvereat, a.food.trackedDays],
          ['🥤 Days w/o sugary drinks', a.food.noSugaryDays, a.food.trackedDays],
        ].map(([l, v, t]) => (
          <Card key={l} className="!p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{l}</div>
            <div className="mt-1 font-display text-xl font-bold">{v} <span className="text-sm text-muted">/ {t}</span></div>
            <ProgressBar value={pct(v, t)} className="mt-2 h-1.5" color="var(--c-primary)" />
          </Card>
        ))}
        <Card className="!p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">🥤 Sugary drinks</div>
          <div className="mt-1 font-display text-xl font-bold text-danger">{a.food.sugaryTotal}</div>
          <div className="text-[11px] text-muted">on {a.food.sugaryDays} days · {sel.range}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">🧃 Diet / zero-sugar</div>
          <div className="mt-1 font-display text-xl font-bold text-warning">{a.food.dietTotal}</div>
          <div className="text-[11px] text-muted">on {a.food.dietDays} days · {sel.range}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">😬 Overeating days</div>
          <div className="mt-1 font-display text-xl font-bold">{a.food.overeatDays}</div>
          <div className="text-[11px] text-muted">{Object.entries(reasons).sort((x, y) => y[1] - x[1]).map(([r, n]) => `${r} ${n}×`).join(' · ') || 'No triggers logged'}</div>
        </Card>
      </div>
      <Card>
        <SectionTitle>Calories logged per day (estimate)</SectionTitle>
        <GoalBars days={a.days} value={(d) => (d.food?.meals || []).reduce((s, m) => s + (Number(m.calories) || 0), 0)} goal={goals.calorieTarget} goalLabel="Target" color="var(--c-warning)" unit=" kcal" invert />
      </Card>
    </motion.div>
  );
}
