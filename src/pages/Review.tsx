import { Check, Lock, ShieldCheck, Video, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PlayerLink } from '../components/Avatar';
import { DemoTag } from '../components/Badges';
import { CardArt } from '../components/CardArt';
import { AccountGate } from '../components/JoinModal';
import { EmptyState, ErrorState, RowsSkeleton, Skeleton } from '../components/States';
import { adminReview, checkModerator, fetchPendingReviews } from '../lib/api';
import { useSession } from '../lib/session';
import { productTypeMeta } from '../lib/catalog';
import { money, timeAgo } from '../lib/format';
import { useAsync } from '../lib/useAsync';

export default function Review() {
  const { player, loading } = useSession();
  if (loading) return <Skeleton className="mx-auto h-64 max-w-sm" />;
  if (!player) {
    return (
      <div className="mx-auto max-w-sm py-8">
        <div className="surface p-6">
          <GateIcon />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-50">Review queue</h1>
          <p className="mb-5 mt-1 text-sm text-ink-400">Moderators sign in with their PackLead account.</p>
          <AccountGate />
        </div>
      </div>
    );
  }
  return <ModeratorCheck />;
}

function GateIcon() {
  return (
    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold-400/40 bg-gold-400/10 text-gold-300">
      <Lock size={22} />
    </span>
  );
}

function ModeratorCheck() {
  const access = useAsync(checkModerator, []);
  if (access.error) return <ErrorState message={access.error} onRetry={access.reload} />;
  if (access.data === undefined || access.data === null) return <Skeleton className="mx-auto h-64 max-w-sm" />;
  if (!access.data) {
    return (
      <div className="mx-auto max-w-sm py-8">
        <div className="surface p-6">
          <GateIcon />
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-50">Moderators only</h1>
          <p className="mt-1 text-sm text-ink-400">
            The review queue is limited to moderators appointed by the PackLead team. Your submitted videos are reviewed here and you will see the result on your pack page.
          </p>
          <Link to="/" className="btn-ghost mt-5 min-h-[48px] w-full">
            Back to rankings
          </Link>
        </div>
      </div>
    );
  }
  return <Queue />;
}

function Queue() {
  const queue = useAsync(fetchPendingReviews, []);
  const [done, setDone] = useState<Record<string, 'approved' | 'rejected'>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (id: string, approve: boolean) => {
    setBusy(id);
    setError(null);
    try {
      await adminReview(id, approve);
      setDone((d) => ({ ...d, [id]: approve ? 'approved' : 'rejected' }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const pending = (queue.data ?? []).filter((o) => !done[o.id]);

  return (
    <div className="space-y-6">
      <div>
        <p className="label text-gold-300">Moderator tool</p>
        <h1 className="mt-1 font-display text-3xl font-bold text-ink-50">Review queue</h1>
        <p className="mt-1 text-sm text-ink-400">Watch each rip video. Approve only if the sealed product, the opening and the pulls are all visible in one take. You cannot review your own submissions.</p>
      </div>
      {error && <p role="alert" className="text-sm text-coral-300">{error}</p>}
      {queue.error ? (
        <ErrorState message={queue.error} onRetry={queue.reload} />
      ) : !queue.data ? (
        <RowsSkeleton rows={3} />
      ) : pending.length === 0 ? (
        <EmptyState icon={<ShieldCheck size={24} />} title="Queue is clear" body={`No videos waiting. ${Object.keys(done).length} reviewed this session.`} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {pending.map((o) => (
            <div key={o.id} className="surface animate-fade-up overflow-hidden">
              {o.video_url ? (
                <video src={o.video_url} controls playsInline preload="metadata" className="aspect-video w-full bg-ink-950" />
              ) : (
                <div className="flex aspect-video items-center justify-center gap-2 bg-ink-950 text-sm text-ink-400">
                  <Video size={18} /> No video file attached
                </div>
              )}
              <div className="flex gap-4 p-4">
                <div className="w-16 shrink-0">
                  <CardArt name={o.best_card_name} rarity={o.best_card_rarity} tier={o.best_card_tier} image={o.best_card_image} game={o.game} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <PlayerLink player={o.player} size="xs" />
                    {o.is_demo && <DemoTag />}
                  </div>
                  <Link to={`/pack/${o.id}`} className="mt-1 block truncate font-semibold text-ink-50 hover:text-brand-300">
                    {o.product_name}
                  </Link>
                  <p className="text-xs text-ink-400">
                    {productTypeMeta(o.product_type).label} / Score {o.score} / Best {money(o.best_value)} / {timeAgo(o.opened_at)}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button onClick={() => decide(o.id, false)} disabled={busy === o.id} className="btn-ghost min-h-[44px] py-2 text-coral-200">
                      <X size={15} /> Reject
                    </button>
                    <button onClick={() => decide(o.id, true)} disabled={busy === o.id} className="btn-primary min-h-[44px] py-2">
                      <Check size={15} /> Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
