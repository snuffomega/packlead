import { Gem, Layers, Plus, ShieldCheck, Trophy, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../components/Avatar';
import { DemoTag } from '../components/Badges';
import { CardArt } from '../components/CardArt';
import { JoinForm } from '../components/JoinModal';
import { LeaderRow } from '../components/LeaderRow';
import { EmptyState, ErrorState, RowsSkeleton, Skeleton } from '../components/States';
import { fetchPlayer, fetchPlayerGroups, fetchPlayerOpenings } from '../lib/api';
import { evidenceOf } from '../lib/catalog';
import { longDate, money } from '../lib/format';
import { useSession } from '../lib/session';
import { useAsync } from '../lib/useAsync';

export default function Profile() {
  const { id } = useParams();
  const { player, loading, setPlayer } = useSession();

  if (!id) {
    if (loading) return <Skeleton className="h-72" />;
    if (!player) {
      return (
        <div className="mx-auto max-w-md">
          <h1 className="font-display text-3xl font-bold text-ink-50">Your Profile</h1>
          <p className="mb-6 mt-1 text-sm text-ink-400">Create a player profile to track your packs.</p>
          <div className="surface p-5">
            <JoinForm onDone={setPlayer} />
          </div>
        </div>
      );
    }
  }
  return <ProfileView playerId={id ?? player!.id} isMe={!id || id === player?.id} />;
}

function ProfileView({ playerId, isMe }: { playerId: string; isMe: boolean }) {
  const data = useAsync(async () => {
    const [p, openings, groups] = await Promise.all([fetchPlayer(playerId), fetchPlayerOpenings(playerId), fetchPlayerGroups(playerId)]);
    return { p, openings, groups };
  }, [playerId]);

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (!data.data) return <ProfileSkeleton />;
  const { p, openings, groups } = data.data;
  if (!p) {
    return <EmptyState icon={<Users size={24} />} title="Player not found" body="This profile does not exist." action={<Link to="/" className="btn-primary">Back to rankings</Link>} />;
  }

  const bestScore = openings.reduce((m, o) => Math.max(m, o.score), 0);
  const bestPull = [...openings].sort((a, b) => b.best_value - a.best_value)[0];
  const verified = openings.filter((o) => evidenceOf(o) === 'verified').length;
  const byScore = [...openings].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 p-6">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar color={p.avatar_color} icon={p.avatar_icon} size="xl" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate font-display text-3xl font-bold text-ink-50">{p.username}</h1>
                {p.is_demo && <DemoTag />}
              </div>
              <p className="text-sm text-ink-400">Ripping since {longDate(p.created_at)}</p>
              {isMe && <p className="mt-1 text-xs font-semibold text-brand-300">This is you on this device</p>}
            </div>
          </div>
          {bestPull && (
            <Link to={`/pack/${bestPull.id}`} className="group ml-auto hidden items-center gap-3 sm:flex">
              <div className="text-right">
                <p className="label">Best pull</p>
                <p className="font-semibold text-ink-50 group-hover:text-brand-300">{bestPull.best_card_name}</p>
                <p className="text-sm font-semibold text-gold-300">{money(bestPull.best_value)}</p>
              </div>
              <div className="w-20 transition group-hover:-rotate-3 group-hover:scale-105">
                <CardArt name={bestPull.best_card_name} rarity={bestPull.best_card_rarity} tier={bestPull.best_card_tier} image={bestPull.best_card_image} game={bestPull.game} />
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<Trophy size={15} />} label="Highest score" value={String(bestScore)} gold />
        <Stat icon={<Layers size={15} />} label="Packs logged" value={String(openings.length)} />
        <Stat icon={<Gem size={15} />} label="Best pull" value={bestPull ? money(bestPull.best_value) : '-'} />
        <Stat icon={<ShieldCheck size={15} />} label="Verified rips" value={String(verified)} />
      </section>

      {groups.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold text-ink-50">Groups</h2>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {groups.map((g) => (
              <Link key={g.id} to={`/friends/${g.id}`} className="chip-off py-2">
                <Users size={13} /> {g.name}
                <span className="opacity-60">{g.member_count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-ink-50">Openings</h2>
        {byScore.length === 0 ? (
          <EmptyState
            icon={<Layers size={24} />}
            title="No packs yet"
            body={isMe ? 'Log your first pack to get on the board.' : 'This player has not logged any packs yet.'}
            action={
              isMe ? (
                <Link to="/rip" className="btn-primary">
                  <Plus size={16} /> Log a Pack
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-2">
            {byScore.map((o, i) => (
              <LeaderRow key={o.id} opening={o} delay={Math.min(i, 12) * 30} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, label, value, gold = false }: { icon: ReactNode; label: string; value: string; gold?: boolean }) {
  return (
    <div className="surface animate-fade-up p-4">
      <p className="label flex items-center gap-1.5">
        <span className={gold ? 'text-gold-300' : 'text-ink-400'}>{icon}</span>
        {label}
      </p>
      <p className={`score-num mt-1 text-2xl ${gold ? 'text-gold-300' : 'text-ink-50'}`}>{value}</p>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 rounded-3xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
      <RowsSkeleton rows={4} />
    </div>
  );
}
