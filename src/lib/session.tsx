import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchPlayer } from './api';
import type { Player } from './types';

const PLAYER_KEY = 'packlead.player';
const HIDE_DEMO_KEY = 'packlead.hideDemo';

interface SessionValue {
  player: Player | null;
  loading: boolean;
  setPlayer: (p: Player | null) => void;
  hideDemo: boolean;
  setHideDemo: (v: boolean) => void;
  joinOpen: boolean;
  openJoin: () => void;
  closeJoin: () => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [player, setPlayerState] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [hideDemo, setHideDemoState] = useState(() => localStorage.getItem(HIDE_DEMO_KEY) === '1');
  const [joinOpen, setJoinOpen] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem(PLAYER_KEY);
    if (!id) {
      setLoading(false);
      return;
    }
    fetchPlayer(id)
      .then((p) => {
        if (p) setPlayerState(p);
        else localStorage.removeItem(PLAYER_KEY);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const setPlayer = useCallback((p: Player | null) => {
    if (p) localStorage.setItem(PLAYER_KEY, p.id);
    else localStorage.removeItem(PLAYER_KEY);
    setPlayerState(p);
  }, []);

  const setHideDemo = useCallback((v: boolean) => {
    localStorage.setItem(HIDE_DEMO_KEY, v ? '1' : '0');
    setHideDemoState(v);
  }, []);

  const value = useMemo(
    () => ({
      player,
      loading,
      setPlayer,
      hideDemo,
      setHideDemo,
      joinOpen,
      openJoin: () => setJoinOpen(true),
      closeJoin: () => setJoinOpen(false),
    }),
    [player, loading, setPlayer, hideDemo, setHideDemo, joinOpen],
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
