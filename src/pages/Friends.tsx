import { ArrowRight, Hash, Plus, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DemoTag } from '../components/Badges';
import { AccountGate } from '../components/JoinModal';
import { EmptyState, ErrorState, RowsSkeleton, Skeleton } from '../components/States';
import { createGroup, fetchPlayerGroups, joinGroup } from '../lib/api';
import { useSession } from '../lib/session';
import { useAsync } from '../lib/useAsync';

export default function Friends() {
  const { player, loading } = useSession();
  if (loading) return <Skeleton className="h-72" />;
  if (!player) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl font-bold text-ink-50">Friends</h1>
        <p className="mb-6 mt-1 text-sm text-ink-400">Sign in to start a private group or join one with an invite code. Groups are only visible to their members.</p>
        <div className="surface p-5">
          <AccountGate />
        </div>
      </div>
    );
  }
  return <FriendsView playerId={player.id} />;
}

function FriendsView({ playerId }: { playerId: string }) {
  const navigate = useNavigate();
  const groups = useAsync(() => fetchPlayerGroups(playerId), [playerId]);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<{ form: 'create' | 'join'; msg: string } | null>(null);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (n.length < 2 || n.length > 40) return setError({ form: 'create', msg: 'Group names are 2-40 characters.' });
    setBusy('create');
    setError(null);
    try {
      navigate(`/friends/${await createGroup(n)}`);
    } catch (err) {
      setError({ form: 'create', msg: (err as Error).message });
    } finally {
      setBusy(null);
    }
  };

  const join = async (e: FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (!c) return;
    setBusy('join');
    setError(null);
    try {
      navigate(`/friends/${await joinGroup(c)}`);
    } catch (err) {
      setError({ form: 'join', msg: (err as Error).message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink-50">Friends</h1>
        <p className="mt-1 text-sm text-ink-400">Private leaderboards for your crew. Only members can see a group, so share the code with people you trust.</p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-ink-50">Your groups</h2>
        {groups.error ? (
          <ErrorState message={groups.error} onRetry={groups.reload} />
        ) : !groups.data ? (
          <RowsSkeleton rows={2} />
        ) : groups.data.length === 0 ? (
          <EmptyState icon={<Users size={24} />} title="No groups yet" body="Create a group below or join one with an invite code." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {groups.data.map((g, i) => (
              <Link
                key={g.id}
                to={`/friends/${g.id}`}
                style={{ animationDelay: `${i * 40}ms` }}
                className="surface group flex animate-fade-up items-center gap-4 p-4 transition hover:border-brand-400/50"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-400/40 bg-brand-400/10 text-brand-300">
                  <Users size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate font-semibold text-ink-50">
                    {g.name} {g.is_demo && <DemoTag />}
                  </p>
                  <p className="text-xs text-ink-400">
                    {g.member_count} member{g.member_count === 1 ? '' : 's'} / Code {g.code}
                  </p>
                </div>
                <ArrowRight size={18} className="text-ink-400 transition group-hover:translate-x-1 group-hover:text-brand-300" />
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <form onSubmit={join} className="surface space-y-3 p-5">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink-50">
            <Hash size={18} className="text-brand-300" /> Join with a code
          </h3>
          <input
            className="input min-h-[48px] font-display uppercase tracking-[0.3em]"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8))}
            placeholder="CODE"
            aria-label="Invite code"
          />
          {error?.form === 'join' && <p role="alert" className="text-sm text-coral-300">{error.msg}</p>}
          <button className="btn-primary min-h-[48px] w-full" disabled={!code || busy === 'join'}>
            {busy === 'join' ? 'Joining...' : 'Join group'}
          </button>
          <p className="text-xs text-ink-400">
            Try the demo groups:{' '}
            {['FRIDAY', 'SHOP42'].map((c) => (
              <button key={c} type="button" onClick={() => setCode(c)} className="mr-1 min-h-[44px] px-1 font-semibold text-brand-300 hover:text-brand-200">
                {c}
              </button>
            ))}
          </p>
        </form>

        <form onSubmit={create} className="surface space-y-3 p-5">
          <h3 className="flex items-center gap-2 font-display text-lg font-bold text-ink-50">
            <Plus size={18} className="text-brand-300" /> Create a group
          </h3>
          <input className="input min-h-[48px]" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunday Break Club" maxLength={40} aria-label="Group name" />
          {error?.form === 'create' && <p role="alert" className="text-sm text-coral-300">{error.msg}</p>}
          <button className="btn-ghost min-h-[48px] w-full" disabled={!name.trim() || busy === 'create'}>
            {busy === 'create' ? 'Creating...' : 'Create group'}
          </button>
          <p className="text-xs text-ink-400">You will get an invite code and link to share.</p>
        </form>
      </section>
    </div>
  );
}
