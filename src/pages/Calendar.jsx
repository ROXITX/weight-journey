import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, endOfMonth, format, startOfMonth } from 'date-fns';
import { useData } from '../context/DataContext';
import { Card, PageHeader, Button } from '../components/common/ui';
import Modal from '../components/common/Modal';
import DayDetail from '../components/logs/DayDetail';
import { heatColor } from '../components/charts/Charts';
import { HeatLegend } from '../components/dashboard/ConsistencyHeatmap';
import { keysBetween, toKey, todayKey, fromKey } from '../utils/date';
import { pct } from '../utils/format';

export default function Calendar() {
  const { byDate, goals, loadAll } = useData();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [dir, setDir] = useState(0);
  const [open, setOpen] = useState(null);
  const keys = keysBetween(toKey(startOfMonth(month)), toKey(endOfMonth(month)));
  const pad = fromKey(keys[0]).getDay();
  const today = todayKey();

  const shift = (n) => {
    setDir(n);
    setMonth((m) => addMonths(m, n));
    loadAll();
  };
  const monthDays = keys.map((k) => byDate[k]).filter((d) => d?.logged);
  const avg = monthDays.length ? Math.round(monthDays.reduce((s, d) => s + d.pct, 0) / monthDays.length) : null;

  return (
    <div>
      <PageHeader emoji="📅" title="Calendar" subtitle="Each day coloured by consistency. Tap a day for its full record." />
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft size={18} /></Button>
          <div className="text-center">
            <div className="font-display text-xl font-bold">{format(month, 'MMMM yyyy')}</div>
            <div className="text-xs text-muted">{monthDays.length} days logged{avg != null ? ` · ${avg}% avg` : ''}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => shift(1)} disabled={toKey(addMonths(month, 1)) > today} aria-label="Next month"><ChevronRight size={18} /></Button>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold text-muted">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={keys[0]} initial={{ opacity: 0, x: dir * 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: dir * -40 }} transition={{ duration: 0.22 }} className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: pad }).map((_, i) => <div key={`p${i}`} />)}
            {keys.map((k, i) => {
              const d = byDate[k];
              const future = k > today;
              const strong = d?.logged && d.pct > 50;
              return (
                <motion.button
                  key={k}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: future ? 0.35 : 1, scale: 1 }}
                  transition={{ delay: i * 0.008 }}
                  whileHover={!future ? { scale: 1.06 } : undefined}
                  whileTap={!future ? { scale: 0.94 } : undefined}
                  disabled={future}
                  onClick={() => setOpen(k)}
                  className="relative flex aspect-[4/5] flex-col rounded-xl p-1 text-left sm:aspect-square sm:p-2"
                  style={{ background: d?.logged ? heatColor(d.pct, true) : 'var(--c-card-2)', color: strong ? '#fff' : 'var(--c-text)', boxShadow: k === today ? '0 0 0 2px var(--c-primary)' : undefined }}
                  aria-label={`${k}: ${d?.logged ? `${d.pct}%` : 'not logged'}`}
                >
                  <span className="text-xs font-bold sm:text-sm">{Number(k.slice(8))}</span>
                  {d?.logged && (
                    <span className="mt-auto space-y-0.5 text-[9px] leading-tight sm:text-[11px]">
                      <span className="block font-display text-[11px] font-bold sm:text-base">{d.pct}%</span>
                      <span className="hidden sm:block">{d.weight ? `⚖️ ${d.weight}` : ''}</span>
                      <span className="hidden sm:block">💧{pct(d.waterMl, goals.waterTarget * 1000)}% 🚶{pct(d.steps, goals.stepTarget)}%</span>
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
        <HeatLegend />
      </Card>
      <Modal open={!!open} onClose={() => setOpen(null)} title="Daily record" wide>
        {open && <DayDetail date={open} />}
      </Modal>
    </div>
  );
}
