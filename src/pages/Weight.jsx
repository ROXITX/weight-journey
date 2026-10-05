import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { useAnalytics, useWeight } from '../hooks';
import { Card, PageHeader, SectionTitle, Button, IconButton, EmptyState, stagger } from '../components/common/ui';
import DateRangeSelector from '../components/common/DateRangeSelector';
import AnimatedNumber from '../components/common/AnimatedNumber';
import Modal from '../components/common/Modal';
import { WeightChart } from '../components/charts/Charts';
import { WeightJourney } from '../components/dashboard/Widgets';
import { WeightForm } from '../components/quick/QuickForms';
import { fmtKey } from '../utils/date';
import { calcBmi } from '../utils/calc';
import { signed } from '../utils/format';

function Stat({ label, value, unit = 'kg', decimals = 1, color, hint }) {
  return (
    <Card className="!p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold" style={{ color }}>
        {typeof value === 'number' ? <AnimatedNumber value={value} decimals={decimals} /> : value ?? '—'}
        {unit && value != null && <span className="ml-1 text-xs text-muted">{unit}</span>}
      </div>
      {hint && <div className="text-[11px] text-muted">{hint}</div>}
    </Card>
  );
}

export default function Weight() {
  const { profile } = useData();
  const { toast } = useToast();
  const { stats, entries, deleteWeight } = useWeight();
  const [sel, setSel] = useState({ range: '1M' });
  const a = useAnalytics(sel);
  const [edit, setEdit] = useState(null); // null | 'new' | entry
  const inRange = entries.filter((e) => e.date >= a.from && e.date <= a.to);
  const bmi = calcBmi(stats.current, profile.heightCm);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <PageHeader emoji="⚖️" title="Weight" subtitle="Every weigh-in, every trend.">
        <Button icon={Plus} onClick={() => setEdit('new')}>Add weight</Button>
      </PageHeader>

      <motion.div variants={stagger} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Current" value={stats.current} color="var(--c-accent)" hint={bmi ? `BMI ${bmi} (estimate)` : null} />
        <Stat label="Start" value={stats.start} />
        <Stat label="Target" value={stats.target} color="var(--c-primary)" />
        <Stat label="Lost" value={stats.lost} color="var(--c-primary)" hint={`${stats.progress.toFixed(1)}% of the way`} />
        <Stat label="Remaining" value={stats.remaining} color="var(--c-orange)" />
        <Stat label="Highest" value={stats.highest} />
        <Stat label="Lowest" value={stats.lowest} />
        <Stat label="Avg / week" value={stats.avgWeekly != null ? signed(-stats.avgWeekly, 2) : null} hint="Loss since start" />
        <Stat label="Avg / month" value={stats.avgMonthly != null ? signed(-stats.avgMonthly, 2) : null} />
        <Stat label="28-day trend" value={stats.trendPerWeek != null ? signed(stats.trendPerWeek, 2) : null} unit="kg/wk" />
        <Stat label="Est. target date" value={stats.reached ? '🎉 Reached' : stats.eta ? fmtKey(stats.eta, 'd MMM yy') : '—'} unit="" hint="Based on recent trend (estimate)" />
        <Stat label="Range change" value={a.weight.change != null ? signed(a.weight.change, 1) : null} hint={sel.range} />
      </motion.div>

      <Card className="mt-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display font-semibold">Weight chart</h2>
          <DateRangeSelector value={sel} onChange={setSel} layoutId="w-range" />
        </div>
        <WeightChart entries={inRange} start={stats.start} target={stats.target} height={300} />
      </Card>

      <div className="mt-4">
        <WeightJourney stats={stats} />
      </div>

      <Card className="mt-4">
        <SectionTitle>All weigh-ins ({entries.length})</SectionTitle>
        {!entries.length ? (
          <EmptyState icon="⚖️" title="No weight data yet." text="Start your journey today." action={<Button icon={Plus} onClick={() => setEdit('new')}>Add weight</Button>} />
        ) : (
          <ul className="divide-y divide-line">
            {[...entries].reverse().map((e, i, arr) => {
              const prev = arr[i + 1];
              const ch = prev ? e.weight - prev.weight : null;
              return (
                <motion.li key={e.date} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{fmtKey(e.date, 'EEE, d MMM yyyy')}</div>
                    {e.note && <div className="truncate text-xs text-muted">{e.note}</div>}
                  </div>
                  {ch != null && <span className={`text-xs font-bold ${ch > 0 ? 'text-danger' : 'text-primary'}`}>{signed(ch, 1)}</span>}
                  <span className="w-20 text-right font-display text-lg font-bold">{e.weight}</span>
                  <IconButton icon={Pencil} label="Edit" size={16} onClick={() => setEdit(e)} />
                  <IconButton
                    icon={Trash2}
                    label="Delete"
                    size={16}
                    className="hover:!text-danger"
                    onClick={() => {
                      if (confirm(`Delete weight for ${fmtKey(e.date)}?`)) {
                        deleteWeight(e.date);
                        toast('Weight deleted');
                      }
                    }}
                  />
                </motion.li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit === 'new' ? '⚖️ Add weight' : '✏️ Edit weight'}>
        {edit && <WeightForm key={edit === 'new' ? 'new' : edit.date} date={edit === 'new' ? undefined : edit.date} initial={edit === 'new' ? null : edit} onDone={() => setEdit(null)} />}
      </Modal>
    </motion.div>
  );
}
