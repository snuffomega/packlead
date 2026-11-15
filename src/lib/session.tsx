import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchMyPlayer } from './api';
import { supabase } from './supabase';
import type { Player } from './types';

const HIDE_DEMO_KEY = 'packlead.hideDemo';

interface SessionValue {
  user: User | null;
  player: Player | null;
  loading: boolean;
  setPlayer: (p: Player | null) => void;
  signOut: () => Promise<void>;
  recovering: boolean;
  clearRecovering: () => void;
  hideDemo: boolean;
  setHideDemo: (v: boolean) => void;
  joinOpen: boolean;
  openJoin: () => void;
  closeJoin: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovering, setRecovering] = useState(false);
  const [hideDemo, setHideDemoState] = useState(() => localStorage.getItem(HIDE_DEMO_KEY) === '1');
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    localStorage.removeItem('packlead.player');
    let active = true;

    const load = async (u: User | null) => {
      if (!active) return;
      setUser(u);
      if (!u) {
        setPlayer(null);
        setLoading(false);
        return;
      }
      try {
        const p = await fetchMyPlayer();
        if (active) setPlayer(p);
      } catch {
        if (active) setPlayer(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        (async () => {
          await load(session?.user ?? null);
        })();
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setPlayer(null);
    setUser(null);
  }, []);

  const setHideDemo = useCallback((v: boolean) => {
    localStorage.setItem(HIDE_DEMO_KEY, v ? '1' : '0');
    setHideDemoState(v);
  }, []);

  const value = useMemo(
    () => ({
      user,
      player,
      loading,
      setPlayer,
      signOut,
      recovering,
      clearRecovering: () => setRecovering(false),
      hideDemo,
      setHideDemo,
      joinOpen,
      openJoin: () => setJoinOpen(true),
      closeJoin: () => setJoinOpen(false),
    }),
    [user, player, loading, signOut, recovering, hideDemo, setHideDemo, joinOpen],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

const RECENT_KEY = 'packlead.recentProducts';

export function getRecentProducts(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 4) : [];
  } catch {
    return [];
  }
}

export function rememberProduct(id: string) {
  const next = [id, ...getRecentProducts().filter((x) => x !== id)].slice(0, 4);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}
