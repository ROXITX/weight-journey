import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAnalytics } from '../hooks';
import { Card, PageHeader, Segmented, EmptyState, Button, Pill, stagger } from '../components/common/ui';
import DateRangeSelector from '../components/common/DateRangeSelector';
import Modal from '../components/common/Modal';
import DayDetail from '../components/logs/DayDetail';
import { heatColor } from '../components/charts/Charts';
import { fmtKey } from '../utils/date';
import { fmtHours, fmtInt } from '../utils/format';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'good', label: 'Good days' },
  { id: 'missed', label: 'Below target' },
  { id: 'weight', label: 'With weight' },
  { id: 'journal', label: 'With journal' },
];
const PAGE = 20;

function LogCard({ d, goals, onOpen }) {
  const w = d.habits;
  const mark = (v) => (v ? '✓' : '✗');
  return (
    <motion.button
      layout
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="card w-full !rounded-3xl p-4 text-left"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl font-display text-sm font-bold" style={{ background: heatColor(d.pct, d.logged), color: d.pct > 50 ? '#fff' : 'var(--c-text)' }}>
          {d.pct}%
        </span>
        <div className="min-w-0 flex-1">
          <div className="font-display font-bold">{fmtKey(d.date, 'EEEE, d MMM yyyy')}</div>
          <div className="text-xs text-muted">{d.done}/{d.total} goals · {d.missed.length} missed</div>
        </div>
        {d.weight && <Pill tone="info">{d.weight} kg</Pill>}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-4">
        <span>💧 {(d.waterMl / 1000).toFixed(1)} / {goals.waterTarget} L</span>
        <span>🚶 {fmtInt(d.steps || 0)} / {fmtInt(goals.stepTarget)}</span>
        <span>🏋️ {mark(w.morning_workout)} Morning {mark(w.evening_workout)} Evening</span>
        <span>😴 {d.sleep?.hours ? fmtHours(d.sleep.hours) : '—'} {d.mood ? `· 🙂 ${d.mood}/10` : ''}</span>
        <span className={w.no_junk ? 'text-primary' : 'text-danger'}>{mark(w.no_junk)} No junk</span>
        <span className={w.no_sugar ? 'text-primary' : 'text-danger'}>{mark(w.no_sugar)} No sugar</span>
        <span className={d.food?.overate ? 'text-danger' : d.food?.overate === false ? 'text-primary' : 'text-muted'}>{d.food?.overate ? '✗ Overate' : d.food?.overate === false ? '✓ Did not overeat' : '– Overeat ?'}</span>
        <span className={w.cold_bath ? 'text-primary' : 'text-danger'}>{mark(w.cold_bath)} Cold bath</span>
      </div>
    </motion.button>
  );
}

export default function Logs() {
  const { date } = useParams();
  const nav = useNavigate();
  const { goals } = useData();
  const [sel, setSel] = useState({ range: '1M' });
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [limit, setLimit] = useState(PAGE);
  const a = useAnalytics(sel);

  const list = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return [...a.days]
      .reverse()
      .filter((d) => {
        if (filter === 'good') return d.logged && d.pct >= goals.consistencyTarget;
        if (filter === 'missed') return d.pct < goals.consistencyTarget;
        if (filter === 'weight') return d.weight != null;
        if (filter === 'journal') return Object.values(d.journal || {}).some(Boolean);
        return true;
      })
      .filter((d) => !ql || JSON.stringify(d.journal || {}).toLowerCase().includes(ql) || d.weightNote.toLowerCase().includes(ql));
  }, [a.days, filter, q, goals.consistencyTarget]);

  return (
    <div>
      <PageHeader emoji="📜" title="Logs" subtitle="Every day — what you ticked, and what you didn't." />
      <div className="mb-4 space-y-2">
        <DateRangeSelector value={sel} onChange={(v) => (setSel(v), setLimit(PAGE))} layoutId="logs-range" />
        <Segmented size="sm" layoutId="logs-filter" options={FILTERS} value={filter} onChange={setFilter} />
        <label className="relative block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="field !pl-9" placeholder="Search journal & notes" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>
      {!list.length ? (
        <Card><EmptyState icon="📭" title="No logs here yet" text="Try a different range or filter — or log today." /></Card>
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 lg:grid-cols-2">
          {list.slice(0, limit).map((d) => (
            <LogCard key={d.date} d={d} goals={goals} onOpen={() => nav(`/logs/${d.date}`)} />
          ))}
        </motion.div>
      )}
      {list.length > limit && (
        <div className="mt-4 text-center">
          <Button variant="soft" onClick={() => setLimit((l) => l + PAGE)}>Show more</Button>
        </div>
      )}
      <Modal open={!!date} onClose={() => nav('/logs')} title="Daily log" wide>
        {date && <DayDetail date={date} />}
      </Modal>
    </div>
  );
}
