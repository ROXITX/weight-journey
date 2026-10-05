import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor, Download, Upload, Trash2, ListChecks, LogOut, ChevronRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../hooks';
import { Card, PageHeader, SectionTitle, Button, Field, Segmented, stagger } from '../components/common/ui';
import ReminderSettings from '../components/notifications/ReminderSettings';
import { activityLevels } from '../config/defaultGoals';
import { isFirebaseConfigured } from '../config/firebase';
import { exportJson, exportCsv, importJson } from '../services/exportService';
import { changePassword } from '../services/authService';
import { db, COLLECTIONS } from '../services/db';
import { friendlyError } from '../utils/errors';
import { fmtInt } from '../utils/format';

const TABS = ['Profile', 'Goals', 'Reminders', 'Appearance', 'Data'];

function ProfileForm() {
  const { profile, saveUser, calories } = useData();
  const { toast } = useToast();
  const [p, setP] = useState(profile);
  const up = (k, num) => (e) => setP((s) => ({ ...s, [k]: num ? (e.target.value === '' ? null : Number(e.target.value)) : e.target?.value ?? e }));
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Field label="Name" className="col-span-2 md:col-span-1"><input className="field" value={p.name} onChange={up('name')} /></Field>
        <Field label="Age"><input type="number" className="field" value={p.age ?? ''} onChange={up('age', true)} /></Field>
        <Field label="Height (cm)"><input type="number" className="field" value={p.heightCm ?? ''} onChange={up('heightCm', true)} /></Field>
        <Field label="Starting weight (kg)"><input type="number" step="0.1" className="field" value={p.startWeight ?? ''} onChange={up('startWeight', true)} /></Field>
        <Field label="Target weight (kg)"><input type="number" step="0.1" className="field" value={p.targetWeight ?? ''} onChange={up('targetWeight', true)} /></Field>
        <Field label="Journey start date"><input type="date" className="field" value={p.startDate || ''} onChange={up('startDate')} /></Field>
      </div>
      <Field label="Gender (for calorie estimate)"><Segmented layoutId="set-gender" options={[{ id: 'male', label: 'Male' }, { id: 'female', label: 'Female' }]} value={p.gender} onChange={(v) => setP((s) => ({ ...s, gender: v }))} /></Field>
      <Field label="Activity level">
        <select className="field" value={p.activityLevel} onChange={up('activityLevel')}>
          {activityLevels.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.hint} (×{a.factor})</option>)}
        </select>
      </Field>
      <Field label="Maintenance calories override (optional)" hint={`Estimated: ${fmtInt(calories.estimated)} kcal/day. Leave empty to use the estimate.`}>
        <input type="number" className="field" value={p.maintenanceOverride ?? ''} onChange={up('maintenanceOverride', true)} placeholder="e.g. 2300" />
      </Field>
      <Button className="w-full" onClick={() => (saveUser({ profile: p }), toast('Profile saved'))}>Save profile</Button>
    </div>
  );
}

function GoalsForm() {
  const { goals, saveUser } = useData();
  const { toast } = useToast();
  const [g, setG] = useState(goals);
  const up = (k) => (e) => setG((s) => ({ ...s, [k]: Number(e.target.value) }));
  const F = [
    ['stepTarget', '🚶 Steps / day', 1000],
    ['waterTarget', '💧 Water (litres) / day', 0.25],
    ['workoutTarget', '🏋️ Workouts / day', 1],
    ['sleepTarget', '😴 Sleep (hours)', 0.5],
    ['calorieTarget', '🔥 Calorie target (kcal)', 50],
    ['consistencyTarget', '📊 Good-day consistency (%)', 5],
  ];
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {F.map(([k, l, step]) => (
          <Field key={k} label={l}><input type="number" step={step} className="field text-lg font-bold" value={g[k]} onChange={up(k)} /></Field>
        ))}
      </div>
      <p className="text-xs text-muted">Changing a goal instantly updates the dashboard, progress bars, charts, scores, heatmap and email reminders.</p>
      <Button className="w-full" onClick={() => (saveUser({ goals: g }), toast('Goals saved'))}>Save goals</Button>
      <Link to="/habits" className="flex items-center justify-between rounded-2xl bg-card-2 p-3 text-sm font-semibold">
        <span className="flex items-center gap-2"><ListChecks size={18} className="text-pink" /> Manage habits & score weights</span>
        <ChevronRight size={18} />
      </Link>
    </div>
  );
}

function Appearance() {
  const { mode, setMode } = useTheme();
  const opts = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {opts.map(({ id, label, icon: Icon }) => (
        <motion.button key={id} whileTap={{ scale: 0.95 }} onClick={() => setMode(id)} className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-sm font-semibold ${mode === id ? 'border-primary bg-primary/10' : 'border-line bg-card-2/50'}`}>
          <Icon size={22} />
          {label}
        </motion.button>
      ))}
    </div>
  );
}

function DataPanel() {
  const { uid, userDoc, habits } = useData();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const file = useRef();
  const [busy, setBusy] = useState('');
  const [pw, setPw] = useState({ cur: '', next: '' });
  const wrap = (k, fn) => async () => {
    setBusy(k);
    try {
      await fn();
    } catch (e) {
      toast(friendlyError(e), 'error');
    }
    setBusy('');
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Button variant="soft" icon={Download} loading={busy === 'json'} onClick={wrap('json', () => exportJson(uid, userDoc))}>Export JSON</Button>
        <Button variant="soft" icon={Download} loading={busy === 'csv'} onClick={wrap('csv', () => exportCsv(uid, userDoc, habits))}>Export CSV</Button>
      </div>
      <input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files[0] && wrap('imp', async () => toast(`Imported ${await importJson(uid, e.target.files[0])} records`))()} />
      <Button variant="soft" className="w-full" icon={Upload} loading={busy === 'imp'} onClick={() => file.current.click()}>Import JSON backup</Button>
      <Button
        variant="danger"
        className="w-full"
        icon={Trash2}
        loading={busy === 'del'}
        onClick={wrap('del', async () => {
          if (prompt('This permanently deletes ALL your data. Type DELETE to confirm.') !== 'DELETE') return;
          await db.deleteAll(uid, COLLECTIONS);
          toast('All data deleted');
        })}
      >
        Delete all my data
      </Button>
      {isFirebaseConfigured && (
        <div className="space-y-2 rounded-2xl border border-line p-3">
          <div className="text-sm font-semibold">Change password</div>
          <input type="password" className="field" placeholder="Current password" autoComplete="current-password" value={pw.cur} onChange={(e) => setPw({ ...pw, cur: e.target.value })} />
          <input type="password" className="field" placeholder="New password (min 6)" autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <Button variant="soft" className="w-full" loading={busy === 'pw'} onClick={wrap('pw', async () => (await changePassword(pw.cur, pw.next), setPw({ cur: '', next: '' }), toast('Password changed')))}>Update password</Button>
        </div>
      )}
      <Button variant="ghost" className="w-full" icon={LogOut} onClick={signOut}>Log out</Button>
      <p className="text-center text-xs text-muted">{isFirebaseConfigured ? 'Synced with Firebase ☁️' : 'Local demo mode — data saved in this browser only'}</p>
    </div>
  );
}

export default function Settings() {
  const [tab, setTab] = useState('Profile');
  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <PageHeader emoji="⚙️" title="Settings" subtitle="Everything is configurable." />
      <Segmented layoutId="settings-tab" className="mb-4" options={TABS} value={tab} onChange={setTab} />
      <Card key={tab}>
        <SectionTitle>{tab}</SectionTitle>
        {tab === 'Profile' && <ProfileForm />}
        {tab === 'Goals' && <GoalsForm />}
        {tab === 'Reminders' && <ReminderSettings />}
        {tab === 'Appearance' && <Appearance />}
        {tab === 'Data' && <DataPanel />}
      </Card>
    </motion.div>
  );
}
