import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks';
import { Button } from '../components/common/ui';
import { friendlyError } from '../utils/errors';
import { isFirebaseConfigured } from '../config/firebase';

const FLOATERS = ['💧', '🥗', '🏃', '⚖️', '🔥', '😴', '🚶', '💪'];

export default function Login() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Enter your username and password.');
      setShake((s) => s + 1);
      return;
    }
    setBusy(true);
    try {
      await signIn(username, password);
    } catch (err) {
      setError(friendlyError(err));
      setShake((s) => s + 1);
      setBusy(false);
    }
  };

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div className="aurora" aria-hidden />
      {FLOATERS.map((f, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute select-none text-3xl opacity-40 sm:text-4xl"
          style={{ left: `${8 + ((i * 12) % 84)}%`, top: `${10 + ((i * 29) % 78)}%` }}
          animate={{ y: [0, -18, 0], rotate: [0, i % 2 ? 10 : -10, 0] }}
          transition={{ repeat: Infinity, duration: 4 + (i % 3), delay: i * 0.3, ease: 'easeInOut' }}
        >
          {f}
        </motion.span>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <motion.img
            src="favicon.svg"
            alt=""
            className="mx-auto h-20 w-20 rounded-3xl shadow-[0_16px_48px_-10px_var(--c-primary)]"
            initial={{ rotate: -20, scale: 0.5 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
          />
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">
            Your <span className="text-gradient">weight journey</span>
          </h1>
          <p className="mt-2 text-sm text-muted">Track it. Feel it. Own it.</p>
        </div>

        <motion.form key={shake} animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}} transition={{ duration: 0.4 }} onSubmit={submit} className="glass space-y-3 rounded-[28px] p-5 shadow-2xl">
          <label className="relative block">
            <span className="sr-only">Username</span>
            <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="field !pl-10" placeholder="Username" autoComplete="username" autoCapitalize="none" value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label className="relative block">
            <span className="sr-only">Password</span>
            <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input className="field !px-10" type={show ? 'text' : 'password'} placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted">
              {show ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </label>
          {error && (
            <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </motion.p>
          )}
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Log in <ArrowRight size={18} />
          </Button>
        </motion.form>
        {!isFirebaseConfigured && <p className="mt-4 text-center text-xs text-muted">Local demo mode · data stays on this device</p>}
      </motion.div>
    </div>
  );
}
