import { KeyRound, LogOut } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { createPlayer } from '../lib/api';
import { useSession } from '../lib/session';
import { supabase } from '../lib/supabase';
import type { AvatarColor, AvatarIcon } from '../lib/types';
import { AVATAR_COLORS, AVATAR_ICONS, Avatar } from './Avatar';
import { Modal } from './Modal';
import { Skeleton } from './States';

export function JoinModal() {
  const { joinOpen, closeJoin, player } = useSession();
  useEffect(() => {
    if (player && joinOpen) closeJoin();
  }, [player, joinOpen, closeJoin]);
  return (
    <Modal open={joinOpen} onClose={closeJoin} title="Claim your spot">
      <AccountGate />
    </Modal>
  );
}

export function AccountGate() {
  const { user, player, loading } = useSession();
  if (loading)
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-11" />
        <Skeleton className="h-11" />
        <Skeleton className="h-12" />
      </div>
    );
  if (!user) return <AuthForm />;
  if (!player) return <ProfileForm />;
  return null;
}

function Notice({ tone, children }: { tone: 'error' | 'info'; children: string }) {
  const cls = tone === 'error' ? 'border-coral-500/40 bg-coral-500/10 text-coral-200' : 'border-brand-400/40 bg-brand-400/10 text-brand-100';
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${cls}`}>
      {children}
    </p>
  );
}

type Mode = 'signup' | 'signin' | 'reset';

function authMessage(message: string, mode: Mode): string {
  if (/weak|pwned|known/i.test(message)) return 'That password appears in known data leaks. Choose a different, less common password.';
  if (/already registered|already exists/i.test(message)) return 'An account with this email already exists. Sign in instead.';
  if (/invalid login|invalid credentials/i.test(message)) return 'Email or password is incorrect.';
  if (/rate|too many/i.test(message)) return 'Too many attempts. Wait a minute and try again.';
  return mode === 'signup' ? 'Could not create your account. Please try again.' : 'Could not sign you in. Please try again.';
}

function AuthForm() {
  const [mode, setMode] = useState<Mode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setInfo(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const addr = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) return setError('Enter a valid email address.');
    if (mode !== 'reset' && password.length < 8) return setError('Passwords must be at least 8 characters.');
    if (!navigator.onLine) return setError('You are offline. Reconnect and try again.');
    setBusy(true);
    try {
      if (mode === 'reset') {
        const { error: err } = await supabase.auth.resetPasswordForEmail(addr, { redirectTo: `${window.location.origin}/profile` });
        if (err) throw err;
        setInfo('If an account exists for that email, a reset link is on its way. Open it on any device to choose a new password.');
      } else if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email: addr, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email: addr, password });
        if (err) throw err;
      }
    } catch (err) {
      setError(authMessage((err as Error).message ?? '', mode));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {mode !== 'reset' ? (
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-ink-700 bg-ink-850 p-1" role="tablist">
          {(['signup', 'signin'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`min-h-[44px] rounded-lg text-sm font-semibold transition ${mode === m ? 'bg-ink-700 text-ink-50' : 'text-ink-300 hover:text-ink-50'}`}
            >
              {m === 'signup' ? 'New player' : 'I have an account'}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 text-sm text-ink-200">
          <KeyRound size={16} className="text-brand-300" /> Reset your password
        </div>
      )}
      <p className="text-sm text-ink-300">
        {mode === 'signup'
          ? 'Create an account so your openings and rankings follow you to any device.'
          : mode === 'signin'
            ? 'Welcome back. Sign in to pick up where you left off.'
            : 'Enter your account email and we will send you a link to set a new password.'}
      </p>
      <div>
        <label className="label" htmlFor="auth-email">
          Email
        </label>
        <input
          id="auth-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className="input mt-1.5 min-h-[48px]"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {mode !== 'reset' && (
        <div>
          <label className="label" htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            className="input mt-1.5 min-h-[48px]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {mode === 'signup' && <p className="mt-1.5 text-xs text-ink-400">At least 8 characters. Avoid common passwords.</p>}
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      {info && <Notice tone="info">{info}</Notice>}
      <button type="submit" className="btn-primary min-h-[52px] w-full" disabled={busy}>
        {busy ? 'Please wait...' : mode === 'signup' ? 'Create account' : mode === 'signin' ? 'Sign in' : 'Send reset link'}
      </button>
      <div className="text-center">
        {mode === 'reset' ? (
          <button type="button" className="min-h-[44px] px-2 text-sm font-semibold text-brand-300 hover:text-brand-200" onClick={() => switchMode('signin')}>
            Back to sign in
          </button>
        ) : (
          mode === 'signin' && (
            <button type="button" className="min-h-[44px] px-2 text-sm font-semibold text-brand-300 hover:text-brand-200" onClick={() => switchMode('reset')}>
              Forgot your password?
            </button>
          )
        )}
      </div>
    </form>
  );
}

function ProfileForm() {
  const { setPlayer, signOut, user } = useSession();
  const [username, setUsername] = useState('');
  const [color, setColor] = useState<AvatarColor>('teal');
  const [icon, setIcon] = useState<AvatarIcon>('flame');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const valid = /^[A-Za-z0-9_]{3,20}$/.test(username);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return setError('Use 3-20 letters, numbers or underscores.');
    if (!navigator.onLine) return setError('You are offline. Reconnect and try again.');
    setSaving(true);
    setError(null);
    try {
      setPlayer(await createPlayer(username, color, icon));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm text-ink-300">Last step: pick the name and avatar other players will see on the leaderboard.</p>
      <div className="flex items-center gap-4">
        <Avatar color={color} icon={icon} size="lg" />
        <div className="flex-1">
          <label className="label" htmlFor="username">
            Username
          </label>
          <input
            id="username"
            className="input mt-1.5 min-h-[48px]"
            placeholder="e.g. HoloHunter"
            value={username}
            maxLength={20}
            autoComplete="nickname"
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
          />
        </div>
      </div>
      <div>
        <p className="label mb-2">Color</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(AVATAR_COLORS) as AvatarColor[]).map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className={`h-11 w-11 rounded-xl bg-gradient-to-br transition ${AVATAR_COLORS[c]} ${color === c ? 'ring-2 ring-ink-50 ring-offset-2 ring-offset-ink-900' : 'opacity-70 hover:opacity-100'}`}
            />
          ))}
        </div>
      </div>
      <div>
        <p className="label mb-2">Emblem</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(AVATAR_ICONS) as AvatarIcon[]).map((i) => {
            const Icon = AVATAR_ICONS[i];
            return (
              <button
                type="button"
                key={i}
                onClick={() => setIcon(i)}
                aria-label={`Emblem ${i}`}
                aria-pressed={icon === i}
                className={`flex h-11 w-11 items-center justify-center rounded-xl border transition ${
                  icon === i ? 'border-brand-400 bg-brand-400/15 text-brand-200' : 'border-ink-600 bg-ink-800 text-ink-300 hover:text-ink-50'
                }`}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      <button type="submit" className="btn-primary min-h-[52px] w-full" disabled={saving}>
        {saving ? 'Creating...' : 'Start ripping'}
      </button>
      <p className="text-center text-xs text-ink-400">
        Signed in as {user?.email}.{' '}
        <button type="button" onClick={() => signOut()} className="inline-flex min-h-[44px] items-center gap-1 font-semibold text-ink-200 hover:text-ink-50">
          <LogOut size={13} /> Use a different account
        </button>
      </p>
    </form>
  );
}

export function PasswordRecoveryModal() {
  const { recovering, clearRecovering } = useSession();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setError('Passwords must be at least 8 characters.');
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (err) return setError(authMessage(err.message, 'signin'));
    setDone(true);
  };

  const close = () => {
    clearRecovering();
    setDone(false);
    setPassword('');
  };

  return (
    <Modal open={recovering} onClose={close} title="Choose a new password">
      {done ? (
        <div className="space-y-4">
          <Notice tone="info">Your password has been updated. You are signed in.</Notice>
          <button className="btn-primary min-h-[52px] w-full" onClick={close}>
            Continue
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <label className="label" htmlFor="new-password">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            className="input min-h-[48px]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <Notice tone="error">{error}</Notice>}
          <button type="submit" className="btn-primary min-h-[52px] w-full" disabled={busy}>
            {busy ? 'Saving...' : 'Save password'}
          </button>
        </form>
      )}
    </Modal>
  );
}
