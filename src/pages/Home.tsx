import { ArrowRight, Camera, Plus, ShieldCheck, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DEFAULT_FILTERS, FilterBar } from '../components/FilterBar';
import { FeaturedPack } from '../components/FeaturedPack';
import { LeaderRow } from '../components/LeaderRow';
import { OpeningTile } from '../components/OpeningTile';
import { EmptyState, ErrorState, RowsSkeleton, Skeleton } from '../components/States';
import { fetchLeaderboard, fetchRecent } from '../lib/api';
import { PERIODS, productTypeMeta } from '../lib/catalog';
import { useSession } from '../lib/session';
import type { LeaderboardFilters } from '../lib/types';
import { useAsync } from '../lib/useAsync';

export default function Home() {
  const { hideDemo, player } = useSession();
  const [filters, setFilters] = useState<LeaderboardFilters>(DEFAULT_FILTERS);
  const board = useAsync(
    () => fetchLeaderboard({ ...filters, hideDemo, sort: 'score', limit: 10 }),
    [filters.productType, filters.game, filters.setId, filters.period, filters.verifiedOnly, hideDemo],
  );
  const recent = useAsync(() => fetchRecent(hideDemo, 12), [hideDemo]);
  const top = board.data?.[0];
  const periodLabel = PERIODS.find((p) => p.id === filters.period)?.label ?? '';

  return (
    <div className="space-y-10">
      <section className="grid items-center gap-6 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
        <div className="animate-fade-up">
          <p className="label text-brand-300">Open packs. lead to greatness.</p>
          <h1 className="mt-2 font-display text-4xl font-bold text-ink-50 sm:text-5xl">
            The best pack <span className="text-gold-300">wins.</span>
          </h1>
          <p className="mt-3 max-w-md text-[15px] text-ink-300">
            Log what you pulled, get a Rip Score out of 1000, and see where your pack lands on the global leaderboard.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/rip" className="btn-primary px-5 py-3 text-[15px]">
              <Plus size={18} strokeWidth={2.6} /> Log a Pack
            </Link>
            <Link to="/explore" className="btn-ghost px-5 py-3 text-[15px]">
              Explore Rankings <ArrowRight size={16} />
            </Link>
          </div>
          <div className="mt-6 hidden gap-5 text-xs text-ink-400 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <Trophy size={14} className="text-gold-300" /> Ranked per product type
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Camera size={14} className="text-sky-300" /> Photo evidence
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-gold-300" /> Video-verified rips
            </span>
          </div>
        </div>
        <div>
          {board.loading && !board.data ? (
            <Skeleton className="h-[280px] rounded-3xl" />
          ) : top ? (
            <FeaturedPack opening={top} label={`#1 ${productTypeMeta(filters.productType).label} / ${periodLabel}`} />
          ) : null}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-50">Global Leaderboard</h2>
            <p className="text-sm text-ink-400">Best single {productTypeMeta(filters.productType).label.toLowerCase()} openings</p>
          </div>
          <Link to="/explore" className="hidden shrink-0 text-sm font-semibold text-brand-300 hover:text-brand-200 sm:inline-flex sm:items-center sm:gap-1">
            Full rankings <ArrowRight size={15} />
          </Link>
        </div>
        <FilterBar value={filters} onChange={setFilters} />
        <div className="mt-4">
          {board.error ? (
            <ErrorState message={board.error} onRetry={board.reload} />
          ) : board.loading && !board.data ? (
            <RowsSkeleton />
          ) : board.data && board.data.length > 0 ? (
            <div className="space-y-2">
              {board.data.map((o, i) => (
                <LeaderRow key={o.id} opening={o} rank={i + 1} delay={i * 35} highlight={o.player_id === player?.id} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Trophy size={24} />}
              title="No openings here yet"
              body="Nobody has claimed this spot. Log a pack and take the #1 position."
              action={
                <Link to="/rip" className="btn-primary">
                  <Plus size={16} /> Log a Pack
                </Link>
              }
            />
          )}
        </div>
        <Link to="/explore" className="btn-ghost mt-4 w-full sm:hidden">
          Full rankings <ArrowRight size={15} />
        </Link>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-50">Fresh rips</h2>
            <p className="text-sm text-ink-400">The latest openings from the community</p>
          </div>
        </div>
        {recent.error ? (
          <ErrorState message={recent.error} onRetry={recent.reload} />
        ) : recent.loading && !recent.data ? (
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-40 shrink-0" />
            ))}
          </div>
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0 lg:grid-cols-6">
            {recent.data?.map((o, i) => <OpeningTile key={o.id} opening={o} delay={i * 40} />)}
          </div>
        )}
      </section>
    </div>
  );
}
