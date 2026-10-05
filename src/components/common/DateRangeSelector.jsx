import { AnimatePresence, motion } from 'framer-motion';
import { RANGES } from '../../utils/ranges';
import { Segmented } from './ui';
import { todayKey } from '../../utils/date';

/**
 * Range picker: 3D 7D 10D 1M 3M 6M 1Y ALL CUSTOM.
 * value = { range, from, to } ; onChange(next)
 */
export default function DateRangeSelector({ value, onChange, options, layoutId = 'range' }) {
  const opts = options ? RANGES.filter((r) => options.includes(r.id)) : RANGES;
  return (
    <div className="w-full sm:w-auto">
      <Segmented size="sm" layoutId={layoutId} options={opts.map((r) => r.id)} value={value.range} onChange={(range) => onChange({ ...value, range })} />
      <AnimatePresence>
        {value.range === 'CUSTOM' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-2 grid grid-cols-2 gap-2">
              <label className="text-xs text-muted">
                From
                <input type="date" max={value.to || todayKey()} className="field mt-1 py-2" value={value.from || ''} onChange={(e) => onChange({ ...value, from: e.target.value })} />
              </label>
              <label className="text-xs text-muted">
                To
                <input type="date" max={todayKey()} className="field mt-1 py-2" value={value.to || ''} onChange={(e) => onChange({ ...value, to: e.target.value })} />
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
