import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useDailyLog, useWater } from '../hooks';
import { Card, SectionTitle, Button, Segmented, Stepper, Field, stagger, cx } from '../components/common/ui';
import ProgressRing, { ProgressBar } from '../components/common/ProgressRing';
import AnimatedNumber from '../components/common/AnimatedNumber';
import HabitRow from '../components/habits/HabitRow';
import { GoalList } from '../components/dashboard/Widgets';
import { WaterQuick } from '../components/quick/QuickForms';
import { habitCategories } from '../config/defaultHabits';
import { appConfig } from '../config/appConfig';
import { addDaysKey, fmtKey, sleepHours, todayKey } from '../utils/date';
import { fmtInt, fmtHours, pct } from '../utils/format';

const SCALE_EMOJI = { mood: ['😞', '😐', '🙂', '😄', '🤩'], energy: ['🪫', '😪', '🙂', '⚡', '🚀'], hunger: ['😌', '🙂', '😋', '🍽️', '🤤'] };

function Slider({ label, value, onChange, kind }) {
  const em = SCALE_EMOJI[kind][Math.min(4, Math.floor(((value || 5) - 1) / 2))];
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <motion.span key={value} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="font-display font-bold">
          {em} {value ?? '–'}/10
        </motion.span>
      </div>
      <input type="range" min="1" max="10" value={value ?? 5} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[var(--c-primary)]" aria-label={label} />
    </div>
  );
}

/** Textarea that saves on blur / after you stop typing. */
function JournalField({ label, value, onSave, placeholder }) {
  const [v, setV] = useState(value || '');
  const timer = useRef();
  useEffect(() => setV(value || ''), [value]);
  const change = (e) => {
    setV(e.target.value);
    clearTimeout(timer.current);
    const next = e.target.value;
    timer.current = setTimeout(() => onSave(next), 900);
  };
  return (
    <Field label={label}>
      <textarea rows={2} className="field resize-y" value={v} onChange={change} onBlur={() => (clearTimeout(timer.current), v !== (value || '') && onSave(v))} placeholder={placeholder} />
    </Field>
  );
}

export default function Today() {
  const [params, setParams] = useSearchParams();
  const date = params.get('date') || todayKey();
  const isToday = date === todayKey();
  const loc = useLocation();
  const { habits, goals, saveWeight, stats, logs } = useData();
  const { toast } = useToast();
  const { day, save, setHabit } = useDailyLog(date);
  const water = useWater(date);
  const [weight, setWeight] = useState('');
  const [steps, setSteps] = useState('');
  const stepsRef = useRef(null);

  useEffect(() => {
    setWeight(logs.weight[date]?.weight ?? '');
    setSteps(day.steps ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, logs.weight[date]?.weight, day.steps]);

  useEffect(() => {
    if (loc.hash) setTimeout(() => document.getElementById(loc.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
  }, [loc.hash]);

  const go = (n) => {
    const next = addDaysKey(date, n);
    if (next > todayKey()) return;
    setParams(next === todayKey() ? {} : { date: next });
  };

  const food = day.food || {};
  const setFood = (patch, habitPatch = {}) => save({ food: patch, habits: habitPatch });

  const toggle = (item) => {
    const v = !item.done;
    if (item.habit.id === 'no_overeat') return setFood({ overate: !v }, { no_overeat: v });
    setHabit(item.habit.id, v);
    if (v && navigator.vibrate) navigator.vibrate(12);
  };
  const autoClick = (item) => {
    const target = { steps: 'steps-input', water: 'water', sleep: 'sleep', bowel: 'bathroom' }[item.habit.auto];
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (item.habit.auto === 'steps') setTimeout(() => stepsRef.current?.focus(), 400);
  };

  const saveWeightNow = () => {
    const w = Number(weight);
    if (!w || w < 20 || w > 400) return toast('Enter a weight between 20 and 400 kg.', 'error');
    saveWeight(date, w);
    toast(`Weight saved: ${w} kg`);
  };
  const saveSteps = () => {
    const s = Math.max(0, Math.round(Number(steps) || 0));
    if (s === (day.steps ?? null)) return;
    save({ steps: s });
    toast(s >= goals.stepTarget ? '👟 Step goal smashed!' : `Steps saved: ${fmtInt(s)}`);
  };
  const setSleep = (patch) => {
    const next = { ...day.sleep, ...patch };
    save({ sleep: { ...patch, hours: sleepHours(next.bed, next.wake) } });
  };

  const byCat = habitCategories.map((c) => ({ ...c, items: day.items.filter((i) => (i.habit.category || 'custom') === c.id) })).filter((c) => c.items.length);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      {/* Sticky progress header */}
      <div className="sticky top-[60px] z-20 -mx-1 lg:top-3">
        <div className="glass flex items-center gap-3 rounded-3xl p-3 shadow-lg">
          <ProgressRing value={day.pct} size={58} stroke={7}>
            <span className="font-display text-sm font-bold">{day.pct}%</span>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <button onClick={() => go(-1)} aria-label="Previous day" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-card-2"><ChevronLeft size={18} /></button>
              <div className="min-w-0 flex-1 text-center">
                <div className="font-display text-base font-bold leading-tight">{isToday ? 'Today' : fmtKey(date, 'EEE, d MMM')}</div>
                <div className="text-xs text-muted">{day.done} / {day.total} goals</div>
              </div>
              <button onClick={() => go(1)} disabled={isToday} aria-label="Next day" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-card-2 disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
            <ProgressBar value={day.pct} className="mt-1 h-1.5" />
          </div>
        </div>
      </div>

      {/* Weight / Water / Steps */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <SectionTitle>⚖️ Weight</SectionTitle>
          <div className="flex gap-2">
            <input type="number" inputMode="decimal" step="0.1" className="field text-lg font-bold" placeholder={stats.current ? `${stats.current}` : 'kg'} value={weight} onChange={(e) => setWeight(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveWeightNow()} aria-label="Weight in kg" />
            <Button onClick={saveWeightNow}>Save</Button>
          </div>
          <p className="mt-2 text-xs text-muted">{logs.weight[date] ? `Saved: ${logs.weight[date].weight} kg ✓` : 'Not logged for this day yet'}</p>
        </Card>
        <Card id="water">
          <SectionTitle>
            💧 Water <span className="ml-1 font-display text-water"><AnimatedNumber value={water.totalMl / 1000} decimals={2} /> / {goals.waterTarget} L</span>
          </SectionTitle>
          <ProgressBar value={water.pct} color="linear-gradient(90deg,var(--c-water),var(--c-secondary))" className="mb-3 h-2" />
          <WaterQuick date={date} compact />
        </Card>
        <Card id="steps-input">
          <SectionTitle>🚶 Steps</SectionTitle>
          <div className="flex gap-2">
            <input ref={stepsRef} type="number" inputMode="numeric" className="field text-lg font-bold" placeholder="0" value={steps} onChange={(e) => setSteps(e.target.value)} onBlur={saveSteps} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} aria-label="Steps" />
            <Button variant="soft" onClick={saveSteps}>Save</Button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <ProgressBar value={pct(day.steps, goals.stepTarget)} color="linear-gradient(90deg,var(--c-orange),var(--c-warning))" className="h-1.5" />
            <span className="whitespace-nowrap text-xs text-muted">{fmtInt(Math.max(0, goals.stepTarget - (day.steps || 0)))} left</span>
          </div>
        </Card>
      </div>

      {/* Habits */}
      <div className="grid gap-4 lg:grid-cols-2">
        {byCat.map((c) => (
          <Card key={c.id}>
            <SectionTitle action={<span className="text-xs font-semibold text-muted">{c.items.filter((i) => i.done).length}/{c.items.length}</span>}>
              <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
              {c.label}
            </SectionTitle>
            <div className="space-y-2">
              {c.items.map((item) => (
                <HabitRow key={item.habit.id} item={item} color={c.color} onToggle={() => toggle(item)} onAutoClick={() => autoClick(item)} onValue={(v) => setHabit(item.habit.id, v)} />
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Food discipline */}
      <Card>
        <SectionTitle>🍽️ Food check</SectionTitle>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold">Did you overeat today?</span>
            <Segmented size="sm" layoutId="overate" options={[{ id: 'no', label: 'No 👍' }, { id: 'yes', label: 'Yes 😬' }]} value={food.overate === true ? 'yes' : food.overate === false ? 'no' : null} onChange={(v) => setFood({ overate: v === 'yes' }, { no_overeat: v === 'no' })} />
          </div>
          <AnimatePresence>
            {food.overate && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Why?</div>
                <div className="flex flex-wrap gap-2">
                  {appConfig.overeatReasons.map((r) => {
                    const on = (food.overeatReasons || []).includes(r);
                    return (
                      <motion.button whileTap={{ scale: 0.9 }} key={r} onClick={() => setFood({ overeatReasons: on ? food.overeatReasons.filter((x) => x !== r) : [...(food.overeatReasons || []), r] })} className={cx('rounded-full px-3 py-1.5 text-sm font-semibold', on ? 'bg-danger text-white' : 'bg-card-2 text-muted')}>
                        {r}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl bg-card-2/60 px-3 py-2">
              <span className="text-sm font-semibold">🥤 Sugary drinks</span>
              <Stepper value={food.sugaryDrinks || 0} onChange={(n) => setFood({ sugaryDrinks: n }, { no_sugary_drinks: n === 0, no_soft_drinks: n === 0 ? day.habits.no_soft_drinks : false })} />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-card-2/60 px-3 py-2">
              <span className="text-sm font-semibold">🧃 Diet / zero-sugar</span>
              <Stepper value={food.dietDrinks || 0} onChange={(n) => setFood({ dietDrinks: n }, { no_diet_drinks: n === 0 })} />
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Sleep */}
        <Card id="sleep">
          <SectionTitle action={<span className="font-display text-sm font-bold text-accent">{fmtHours(day.sleep?.hours)} / {goals.sleepTarget}h</span>}>😴 Sleep</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slept at"><input type="time" className="field" value={day.sleep?.bed || ''} onChange={(e) => setSleep({ bed: e.target.value })} /></Field>
            <Field label="Woke at"><input type="time" className="field" value={day.sleep?.wake || ''} onChange={(e) => setSleep({ wake: e.target.value })} /></Field>
          </div>
        </Card>

        {/* Bathroom (private, optional) */}
        <Card id="bathroom">
          <SectionTitle action={<span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Private · optional</span>}>🚽 Bathroom</SectionTitle>
          <div className="mb-3 flex gap-2">
            {[0, 1, 2, 3, 4].map((n) => (
              <motion.button whileTap={{ scale: 0.88 }} key={n} onClick={() => save({ bowel: { count: n } })} className={cx('h-11 flex-1 rounded-xl font-display font-bold', (day.bowel?.count ?? -1) === n ? 'bg-primary text-white' : 'bg-card-2 text-muted')}>
                {n === 4 ? '4+' : n}
              </motion.button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {['Morning', 'Afternoon', 'Evening', 'Night'].map((t) => {
              const on = (day.bowel?.times || []).includes(t);
              return (
                <button key={t} onClick={() => save({ bowel: { times: on ? day.bowel.times.filter((x) => x !== t) : [...(day.bowel?.times || []), t] } })} className={cx('rounded-full px-3 py-1 text-xs font-semibold', on ? 'bg-secondary text-white' : 'bg-card-2 text-muted')}>
                  {t}
                </button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Mood + Journal */}
      <Card id="journal">
        <SectionTitle>📝 Journal</SectionTitle>
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <Slider label="Mood" kind="mood" value={day.mood} onChange={(v) => save({ mood: v })} />
          <Slider label="Energy" kind="energy" value={day.energy} onChange={(v) => save({ energy: v })} />
          <Slider label="Hunger" kind="hunger" value={day.hunger} onChange={(v) => save({ hunger: v })} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <JournalField label="How was your day?" value={day.journal.day} onSave={(v) => save({ journal: { day: v } })} placeholder="Overall…" />
          <JournalField label="What went well?" value={day.journal.well} onSave={(v) => save({ journal: { well: v } })} placeholder="Wins, big or small" />
          <JournalField label="What went wrong?" value={day.journal.wrong} onSave={(v) => save({ journal: { wrong: v } })} placeholder="Be honest, no judgement" />
          <JournalField label="What caused cravings?" value={day.journal.cravings} onSave={(v) => save({ journal: { cravings: v } })} placeholder="Stress, boredom…" />
          <JournalField label="What should I improve tomorrow?" value={day.journal.improve} onSave={(v) => save({ journal: { improve: v } })} placeholder="One thing" />
        </div>
      </Card>

      {/* Daily summary */}
      <Card>
        <SectionTitle>📋 {isToday ? "Today's" : 'Day'} summary · {day.done} / {day.total} goals · {day.pct}%</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          <GoalList title="❌ Missed" tone="bad" items={day.missed} emptyText="Nothing missed — perfect day! 🎉" />
          <GoalList title="✓ Completed" tone="good" items={day.completed} emptyText="Nothing completed yet." />
        </div>
      </Card>
    </motion.div>
  );
}
