import { useState } from 'react';
import { Button, Field, Segmented, Toggle } from '../common/ui';
import { useData } from '../../context/DataContext';
import { useToast } from '../../context/ToastContext';

const Row = ({ title, sub, on, onToggle, children }) => (
  <div className="rounded-2xl bg-card-2/60 p-3">
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-muted">{sub}</div>
      </div>
      <Toggle checked={on} onChange={onToggle} label={title} />
    </div>
    {on && children && <div className="mt-3">{children}</div>}
  </div>
);

/**
 * Stored at users/{uid}.notifications. The Google Apps Script (google-apps-script/) reads
 * these settings every 15 minutes and sends the emails — no email credentials in this app.
 */
export default function ReminderSettings() {
  const { notifications, saveUser } = useData();
  const { toast } = useToast();
  const [n, setN] = useState(notifications);
  const set = (k) => (v) => setN((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));
  const custom = ![1, 2, 3].includes(Number(n.waterEveryHours));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl border border-line p-3">
        <div>
          <div className="font-semibold">Email reminders</div>
          <div className="text-xs text-muted">Requires the Apps Script setup — see EMAIL_SETUP.md</div>
        </div>
        <Toggle checked={n.enabled} onChange={set('enabled')} label="Email reminders" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email"><input type="email" className="field" value={n.email} onChange={set('email')} placeholder="you@gmail.com" /></Field>
        <Field label="Time zone"><input className="field" value={n.timezone} onChange={set('timezone')} placeholder="Asia/Kolkata" /></Field>
      </div>
      <Row title="🌅 Morning reminder" sub="Today's goals + carry your water bottle" on={n.morningOn} onToggle={set('morningOn')}>
        <input type="time" className="field" value={n.morning} onChange={set('morning')} aria-label="Morning time" />
      </Row>
      <Row title="💧 Water reminders" sub="Skipped automatically once your water goal is done" on={n.waterOn} onToggle={set('waterOn')}>
        <Segmented size="sm" layoutId="water-every" options={[{ id: 1, label: 'Every 1h' }, { id: 2, label: 'Every 2h' }, { id: 3, label: 'Every 3h' }, { id: 'c', label: 'Custom' }]} value={custom ? 'c' : Number(n.waterEveryHours)} onChange={(v) => set('waterEveryHours')(v === 'c' ? 1.5 : v)} />
        <div className="mt-2 grid grid-cols-3 gap-2">
          {custom && <Field label="Every (hours)"><input type="number" step="0.5" min="0.5" className="field" value={n.waterEveryHours} onChange={(e) => set('waterEveryHours')(Number(e.target.value))} /></Field>}
          <Field label="From"><input type="time" className="field" value={n.waterStart} onChange={set('waterStart')} /></Field>
          <Field label="Until"><input type="time" className="field" value={n.waterEnd} onChange={set('waterEnd')} /></Field>
        </div>
      </Row>
      <Row title="📊 Evening check-in" sub="Steps / water / workout status + what's remaining" on={n.eveningOn} onToggle={set('eveningOn')}>
        <input type="time" className="field" value={n.evening} onChange={set('evening')} aria-label="Evening time" />
      </Row>
      <Row title="🌙 Night review" sub="Have you completed today's tracking?" on={n.nightOn} onToggle={set('nightOn')}>
        <input type="time" className="field" value={n.night} onChange={set('night')} aria-label="Night time" />
      </Row>
      <Button
        className="w-full"
        onClick={() => {
          if (n.enabled && !/^\S+@\S+\.\S+$/.test(n.email)) return toast('Enter a valid email for reminders.', 'error');
          saveUser({ notifications: n });
          toast('Reminder settings saved');
        }}
      >
        Save reminders
      </Button>
    </div>
  );
}
