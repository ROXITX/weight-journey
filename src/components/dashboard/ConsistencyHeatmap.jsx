import { memo, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { addDaysKey, fmtKey, fromKey, keysBetween, todayKey } from '../../utils/date';
import { heatColor } from '../charts/Charts';
import { appConfig } from '../../config/appConfig';

const CELL = 13;
const GAP = 3;

/** Legend: Less □□□□□□ More + what each colour means. */
export function HeatLegend() {
  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted">
        Less
        {[0, 1, 2, 3, 4, 5].map((l) => (
          <span key={l} className="h-3 w-3 rounded-[3px]" style={{ background: `var(--heat-${l})` }} />
        ))}
        More
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
        {appConfig.heatBuckets.map((b, l) => (
          <span key={b.label} className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: `var(--heat-${l})` }} />
            {b.label}
            {l === 0 ? ' / not logged' : l === 5 ? ' perfect' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * GitHub-style contribution grid. Each square = one day; colour = % of goals achieved.
 * Clicking a day opens its full log.
 */
export default memo(function ConsistencyHeatmap({ byDate, from, to = todayKey() }) {
  const nav = useNavigate();
  const scroller = useRef(null);
  const weeks = useMemo(() => {
    const start = addDaysKey(from, -fromKey(from).getDay()); // pad to Sunday
    const keys = keysBetween(start, to);
    const cols = [];
    for (let i = 0; i < keys.length; i += 7) cols.push(keys.slice(i, i + 7));
    return cols;
  }, [from, to]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [weeks.length]);

  const months = weeks.map((w, i) => {
    const first = w.find((k) => k.endsWith('-01')) || (i === 0 ? w[0] : null);
    return first ? fmtKey(first, 'MMM') : '';
  });

  return (
    <div>
      <div ref={scroller} className="no-scrollbar overflow-x-auto pb-1">
        <div className="inline-flex gap-[3px] pl-7">
          {months.map((m, i) => (
            <div key={i} className="text-[10px] text-muted" style={{ width: CELL, marginRight: 0 }}>
              <span className="whitespace-nowrap">{m}</span>
            </div>
          ))}
        </div>
        <div className="flex">
          <div className="mr-1 flex w-6 flex-col justify-between py-[1px] text-[9px] text-muted" style={{ height: 7 * CELL + 6 * GAP }}>
            <span>Sun</span>
            <span>Wed</span>
            <span>Sat</span>
          </div>
          <div className="inline-flex" style={{ gap: GAP }}>
            {weeks.map((w, ci) => (
              <div key={ci} className="flex flex-col" style={{ gap: GAP }}>
                {w.map((k) => {
                  const d = byDate[k];
                  const out = k < from || k > to;
                  return (
                    <motion.button
                      key={k}
                      initial={{ opacity: 0, scale: 0.4 }}
                      animate={{ opacity: out ? 0.15 : 1, scale: 1 }}
                      transition={{ delay: Math.min(ci * 0.012, 0.6), duration: 0.25 }}
                      whileHover={{ scale: 1.45, zIndex: 2 }}
                      whileTap={{ scale: 0.9 }}
                      disabled={out}
                      onClick={() => nav(`/logs/${k}`)}
                      title={`${fmtKey(k, 'EEE d MMM yyyy')} — ${d?.logged ? `${d.pct}% (${d.done}/${d.total})` : 'not logged'}`}
                      aria-label={`${fmtKey(k, 'd MMMM')}: ${d?.logged ? `${d.pct} percent` : 'not logged'}`}
                      className="relative rounded-[3px] outline-offset-1"
                      style={{ width: CELL, height: CELL, background: heatColor(d?.pct, d?.logged), boxShadow: k === todayKey() ? '0 0 0 1.5px var(--c-text)' : undefined }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      <HeatLegend />
    </div>
  );
});
