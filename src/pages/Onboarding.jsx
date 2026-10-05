import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { Button, Field, Segmented, Toggle } from '../components/common/ui';
import { activityLevels, defaultGoals, defaultNotifications } from '../config/defaultGoals';
import { defaultHabits } from '../config/defaultHabits';
import { calcMaintenance } from '../utils/calc';
import { todayKey } from '../utils/date';
import { fmtInt } from '../utils/format';

const STEPS = ['Welcome', 'Body', 'Goal', 'Daily targets', 'Reminders'];

export default function Onboarding() {
  const { profile, goals, notifications, saveUser, saveWeight, user, userDoc } = useData();
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [p, setP] = useState({ ...profile, currentWeight: profile.startWeight || '' });
  const [g, setG] = useState({ ...defaultGoals, ...goals });
  const [n, setN] = useState({ ...defaultNotifications, ...notifications, email: notifications.email || '' });
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setP((s) => ({ ...s, [k]: e?.target ? e.target.value : e }));
  const upG = (k) => (e) => setG((s) => ({ ...s, [k]: Number(e.target.value) }));

  const valid = [true, p.name && p.age && p.heightCm, p.currentWeight && p.targetWeight, g.stepTarget && g.waterTarget, true][step];
  const move = (d) => {
    setDir(d);
    setStep((s) => s + d);
  };
  const est = calcMaintenance({ ...p, age: Number(p.age), heightCm: Number(p.heightCm) }, Number(p.currentWeight));

  const finish = async () => {
    setBusy(true);
    const w = Number(p.currentWeight);
    const { currentWeight, ...rest } = p;
    // Don't wait forever if offline — Firestore applies the write locally right away.
    await Promise.race([saveUser({
      profile: { ...rest, age: Number(p.age), heightCm: Number(p.heightCm), startWeight: Number(profile.startWeight) || w, targetWeight: Number(p.targetWeight), email: n.email, startDate: profile.startDate || todayKey() },
      goals: g,
      habits: userDoc?.habits?.length ? userDoc.habits : defaultHabits,
      notifications: n,
      onboarded: true,
    }), new Promise((r) => setTimeout(r, 1500))]);
    if (w) saveWeight(todayKey(), w, 'Starting weight');
    nav('/dashboard', { replace: true });
  };

  const body = [
    <div key="0" className="text-center">
      <motion.div animate={{ rotate: [0, 14, -8, 14, 0] }} transition={{ duration: 1.5, delay: 0.3 }} className="text-7xl">👋</motion.div>
      <h1 className="mt-4 font-display text-3xl font-bold">Welcome{user?.displayName ? `, ${user.displayName}` : ''}!</h1>
      <p className="mx-auto mt-2 max-w-xs text-muted">Let's set up your journey. It takes about a minute — you can change everything later in Settings.</p>
    </div>,
    <div key="1" className="space-y-3">
      <Field label="Name"><input className="field" value={p.name} onChange={up('name')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Age"><input type="number" inputMode="numeric" className="field" value={p.age} onChange={up('age')} /></Field>
        <Field label="Height (cm)"><input type="number" inputMode="numeric" className="field" value={p.heightCm} onChange={up('heightCm')} /></Field>
      </div>
      <Field label="Gender (for calorie estimate)">
        <Segmented layoutId="ob-gender" options={[{ id: 'male', label: 'Male' }, { id: 'female', label: 'Female' }]} value={p.gender} onChange={up('gender')} />
      </Field>
      <Field label="Activity level">
        <div className="grid gap-2">
          {activityLevels.map((a) => (
            <button key={a.id} onClick={() => setP((s) => ({ ...s, activityLevel: a.id }))} className={`rounded-2xl border px-3 py-2 text-left text-sm ${p.activityLevel === a.id ? 'border-primary bg-primary/10' : 'border-line bg-card-2/50'}`}>
              <b>{a.label}</b> <span className="text-muted">· {a.hint}</span>
            </button>
          ))}
        </div>
      </Field>
    </div>,
    <div key="2" className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Current (kg)"><input type="number" inputMode="decimal" step="0.1" className="field text-lg font-bold" value={p.currentWeight} onChange={up('currentWeight')} /></Field>
        <Field label="Target (kg)"><input type="number" inputMode="decimal" step="0.1" className="field text-lg font-bold" value={p.targetWeight || ''} onChange={up('targetWeight')} /></Field>
      </div>
      {est.maintenance && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-[linear-gradient(135deg,color-mix(in_srgb,var(--c-orange)_18%,transparent),color-mix(in_srgb,var(--c-warning)_10%,transparent))] p-4 text-center">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted">🔥 Estimated maintenance</div>
          <div className="font-display text-3xl font-bold">{fmtInt(est.maintenance)} <span className="text-base">kcal/day</span></div>
          <div className="text-xs text-muted">Estimate (Mifflin-St Jeor × activity). Not medical advice.</div>
        </motion.div>
      )}
      <Field label="Daily calorie target (kcal)" hint="A modest deficit below maintenance is a common approach.">
        <input type="number" inputMode="numeric" className="field" value={g.calorieTarget} onChange={upG('calorieTarget')} />
      </Field>
    </div>,
    <div key="3" className="grid grid-cols-2 gap-3">
      <Field label="Steps / day"><input type="number" inputMode="numeric" className="field" value={g.stepTarget} onChange={upG('stepTarget')} /></Field>
      <Field label="Water (litres)"><input type="number" inputMode="decimal" step="0.25" className="field" value={g.waterTarget} onChange={upG('waterTarget')} /></Field>
      <Field label="Workouts / day"><input type="number" inputMode="numeric" className="field" value={g.workoutTarget} onChange={upG('workoutTarget')} /></Field>
      <Field label="Sleep (hours)"><input type="number" inputMode="decimal" step="0.5" className="field" value={g.sleepTarget} onChange={upG('sleepTarget')} /></Field>
      <Field label="Good-day consistency %" className="col-span-2"><input type="number" inputMode="numeric" className="field" value={g.consistencyTarget} onChange={upG('consistencyTarget')} /></Field>
    </div>,
    <div key="4" className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl bg-card-2 p-3">
        <div>
          <div className="font-semibold">Email reminders</div>
          <div className="text-xs text-muted">Morning, water, 7 PM check-in, night review</div>
        </div>
        <Toggle checked={n.enabled} onChange={(v) => setN((s) => ({ ...s, enabled: v }))} label="Email reminders" />
      </div>
      <Field label="Email" hint="Reminders are sent by your Google Apps Script (see EMAIL_SETUP.md)."><input type="email" className="field" value={n.email} onChange={(e) => setN((s) => ({ ...s, email: e.target.value }))} placeholder="you@gmail.com" /></Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Morning"><input type="time" className="field" value={n.morning} onChange={(e) => setN((s) => ({ ...s, morning: e.target.value }))} /></Field>
        <Field label="Evening"><input type="time" className="field" value={n.evening} onChange={(e) => setN((s) => ({ ...s, evening: e.target.value }))} /></Field>
        <Field label="Night"><input type="time" className="field" value={n.night} onChange={(e) => setN((s) => ({ ...s, night: e.target.value }))} /></Field>
      </div>
    </div>,
  ][step];

  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-8">
      <div className="aurora" aria-hidden />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-5 flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
              <motion.div className="h-full bg-[linear-gradient(90deg,var(--c-primary),var(--c-secondary))]" animate={{ width: i <= step ? '100%' : '0%' }} />
            </div>
          ))}
        </div>
        <div className="glass overflow-hidden rounded-[28px] p-5 shadow-2xl">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted">Step {step + 1} · {STEPS[step]}</div>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={step} custom={dir} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.25 }}>
              {body}
            </motion.div>
          </AnimatePresence>
          <div className="mt-6 flex gap-2">
            {step > 0 && <Button variant="soft" onClick={() => move(-1)} icon={ArrowLeft}>Back</Button>}
            {step < STEPS.length - 1 ? (
              <Button className="flex-1" onClick={() => move(1)} disabled={!valid}>
                {step === 0 ? "Let's go" : 'Next'} <ArrowRight size={18} />
              </Button>
            ) : (
              <Button className="flex-1" onClick={finish} loading={busy}>Start my journey 🚀</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
