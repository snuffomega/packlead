import { ArrowLeft, Check, Copy, Lock, Share2, Swords, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar, PlayerLink } from '../components/Avatar';
import { DemoTag, EvidenceBadge } from '../components/Badges';
import { CardArt } from '../components/CardArt';
import { AccountGate } from '../components/JoinModal';
import { EmptyState, ErrorState, RowsSkeleton, Skeleton } from '../components/States';
import { fetchGroup } from '../lib/api';
import { PRODUCT_TYPES, productTypeMeta } from '../lib/catalog';
import { money, multiple } from '../lib/format';
import { useSession } from '../lib/session';
import type { Opening, Player, ProductType } from '../lib/types';
import { useAsync } from '../lib/useAsync';

export default function GroupPage() {
  const { id = '' } = useParams();
  const { player, loading } = useSession();
  if (loading) return <Skeleton className="h-64 rounded-3xl" />;
  if (!player) {
    return (
      <div className="mx-auto max-w-md">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-ink-700 bg-ink-850 text-brand-300">
          <Lock size={20} />
        </span>
        <h1 className="mt-4 font-display text-3xl font-bold text-ink-50">Private group</h1>
        <p className="mb-6 mt-1 text-sm text-ink-400">Friend groups are only visible to their members. Sign in to see this group.</p>
        <div className="surface p-5">
          <AccountGate />
        </div>
      </div>
    );
  }
  return <GroupView id={id} player={player} />;
}

function GroupView({ id, player }: { id: string; player: Player }) {
  const data = useAsync(() => fetchGroup(id), [id]);
  const [type, setType] = useState<ProductType>('booster_pack');
  const [rivalId, setRivalId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const board = useMemo(() => {
    if (!data.data) return [];
    const best = new Map<string, Opening>();
    for (const o of data.data.openings) {
      if (o.product_type !== type) continue;
      const cur = best.get(o.player_id);
      if (!cur || o.score > cur.score) best.set(o.player_id, o);
    }
    return data.data.members
      .map((m) => ({ member: m, best: best.get(m.id) ?? null }))
      .sort((a, b) => (b.best?.score ?? -1) - (a.best?.score ?? -1));
  }, [data.data, type]);

  if (data.error) return <ErrorState message={data.error} onRetry={data.reload} />;
  if (data.loading && !data.data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-36 rounded-3xl" />
        <RowsSkeleton rows={4} />
      </div>
    );
  }
  if (!data.data) {
    return <EmptyState icon={<Users size={24} />} title="Group not available" body="This group does not exist, or you are not a member. Ask a member for the invite code." action={<Link to="/friends" className="btn-primary">Back to Friends</Link>} />;
  }

  const { group, members } = data.data;
  const inviteUrl = `${window.location.origin}/join/${group.code}`;
  const mine = board.find((b) => b.member.id === player.id);
  const rivals = board.filter((b) => b.member.id !== player.id);
  const rival = rivals.find((b) => b.member.id === rivalId) ?? rivals.find((b) => b.best) ?? null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Join ${group.name} on PackLead`, text: `Join my PackLead group with code ${group.code}`, url: inviteUrl });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
      }
    }
    copy();
  };

  return (
    <div className="space-y-8">
      <Link to="/friends" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-300 transition hover:text-ink-50">
        <ArrowLeft size={16} /> Friends
      </Link>

      <section className="relative overflow-hidden rounded-3xl border border-ink-700 bg-ink-900 p-6">
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label flex items-center gap-2">
              Friends group {group.is_demo && <DemoTag />}
            </p>
            <h1 className="mt-1 font-display text-3xl font-bold text-ink-50">{group.name}</h1>
            <div className="mt-3 flex -space-x-2">
              {members.slice(0, 8).map((m) => (
                <span key={m.id} className="rounded-xl ring-2 ring-ink-900" title={m.username}>
                  <Avatar color={m.avatar_color} icon={m.avatar_icon} size="sm" />
                </span>
              ))}
              {members.length > 8 && <span className="flex h-8 items-center pl-3 text-xs text-ink-400">+{members.length - 8}</span>}
            </div>
          </div>
          <div className="rounded-2xl border border-ink-700 bg-ink-850 p-3">
            <p className="label">Invite code</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="mr-1 font-display text-2xl font-bold tracking-[0.25em] text-brand-300">{group.code}</span>
              <button onClick={copy} className="btn-ghost min-h-[44px] px-3 text-xs">
                {copied ? <Check size={14} className="text-brand-300" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
              {'share' in navigator && (
                <button onClick={share} className="btn-ghost min-h-[44px] px-3 text-xs" aria-label="Share invite">
                  <Share2 size={14} /> Share
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {PRODUCT_TYPES.map((t) => (
          <button key={t.id} onClick={() => setType(t.id)} className={type === t.id ? 'chip-on' : 'chip-off'}>
            {t.plural}
          </button>
        ))}
      </div>

      {rival && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink-50">
              <Swords size={18} className="text-coral-300" /> Head to head
            </h2>
            <select
              value={rival.member.id}
              onChange={(e) => setRivalId(e.target.value)}
              className="rounded-xl border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-ink-50 focus:border-brand-400 focus:outline-none"
              aria-label="Compare with"
            >
              {rivals.map((r) => (
                <option key={r.member.id} value={r.member.id}>
                  {r.member.username}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <CompareCard player={mine?.member ?? player} opening={mine?.best ?? null} win={!!mine?.best && (mine.best.score > (rival.best?.score ?? -1))} type={type} />
            <CompareCard player={rival.member} opening={rival.best} win={!!rival.best && rival.best.score > (mine?.best?.score ?? -1)} type={type} />
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-ink-50">Best {productTypeMeta(type).label.toLowerCase()} per member</h2>
        <div className="space-y-2">
          {board.map(({ member, best }, i) => (
            <div
              key={member.id}
              style={{ animationDelay: `${i * 35}ms` }}
              className={`surface flex animate-fade-up items-center gap-3 p-3 ${member.id === player.id ? 'border-brand-400/50' : ''}`}
            >
              <span className={`score-num w-7 text-center text-lg ${i === 0 && best ? 'text-gold-300' : 'text-ink-400'}`}>{best ? i + 1 : '-'}</span>
              <div className="min-w-0 flex-1">
                <PlayerLink player={member} size="sm" />
                {best ? (
                  <Link to={`/pack/${best.id}`} className="mt-0.5 block truncate text-xs text-ink-400 hover:text-ink-200">
                    {best.best_card_name} / {money(best.best_value)}
                  </Link>
                ) : (
                  <p className="mt-0.5 text-xs text-ink-500">No {productTypeMeta(type).plural.toLowerCase()} logged</p>
                )}
              </div>
              {best && (
                <Link to={`/pack/${best.id}`} className="text-right">
                  <p className="score-num text-2xl text-ink-50">{best.score}</p>
                  <p className="text-[10px] text-ink-400">{multiple(best.total_value, best.product_cost)}</p>
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function CompareCard({ player, opening, win, type }: { player: Player | null; opening: Opening | null; win: boolean; type: ProductType }) {
  return (
    <div className={`surface relative overflow-hidden p-4 transition ${win ? 'border-gold-400/60 shadow-[0_0_32px_-12px_rgba(245,194,66,0.6)]' : ''}`}>
      {win && <span className="absolute right-3 top-3 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-950">Leads</span>}
      <PlayerLink player={player} size="sm" />
      {opening ? (
        <Link to={`/pack/${opening.id}`} className="mt-4 block">
          <div className="mx-auto w-[60%] max-w-[140px]">
            <CardArt name={opening.best_card_name} rarity={opening.best_card_rarity} tier={opening.best_card_tier} image={opening.best_card_image} game={opening.game} />
          </div>
          <p className={`score-num mt-4 text-center text-4xl ${win ? 'text-gold-300' : 'text-ink-50'}`}>{opening.score}</p>
          <p className="truncate text-center text-xs text-ink-300">{opening.best_card_name}</p>
          <div className="mt-2 flex justify-center">
            <EvidenceBadge opening={opening} compact />
          </div>
        </Link>
      ) : (
        <p className="mt-6 py-8 text-center text-sm text-ink-400">No {productTypeMeta(type).plural.toLowerCase()} yet</p>
      )}
    </div>
  );
}
