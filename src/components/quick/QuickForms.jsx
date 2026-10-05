// Small logging forms reused by the Quick Actions sheet and the pages.
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Field, Segmented } from '../common/ui';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';
import { useDailyLog, useWater } from '../../hooks';
import { appConfig } from '../../config/appConfig';
import { todayKey } from '../../utils/date';
import { uid } from '../../utils/object';
import { fmtL } from '../../utils/format';
import Check from '../common/Checkbox';

export function WeightForm({ date: initialDate = todayKey(), initial, onDone }) {
  const { stats, saveWeight, logs } = useData();
  const { toast } = useToast();
  const [date, setDate] = useState(initialDate);
  const existing = logs.weight[date];
  const [weight, setWeight] = useState(initial?.weight ?? existing?.weight ?? stats.current ?? '');
  const [note, setNote] = useState(initial?.note ?? existing?.note ?? '');
  const nudge = (d) => setWeight((w) => Math.round(((Number(w) || 0) + d) * 10) / 10);

  const submit = (e) => {
    e.preventDefault();
    const w = Number(weight);
    if (!w || w < 20 || w > 400) return toast('Enter a weight between 20 and 400 kg.', 'error');
    saveWeight(date, w, note);
    toast(`Weight saved: ${w} kg`);
    onDone?.();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center justify-center gap-3">
        <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => nudge(-0.1)} className="grid h-12 w-12 place-items-center rounded-2xl bg-card-2 text-xl font-bold" aria-label="Minus 0.1 kg">−</motion.button>
        <div className="relative">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            className="w-36 bg-transparent text-center font-display text-5xl font-bold outline-none"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            aria-label="Weight in kg"
          />
          <div className="text-center text-sm font-semibold text-muted">kg</div>
        </div>
        <motion.button type="button" whileTap={{ scale: 0.85 }} onClick={() => nudge(0.1)} className="grid h-12 w-12 place-items-center rounded-2xl bg-card-2 text-xl font-bold" aria-label="Plus 0.1 kg">+</motion.button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date">
          <input type="date" max={todayKey()} className="field" value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Note (optional)">
          <input className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="After workout…" />
        </Field>
      </div>
      <Button type="submit" size="lg" className="w-full">
        Save weight
      </Button>
    </form>
  );
}

export function WaterQuick({ date = todayKey(), compact }) {
  const { totalMl, target, add } = useWater(date);
  const { toast } = useToast();
  const [custom, setCustom] = useState('');
  const doAdd = (ml) => {
    add(ml);
    const after = totalMl + ml;
    toast(after >= target && totalMl < target ? '💧 Water goal reached! Amazing!' : `+${ml} ml — ${fmtL(after)} today`);
  };
  return (
    <div className="space-y-3">
      <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {appConfig.waterQuickAmounts.map((ml) => (
          <motion.button
            key={ml}
            whileTap={{ scale: 0.9 }}
            whileHover={{ y: -2 }}
            onClick={() => doAdd(ml)}
            className="rounded-2xl border border-water/25 bg-water/10 py-3 font-display text-base font-bold text-water"
          >
            +{ml >= 1000 ? `${ml / 1000} L` : `${ml}`}
            {ml < 1000 && <span className="text-xs font-semibold"> ml</span>}
          </motion.button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const v = Number(custom);
          if (v) doAdd(v);
          setCustom('');
        }}
      >
        <input type="number" inputMode="numeric" className="field" placeholder="Custom ml (use − to correct)" value={custom} onChange={(e) => setCustom(e.target.value)} />
        <Button type="submit" variant="water">Add</Button>
      </form>
    </div>
  );
}

export function StepsForm({ date = todayKey(), onDone }) {
  const { day, save } = useDailyLog(date);
  const { goals } = useData();
  const { toast } = useToast();
  const [steps, setSteps] = useState(day.steps ?? '');
  const submit = (e) => {
    e.preventDefault();
    const s = Math.max(0, Math.round(Number(steps) || 0));
    save({ steps: s });
    toast(s >= goals.stepTarget ? '👟 Step goal smashed!' : `Steps saved: ${s.toLocaleString('en-IN')}`);
    onDone?.();
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        type="number"
        inputMode="numeric"
        className="w-full bg-transparent text-center font-display text-5xl font-bold outline-none"
        value={steps}
        onChange={(e) => setSteps(e.target.value)}
        placeholder="0"
        aria-label="Steps today"
      />
      <p className="text-center text-sm text-muted">Goal: {goals.stepTarget.toLocaleString('en-IN')} steps</p>
      <div className="grid grid-cols-4 gap-2">
        {[1000, 2500, 5000, 10000].map((n) => (
          <button type="button" key={n} onClick={() => setSteps((s) => (Number(s) || 0) + n)} className="rounded-xl bg-card-2 py-2 text-sm font-semibold">
            +{n >= 1000 ? `${n / 1000}K` : n}
          </button>
        ))}
      </div>
      <Button type="submit" size="lg" className="w-full">Save steps</Button>
    </form>
  );
}

export function WorkoutForm({ date = todayKey(), onDone }) {
  const { day, save, setHabit } = useDailyLog(date);
  const { toast } = useToast();
  const [type, setType] = useState(appConfig.workoutTypes[0]);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const slot = (id, label, icon) => (
    <button type="button" onClick={() => setHabit(id, !day.habits[id])} className="flex flex-1 items-center gap-3 rounded-2xl bg-card-2 p-3 text-left text-sm font-semibold">
      <Check checked={!!day.habits[id]} />
      <span>{icon} {label}</span>
    </button>
  );
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {slot('morning_workout', 'Morning', '🌅')}
        {slot('evening_workout', 'Evening', '🌆')}
      </div>
      <div className="rounded-2xl border border-line p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Add another workout</div>
        <Segmented size="sm" layoutId="wtype" options={appConfig.workoutTypes} value={type} onChange={setType} />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Minutes">
            <input type="number" inputMode="numeric" className="field" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </Field>
          <Field label="Notes">
            <input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </Field>
        </div>
        <Button
          className="mt-3 w-full"
          variant="soft"
          onClick={() => {
            save({ workouts: [...day.workouts, { id: uid(), type, duration: Number(duration) || 0, notes }] });
            toast(`${type} added 💪`);
            setNotes('');
            onDone?.();
          }}
        >
          Add {type.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}
