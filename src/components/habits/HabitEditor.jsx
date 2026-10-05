import { useState } from 'react';
import { Button, Field, Segmented } from '../common/ui';
import { habitCategories, habitTypes } from '../../config/defaultHabits';

const EMOJIS = ['✅', '💪', '🏃', '🧘', '📖', '🥗', '🍎', '💧', '🛌', '🚭', '☕', '🎯', '🧠', '🌞', '📵', '🎵', '🧹', '💊'];

/** Add / edit a habit. */
export default function HabitEditor({ habit, onSave, onDelete, onCancel }) {
  const [h, setH] = useState(
    habit || { id: '', label: '', icon: '✅', category: 'custom', type: 'boolean', target: 1, unit: '', weight: 1, enabled: true, frequency: 'daily' },
  );
  const set = (k) => (v) => setH((s) => ({ ...s, [k]: v?.target ? v.target.value : v }));
  const isNum = h.type !== 'boolean';
  const save = (e) => {
    e.preventDefault();
    if (!h.label.trim()) return;
    const id = h.id || `custom_${h.label.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 24)}_${Date.now().toString(36).slice(-3)}`;
    onSave({ ...h, id, label: h.label.trim(), target: Number(h.target) || 1, weight: Number(h.weight) || 1 });
  };
  return (
    <form onSubmit={save} className="space-y-3">
      <div className="flex gap-2">
        <Field label="Icon" className="w-20"><input className="field text-center text-xl" value={h.icon} onChange={set('icon')} maxLength={4} /></Field>
        <Field label="Name" className="flex-1"><input className="field" value={h.label} onChange={set('label')} placeholder="e.g. Drink green tea" required /></Field>
      </div>
      <div className="no-scrollbar flex gap-1 overflow-x-auto">
        {EMOJIS.map((e) => (
          <button type="button" key={e} onClick={() => setH((s) => ({ ...s, icon: e }))} className={`h-9 w-9 shrink-0 rounded-lg text-lg ${h.icon === e ? 'bg-primary/20' : 'bg-card-2'}`}>{e}</button>
        ))}
      </div>
      <Field label="Category"><Segmented size="sm" layoutId="he-cat" options={habitCategories.map((c) => ({ id: c.id, label: c.label }))} value={h.category} onChange={set('category')} /></Field>
      {!h.auto && <Field label="Type"><Segmented size="sm" layoutId="he-type" options={habitTypes} value={h.type} onChange={set('type')} /></Field>}
      {h.auto && <p className="rounded-xl bg-card-2 px-3 py-2 text-xs text-muted">This habit is calculated automatically from your {h.auto} data (its target comes from Settings → Goals).</p>}
      <div className="grid grid-cols-3 gap-2">
        {isNum && !h.auto && <Field label="Target"><input type="number" className="field" value={h.target} onChange={set('target')} /></Field>}
        {isNum && !h.auto && <Field label="Unit"><input className="field" value={h.unit} onChange={set('unit')} placeholder="times, min…" /></Field>}
        <Field label="Score weight" hint="How much it counts"><input type="number" step="0.5" min="0.5" className="field" value={h.weight} onChange={set('weight')} /></Field>
      </div>
      <Field label="Frequency">
        <Segmented size="sm" layoutId="he-freq" options={[{ id: 'daily', label: 'Every day' }, { id: 'weekdays', label: 'Weekdays' }, { id: 'weekends', label: 'Weekends' }]} value={h.frequency || 'daily'} onChange={set('frequency')} />
      </Field>
      <div className="flex gap-2 pt-2">
        {onDelete && <Button type="button" variant="danger" onClick={onDelete}>Delete</Button>}
        <Button type="button" variant="soft" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1">Save habit</Button>
      </div>
    </form>
  );
}
