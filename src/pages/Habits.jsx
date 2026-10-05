import { useState } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Plus, Pencil, GripVertical } from 'lucide-react';
import { useHabits, useAnalytics } from '../hooks';
import { useToast } from '../context/ToastContext';
import { Card, PageHeader, Button, Toggle, IconButton, SectionTitle } from '../components/common/ui';
import DateRangeSelector from '../components/common/DateRangeSelector';
import { ProgressBar } from '../components/common/ProgressRing';
import Modal from '../components/common/Modal';
import HabitEditor from '../components/habits/HabitEditor';
import { habitCategories, defaultHabits } from '../config/defaultHabits';

export default function Habits() {
  const { habits, saveHabits } = useHabits();
  const { toast } = useToast();
  const [edit, setEdit] = useState(null);
  const [sel, setSel] = useState({ range: '1M' });
  const a = useAnalytics(sel);
  const rate = Object.fromEntries(a.habitRates.map((r) => [r.habit.id, r]));
  const [order, setOrder] = useState(null);
  const list = order || habits;

  const upsert = (h) => {
    const exists = habits.some((x) => x.id === h.id);
    saveHabits(exists ? habits.map((x) => (x.id === h.id ? h : x)) : [...habits, h]);
    toast(exists ? 'Habit updated' : 'Habit added');
    setEdit(null);
  };

  return (
    <div className="space-y-4">
      <PageHeader emoji="✅" title="Habits" subtitle="Add, edit, disable or reorder your daily checklist.">
        <Button icon={Plus} onClick={() => setEdit('new')}>New habit</Button>
      </PageHeader>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SectionTitle className="!mb-0">Completion rate</SectionTitle>
          <DateRangeSelector value={sel} onChange={setSel} layoutId="hab-range" />
        </div>
        <p className="mb-3 text-xs text-muted">Drag ⋮⋮ to reorder. Toggle to enable/disable. Disabled habits don't count in your score.</p>
        <Reorder.Group
          axis="y"
          values={list}
          onReorder={setOrder}
          className="space-y-2"
        >
          {list.map((h) => {
            const r = rate[h.id];
            const cat = habitCategories.find((c) => c.id === h.category) || habitCategories.at(-1);
            return (
              <Reorder.Item
                key={h.id}
                value={h}
                onDragEnd={() => order && (saveHabits(order), setOrder(null))}
                className={`flex items-center gap-3 rounded-2xl border border-line bg-card px-2 py-2.5 ${h.enabled ? '' : 'opacity-50'}`}
              >
                <GripVertical size={16} className="-mr-1 shrink-0 cursor-grab text-muted active:cursor-grabbing" />
                <span className="text-xl">{h.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="line-clamp-2 text-sm font-semibold leading-tight">{h.label}</span>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cat.color }} title={cat.label} />
                    {h.auto && <span className="rounded bg-card-2 px-1 text-[10px] font-bold text-muted">AUTO</span>}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <ProgressBar value={r ? (r.done / r.total) * 100 : 0} className="h-1.5" color={cat.color} />
                    <span className="w-11 shrink-0 text-right text-[11px] text-muted">{r ? `${r.done}/${r.total}` : '—'}</span>
                  </div>
                </div>
                <IconButton icon={Pencil} size={16} label={`Edit ${h.label}`} onClick={() => setEdit(h)} />
                <Toggle checked={h.enabled} onChange={(v) => saveHabits(habits.map((x) => (x.id === h.id ? { ...x, enabled: v } : x)))} label={`Enable ${h.label}`} />
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
        <motion.div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm('Reset habits to the default list? Custom habits will be removed.')) {
                saveHabits(defaultHabits);
                toast('Habits reset');
              }
            }}
          >
            Reset to defaults
          </Button>
        </motion.div>
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? 'New habit' : 'Edit habit'}>
        {edit && (
          <HabitEditor
            habit={edit === 'new' ? null : edit}
            onSave={upsert}
            onCancel={() => setEdit(null)}
            onDelete={
              edit !== 'new'
                ? () => {
                    if (confirm(`Delete "${edit.label}"? Past check-ins stay in your logs.`)) {
                      saveHabits(habits.filter((x) => x.id !== edit.id));
                      toast('Habit deleted');
                      setEdit(null);
                    }
                  }
                : null
            }
          />
        )}
      </Modal>
    </div>
  );
}
