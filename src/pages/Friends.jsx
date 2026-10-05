import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Share2, RefreshCw, UserPlus, UserMinus, Crown, Flame, Lock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { friendsApi } from '../services/friendsService';
import { buildPublicStats, METRICS } from '../utils/friends';
import { friendlyError } from '../utils/errors';
import { fmtKey } from '../utils/date';
import { fmtInt } from '../utils/format';
import { Card, PageHeader, SectionTitle, Button, Segmented, Toggle, EmptyState, Pill, stagger, cx } from '../components/common/ui';
import { ProgressBar } from '../components/common/ProgressRing';
import Modal from '../components/common/Modal';
import { heatColor, TooltipBox } from '../components/charts/Charts';

const PALETTE = ['var(--c-primary)', 'var(--c-secondary)', 'var(--c-accent)', 'var(--c-orange)', 'var(--c-pink)', 'var(--c-water)', 'var(--c-warning)'];
const MEDALS = ['🥇', '🥈', '🥉'];

const ago = (t) => {
  if (!t) return 'not synced yet';
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

function Avatar({ name, color, size = 44 }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-2xl font-display font-bold text-white shadow-md" style={{ width: size, height: size, background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 55%, #000))`, fontSize: size * 0.42 }}>
      {(name || '?').charAt(0).toUpperCase()}
    </span>
  );
}

/** 30 small squares = last 30 days, coloured like the heatmap. */
function MiniStrip({ days = [] }) {
  return (
    <div className="flex gap-[3px]">
      {days.map((x) => (
        <span key={x.d} title={`${fmtKey(x.d, 'd MMM')}: ${x.l ? `${x.p}%` : 'not logged'}`} className="h-3 flex-1 rounded-[3px]" style={{ background: heatColor(x.p, x.l) }} />
      ))}
    </div>
  );
}

function MyCode({ code, onRegenerate }) {
  const { toast } = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast('Code copied!');
    } catch {
      toast(code, 'info');
    }
  };
  const share = async () => {
    const text = `Join my weight-loss challenge on Weight Journey! My friend code: ${code}`;
    if (navigator.share) navigator.share({ title: 'Weight Journey', text }).catch(() => {});
    else copy();
  };
  return (
    <Card className="!p-0">
      <div className="absolute inset-0 bg-[radial-gradient(90%_100%_at_0%_0%,color-mix(in_srgb,var(--c-accent)_25%,transparent),transparent_60%),radial-gradient(90%_100%_at_100%_100%,color-mix(in_srgb,var(--c-pink)_20%,transparent),transparent_60%)]" />
      <div className="relative p-5">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Your friend code</div>
        <div className="mt-2 flex items-center gap-1.5">
          {(code || '······').split('').map((ch, i) => (
            <motion.span
              key={`${code}-${i}`}
              initial={{ rotateX: 90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
              className="grid h-12 w-10 place-items-center rounded-xl bg-card font-display text-2xl font-bold shadow-sm sm:h-14 sm:w-12"
            >
              {ch}
            </motion.span>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">Share it with friends. When they enter it, you'll <b>both</b> see each other's progress.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" icon={Share2} onClick={share} disabled={!code}>Share</Button>
          <Button size="sm" variant="soft" icon={Copy} onClick={copy} disabled={!code}>Copy</Button>
          <Button size="sm" variant="ghost" icon={RefreshCw} onClick={onRegenerate} disabled={!code}>New code</Button>
        </div>
      </div>
    </Card>
  );
}

function AddFriend({ onAdd }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (code.trim().length < 6) return;
    setBusy(true);
    const ok = await onAdd(code);
    setBusy(false);
    if (ok) setCode('');
  };
  return (
    <Card>
      <SectionTitle>➕ Add a friend</SectionTitle>
      <form onSubmit={submit} className="flex gap-2">
        <input
          className="field text-center font-display text-xl font-bold uppercase tracking-[0.3em]"
          maxLength={6}
          placeholder="CODE"
          autoCapitalize="characters"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          aria-label="Friend code"
        />
        <Button type="submit" icon={UserPlus} loading={busy} disabled={code.length < 6}>Add</Button>
      </form>
      <p className="mt-2 text-xs text-muted">Only a summary is shared: consistency, streaks, steps, water, workouts and kg lost. Your journal, food and private logs are never shared.</p>
    </Card>
  );
}

function Leaderboard({ people }) {
  const [metric, setMetric] = useState('avg7');
  const m = METRICS.find((x) => x.id === metric);
  const ranked = people
    .filter((p) => p.summary)
    .map((p) => ({ ...p, v: m.get(p.summary) ?? 0 }))
    .sort((a, b) => b.v - a.v);
  const max = Math.max(1, ...ranked.map((p) => p.v));
  return (
    <Card>
      <SectionTitle>🏆 Leaderboard</SectionTitle>
      <Segmented size="sm" layoutId="lb-metric" className="mb-4" options={METRICS.map((x) => ({ id: x.id, label: `${x.icon} ${x.label}` }))} value={metric} onChange={setMetric} />
      <motion.ul layout className="space-y-2">
        <AnimatePresence initial={false}>
          {ranked.map((p, i) => (
            <motion.li
              key={p.uid}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className={cx('flex items-center gap-3 rounded-2xl px-3 py-2.5', p.me ? 'bg-primary/10 ring-1 ring-primary/30' : 'bg-card-2/60')}
            >
              <span className="w-7 text-center font-display text-lg font-bold">{MEDALS[i] || i + 1}</span>
              <Avatar name={p.name} color={p.color} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
                  {p.name}
                  {p.me && <Pill tone="good">You</Pill>}
                  {i === 0 && ranked.length > 1 && <Crown size={14} className="text-warning" />}
                </div>
                <ProgressBar value={(p.v / max) * 100} className="mt-1 h-1.5" color={p.color} delay={i * 0.05} />
              </div>
              <span className="w-20 text-right font-display text-lg font-bold">
                {m.id === 'water7' ? p.v.toFixed(1) : fmtInt(p.v)}
                <span className="text-xs text-muted">{m.unit}</span>
              </span>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {ranked.length < 2 && <p className="mt-3 text-center text-sm text-muted">Add a friend to start a healthy competition 💪</p>}
    </Card>
  );
}

function FriendCard({ f, onOpen }) {
  const s = f.summary;
  return (
    <motion.button variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }} onClick={onOpen} className="card w-full p-4 text-left">
      <div className="flex items-center gap-3">
        <Avatar name={f.name} color={f.color} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-bold">{f.name}</div>
          <div className="text-xs text-muted">Updated {ago(f.updatedAt)}</div>
        </div>
        {s && (
          <span className="flex items-center gap-1 rounded-full bg-orange/12 px-2.5 py-1 text-sm font-bold text-orange">
            <Flame size={14} /> {s.streak}
          </span>
        )}
      </div>
      {f.blocked || !f.sharing ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted"><Lock size={14} /> {f.blocked ? 'No longer sharing with you' : 'Has paused sharing'}</p>
      ) : !s ? (
        <p className="mt-3 text-sm text-muted">Waiting for {f.name} to sync…</p>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center">
            {[
              ['Today', `${s.todayPct}%`],
              ['7D', `${s.avg7}%`],
              ['Lost', `${s.lost ?? 0}kg`],
              ['Journey', `${Math.round(s.progress || 0)}%`],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-card-2/70 py-1.5">
                <div className="text-[10px] font-semibold uppercase text-muted">{l}</div>
                <div className="font-display text-sm font-bold">{v}</div>
              </div>
            ))}
          </div>
          <div className="mt-3"><MiniStrip days={f.days} /></div>
        </>
      )}
    </motion.button>
  );
}

function Compare({ me, f }) {
  const data = (me.days || []).map((x) => {
    const o = (f.days || []).find((y) => y.d === x.d);
    return { d: x.d, me: x.l ? x.p : null, them: o?.l ? o.p : null };
  });
  const rows = [
    ['📊 Consistency 7D', `${me.summary.avg7}%`, `${f.summary.avg7}%`, me.summary.avg7 - f.summary.avg7],
    ['📅 Consistency 30D', `${me.summary.avg30}%`, `${f.summary.avg30}%`, me.summary.avg30 - f.summary.avg30],
    ['🔥 Streak', `${me.summary.streak}d`, `${f.summary.streak}d`, me.summary.streak - f.summary.streak],
    ['🏅 Best streak', `${me.summary.bestStreak}d`, `${f.summary.bestStreak}d`, me.summary.bestStreak - f.summary.bestStreak],
    ['🗺️ Journey', `${Math.round(me.summary.progress)}%`, `${Math.round(f.summary.progress)}%`, me.summary.progress - f.summary.progress],
    ['📉 Kg lost', me.summary.lost, f.summary.lost, me.summary.lost - f.summary.lost],
    ['🚶 Steps / day (7D)', fmtInt(me.summary.steps7), fmtInt(f.summary.steps7), me.summary.steps7 - f.summary.steps7],
    ['💧 Water / day (7D)', `${(me.summary.water7 / 1000).toFixed(1)}L`, `${(f.summary.water7 / 1000).toFixed(1)}L`, me.summary.water7 - f.summary.water7],
    ['🏋️ Workouts (7D)', me.summary.workouts7, f.summary.workouts7, me.summary.workouts7 - f.summary.workouts7],
    ['🏆 Achievements', me.summary.achievements, f.summary.achievements, me.summary.achievements - f.summary.achievements],
  ];
  const wins = rows.filter((r) => r[3] > 0).length;
  const losses = rows.filter((r) => r[3] < 0).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-around rounded-2xl bg-card-2/60 p-3 text-center">
        <div><Avatar name={me.name} color={me.color} /><div className="mt-1 text-xs font-semibold">You</div></div>
        <div className="font-display text-3xl font-bold"><span className="text-primary">{wins}</span> <span className="text-muted">:</span> <span className="text-danger">{losses}</span></div>
        <div><Avatar name={f.name} color={f.color} /><div className="mt-1 text-xs font-semibold">{f.name}</div></div>
      </div>
      <div className="divide-y divide-line rounded-2xl border border-line">
        {rows.map(([l, a, b, diff]) => (
          <div key={l} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3 py-2 text-sm">
            <span className="text-muted">{l}</span>
            <span className={cx('w-16 text-right font-bold', diff > 0 && 'text-primary')}>{a ?? '—'}</span>
            <span className={cx('w-16 text-right font-bold', diff < 0 && 'text-primary')}>{b ?? '—'}</span>
          </div>
        ))}
      </div>
      <div>
        <div className="mb-1 text-xs font-bold uppercase tracking-wider text-muted">Consistency · last 30 days</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 6, left: -6, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 6" />
              <XAxis dataKey="d" tickFormatter={(k) => fmtKey(k, 'd MMM')} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={24} />
              <YAxis domain={[0, 100]} unit="%" width={48} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload }) => (active && payload?.length ? <TooltipBox title={fmtKey(payload[0].payload.d, 'EEE d MMM')} rows={[['You', payload[0].payload.me == null ? '—' : `${payload[0].payload.me}%`, me.color], [f.name, payload[0].payload.them == null ? '—' : `${payload[0].payload.them}%`, f.color]]} /> : null)} />
              <Legend formatter={(v) => (v === 'me' ? 'You' : f.name)} wrapperStyle={{ fontSize: 12 }} />
              <Line dataKey="me" stroke={me.color} strokeWidth={3} dot={false} connectNulls type="monotone" />
              <Line dataKey="them" stroke={f.color} strokeWidth={3} dot={false} connectNulls type="monotone" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="text-xs font-bold uppercase tracking-wider text-muted">You</div>
        <MiniStrip days={me.days} />
        <div className="pt-1 text-xs font-bold uppercase tracking-wider text-muted">{f.name}</div>
        <MiniStrip days={f.days} />
      </div>
      {f.shareWeight && f.summary.current != null && (
        <p className="rounded-2xl bg-card-2/60 p-3 text-sm">⚖️ {f.name}: {f.summary.start} → <b>{f.summary.current} kg</b> (target {f.summary.target} kg)</p>
      )}
    </div>
  );
}

export default function Friends() {
  const d = useData();
  const { uid, profile, settings, saveUser } = d;
  const { toast, celebrate } = useToast();
  const [mine, setMine] = useState(null);
  const [list, setList] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => friendsApi.watchMine(uid, setMine), [uid]);
  useEffect(() => friendsApi.watchFriends(uid, setList), [uid]);
  useEffect(() => {
    friendsApi.ensureCode(uid, profile.name).catch((e) => toast(friendlyError(e, 'Could not create your friend code. Check your connection.'), 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid]);

  // My entry is computed live (not read back) so it's always current.
  const me = useMemo(() => ({ ...buildPublicStats(d), uid, me: true, name: profile.name || 'You', color: PALETTE[0] }), [d, uid, profile.name]);
  const friends = useMemo(() => (list || []).map((f, i) => ({ ...f, color: PALETTE[(i + 1) % PALETTE.length] })), [list]);
  const openFriend = friends.find((f) => f.uid === open);

  const add = async (code) => {
    try {
      const name = await friendsApi.addByCode(uid, profile.name || 'Friend', code);
      celebrate({ icon: '🤝', title: `You and ${name} are now friends!`, text: 'Let the healthy competition begin.' });
      return true;
    } catch (e) {
      toast(friendlyError(e, 'Could not add that friend. Check the code and try again.'), 'error');
      return false;
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
      <PageHeader emoji="🤝" title="Friends" subtitle="Healthy competition keeps you going." />

      <div className="grid gap-4 lg:grid-cols-2">
        <MyCode
          code={mine?.friendCode}
          onRegenerate={async () => {
            if (!confirm('Make a new code? The old one stops working (existing friends stay).')) return;
            try {
              await friendsApi.regenerate(uid, profile.name, mine?.friendCode);
              toast('New code ready');
            } catch (e) {
              toast(friendlyError(e), 'error');
            }
          }}
        />
        <AddFriend onAdd={add} />
      </div>

      <Leaderboard people={[me, ...friends.filter((f) => !f.blocked && f.sharing !== false)]} />

      <div>
        <SectionTitle>👥 Your friends {list ? `(${friends.length})` : ''}</SectionTitle>
        {list && !friends.length ? (
          <Card><EmptyState icon="🤝" title="No friends yet" text="Share your code or enter a friend's code above." /></Card>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {friends.map((f) => (
              <FriendCard key={f.uid} f={f} onOpen={() => setOpen(f.uid)} />
            ))}
          </motion.div>
        )}
      </div>

      <Card>
        <SectionTitle>🔒 What you share</SectionTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-card-2/60 p-3">
            <div>
              <div className="text-sm font-semibold">Share my progress with friends</div>
              <div className="text-xs text-muted">Consistency, streaks, steps, water, workouts, kg lost & journey %</div>
            </div>
            <Toggle checked={settings.shareWithFriends !== false} onChange={(v) => saveUser({ settings: { shareWithFriends: v } })} label="Share with friends" />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-card-2/60 p-3">
            <div>
              <div className="text-sm font-semibold">Share my exact weight</div>
              <div className="text-xs text-muted">Off = friends only see kg lost and %, not your body weight</div>
            </div>
            <Toggle checked={!!settings.shareWeight} onChange={(v) => saveUser({ settings: { shareWeight: v } })} label="Share exact weight" />
          </div>
        </div>
      </Card>

      <Modal open={!!openFriend} onClose={() => setOpen(null)} title={openFriend ? `You vs ${openFriend.name}` : ''} wide>
        {openFriend &&
          (openFriend.summary && me.summary ? (
            <Compare me={me} f={openFriend} />
          ) : (
            <EmptyState icon="🔒" title="Nothing to compare yet" text={`${openFriend.name} hasn't shared a summary.`} />
          ))}
        {openFriend && (
          <Button
            variant="danger"
            className="mt-4 w-full"
            icon={UserMinus}
            onClick={async () => {
              if (!confirm(`Remove ${openFriend.name}? You'll both stop seeing each other's progress.`)) return;
              await friendsApi.remove(uid, openFriend.uid).catch((e) => toast(friendlyError(e), 'error'));
              setOpen(null);
              toast('Friend removed');
            }}
          >
            Remove friend
          </Button>
        )}
      </Modal>
    </motion.div>
  );
}

