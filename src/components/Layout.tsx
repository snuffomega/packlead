import { Compass, Plus, Trophy, User, Users } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSession } from '../lib/session';
import { Avatar } from './Avatar';
import { JoinModal } from './JoinModal';

const NAV = [
  { to: '/', label: 'Rankings', Icon: Trophy, end: true },
  { to: '/explore', label: 'Explore', Icon: Compass },
  { to: '/rip', label: 'Rip', Icon: Plus, center: true },
  { to: '/friends', label: 'Friends', Icon: Users },
  { to: '/profile', label: 'Profile', Icon: User },
];

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="PackLead home">
      <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-ink-600 bg-ink-850 transition group-hover:border-brand-400/60">
        <span className="absolute h-5 w-3.5 -rotate-12 rounded-[3px] border-2 border-brand-400 shadow-[0_0_12px_rgba(20,224,194,0.6)]" />
        <span className="absolute bottom-1.5 h-0.5 w-4 rounded bg-gold-400" />
      </span>
      <span className="leading-none">
        <span className="font-display text-xl font-bold tracking-tight text-ink-50">
          Pack<span className="text-brand-400">Lead</span>
        </span>
        {!compact && <span className="mt-0.5 hidden text-[10px] font-semibold text-ink-400 lg:block">Open packs. lead to greatness.</span>}
      </span>
    </Link>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const { player, openJoin } = useSession();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      <header className="sticky top-0 z-40 border-b border-ink-800/80 bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {NAV.filter((n) => !n.center).map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-ink-800 text-ink-50' : 'text-ink-300 hover:text-ink-50'}`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/rip" className="btn-primary hidden md:inline-flex">
              <Plus size={17} strokeWidth={2.6} /> Log a Pack
            </Link>
            {player ? (
              <Link to="/profile" className="rounded-xl transition hover:opacity-80" aria-label="Your profile">
                <Avatar color={player.avatar_color} icon={player.avatar_icon} size="sm" />
              </Link>
            ) : (
              <button onClick={openJoin} className="btn-ghost px-3 py-2 text-xs">
                Join
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:pt-8">{children}</main>

      <footer className="mx-auto hidden max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-ink-800 px-4 py-8 text-xs text-ink-400 md:flex">
        <span>PackLead is a concept prototype. Card values and prices are demo estimates. Scores are provisional.</span>
        <Link to="/review" className="font-semibold text-ink-300 hover:text-ink-50">
          Moderator review (demo)
        </Link>
      </footer>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
        aria-label="Main"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-end px-2">
          {NAV.map((n) =>
            n.center ? (
              <NavLink key={n.to} to={n.to} className="flex flex-col items-center pb-2" aria-label="Log a pack">
                {({ isActive }) => (
                  <>
                    <span
                      className={`-mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-400 text-ink-950 shadow-[0_0_28px_-4px_rgba(20,224,194,0.8)] transition active:scale-95 ${
                        isActive ? 'ring-2 ring-ink-50 ring-offset-2 ring-offset-ink-950' : ''
                      }`}
                    >
                      <n.Icon size={26} strokeWidth={2.8} />
                    </span>
                    <span className="mt-1 text-[10px] font-bold text-brand-300">+ Rip</span>
                  </>
                )}
              </NavLink>
            ) : (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition ${isActive ? 'text-ink-50' : 'text-ink-400'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <n.Icon size={21} strokeWidth={isActive ? 2.6 : 2} className={isActive ? 'text-brand-300' : ''} />
                    {n.label}
                  </>
                )}
              </NavLink>
            ),
          )}
        </div>
      </nav>

      <JoinModal />
    </div>
  );
}
