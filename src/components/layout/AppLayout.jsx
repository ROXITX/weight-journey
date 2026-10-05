import { Suspense, useEffect, useState } from 'react';
import { NavLink, useLocation, useOutlet, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutGrid, LogOut, Flame } from 'lucide-react';
import { NAV, BOTTOM_NAV } from './nav';
import QuickActions from './QuickActions';
import Celebration from './Celebration';
import AchievementWatcher from './AchievementWatcher';
import FriendSync from './FriendSync';
import Modal from '../common/Modal';
import { PageSkeleton, cx } from '../common/ui';
import { useAuth } from '../../hooks';
import { useData } from '../../context/DataContext';
import { isFirebaseConfigured } from '../../config/firebase';

function Sidebar() {
  const { signOut } = useAuth();
  const { profile, streaks, today } = useData();
  return (
    <aside className="glass fixed inset-y-3 left-3 z-30 hidden w-64 flex-col rounded-[28px] p-4 lg:flex">
      <Link to="/dashboard" className="mb-6 flex items-center gap-3 px-2 pt-1">
        <img src="favicon.svg" alt="" className="h-10 w-10 rounded-xl shadow-[0_8px_20px_-6px_var(--c-primary)]" />
        <div>
          <div className="font-display text-lg font-bold leading-tight">Weight Journey</div>
          <div className="text-xs text-muted">Hi, {profile.name || 'friend'} 👋</div>
        </div>
      </Link>
      <nav className="no-scrollbar -mx-1 flex-1 space-y-0.5 overflow-y-auto px-1" aria-label="Main">
        {NAV.map(({ to, label, icon: Icon, color }) => (
          <NavLink key={to} to={to} className="relative block">
            {({ isActive }) => (
              <span className={cx('relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors', isActive ? 'text-ink' : 'text-muted hover:text-ink')}>
                {isActive && (
                  <motion.span layoutId="side-active" className="absolute inset-0 rounded-2xl bg-card-2" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                )}
                <Icon size={19} className="relative" style={{ color: isActive ? color : undefined }} />
                <span className="relative">{label}</span>
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-3 rounded-2xl bg-card-2 p-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>Today</span>
          <span className="flex items-center gap-1 font-semibold text-orange">
            <Flame size={14} /> {streaks.overall.current}d
          </span>
        </div>
        <div className="mt-1 font-display text-2xl font-bold">{today?.pct ?? 0}%</div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
          <motion.div className="h-full rounded-full bg-[linear-gradient(90deg,var(--c-primary),var(--c-secondary))]" animate={{ width: `${today?.pct ?? 0}%` }} />
        </div>
      </div>
      <button onClick={signOut} className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted hover:bg-card-2 hover:text-danger">
        <LogOut size={17} /> Log out
      </button>
    </aside>
  );
}

function BottomNav() {
  return (
    <nav aria-label="Main" className="glass fixed inset-x-3 bottom-3 z-40 rounded-[26px] pb-safe shadow-2xl lg:hidden">
      <ul className="flex items-stretch justify-around px-1 py-1.5">
        {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink to={to} className="block">
              {({ isActive }) => (
                <motion.span whileTap={{ scale: 0.88 }} className={cx('relative flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[10px] font-semibold', isActive ? 'text-primary' : 'text-muted')}>
                  {isActive && <motion.span layoutId="bottom-active" className="absolute inset-x-2 inset-y-0 rounded-2xl bg-primary/12" transition={{ type: 'spring', stiffness: 500, damping: 34 }} />}
                  <motion.span animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.12 : 1 }} className="relative">
                    <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
                  </motion.span>
                  <span className="relative">{label}</span>
                </motion.span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function MobileTopBar({ onMenu }) {
  const { streaks } = useData();
  return (
    <div className="sticky top-0 z-30 -mx-4 mb-2 flex items-center justify-between px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-xl lg:hidden" style={{ background: 'color-mix(in srgb, var(--c-bg) 75%, transparent)' }}>
      <Link to="/dashboard" className="flex items-center gap-2">
        <img src="favicon.svg" alt="" className="h-8 w-8 rounded-lg" />
        <span className="font-display font-bold">Journey</span>
      </Link>
      <div className="flex items-center gap-1">
        <span className="flex items-center gap-1 rounded-full bg-orange/12 px-2.5 py-1 text-xs font-bold text-orange">
          <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}>
            <Flame size={14} />
          </motion.span>
          {streaks.overall.current}
        </span>
        <button onClick={onMenu} aria-label="All pages" className="grid h-10 w-10 place-items-center rounded-xl text-muted hover:bg-card-2">
          <LayoutGrid size={21} />
        </button>
      </div>
    </div>
  );
}

export default function AppLayout({ loading }) {
  const loc = useLocation();
  const outlet = useOutlet();
  const [menu, setMenu] = useState(false);
  const { signOut } = useAuth();
  const section = loc.pathname.split('/')[1];

  // New page → start at the top (but keep position when opening /logs/:date over the list)
  useEffect(() => {
    if (!loc.hash) window.scrollTo({ top: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section]);

  return (
    <div className="relative min-h-dvh">
      <div className="aurora" aria-hidden />
      <Sidebar />
      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-32 lg:pb-10 lg:pl-[18.5rem] lg:pr-6 lg:pt-6">
        <MobileTopBar onMenu={() => setMenu(true)} />
        {!isFirebaseConfigured && (
          <div className="mb-3 rounded-2xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            Local demo mode — data is saved only in this browser. Configure Firebase to sync across devices (see FIREBASE_SETUP.md).
          </div>
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={loc.pathname.split('/')[1]}
            initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={<PageSkeleton />}>{loading ? <PageSkeleton /> : outlet}</Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
      <BottomNav />
      <QuickActions />
      <AchievementWatcher />
      <FriendSync />
      <Celebration />

      <Modal open={menu} onClose={() => setMenu(false)} title="All pages">
        <div className="grid grid-cols-3 gap-2">
          {NAV.map(({ to, label, icon: Icon, color }, i) => (
            <motion.div key={to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.025 }}>
              <Link to={to} onClick={() => setMenu(false)} className="flex flex-col items-center gap-2 rounded-2xl bg-card-2 py-4 text-xs font-semibold active:scale-95">
                <span className="grid h-10 w-10 place-items-center rounded-xl" style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
                  <Icon size={20} />
                </span>
                {label}
              </Link>
            </motion.div>
          ))}
        </div>
        <button onClick={signOut} className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-danger/10 py-3 text-sm font-semibold text-danger">
          <LogOut size={17} /> Log out
        </button>
      </Modal>
    </div>
  );
}
