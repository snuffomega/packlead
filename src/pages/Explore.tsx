import { Crown, Gem, ShieldCheck, Trophy } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DEFAULT_FILTERS, FilterBar } from '../components/FilterBar';
import { LeaderRow } from '../components/LeaderRow';
import { OpeningTile } from '../components/OpeningTile';
import { EmptyState, ErrorState, RowsSkeleton } from '../components/States';
import { fetchLeaderboard, fetchTopOpenings } from '../lib/api';
import { GAMES, PRODUCT_TYPES, gameMeta } from '../lib/catalog';
import { useSession } from '../lib/session';
import type { LeaderboardFilters, Opening } from '../lib/types';
import { useAsync } from '../lib/useAsync';

const TABS = [
  { id: 'best', label: 'Best Single Pack', Icon: Trophy },
  { id: 'pulls', label: 'Biggest Pull', Icon: Gem },
  { id: 'hall', label: 'Hall of Fame', Icon: Crown },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'best') as Tab;
  const [filters, setFilters] = useState<LeaderboardFilters>(DEFAULT_FILTERS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink-50">Explore Rankings</h1>
        <p className="mt-1 text-sm text-ink-400">Every pack, every pull, ranked. Open and verified rankings are kept separate.</p>
      </div>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setParams({ tab: t.id }, { replace: true })}
            className={`inline-flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold transition ${
              tab === t.id ? 'border-brand-400/60 bg-brand-400/15 text-brand-100' : 'border-ink-700 bg-ink-850 text-ink-300 hover:text-ink-50'
            }`}
          >
            <t.Icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'hall' ? (
        <HallOfFame />
      ) : (
        <>
          <FilterBar value={filters} onChange={setFilters} showProductType={tab === 'best'} />
          <Board filters={filters} sort={tab === 'best' ? 'score' : 'pull'} />
        </>
      )}
    </div>
  );
}

function Board({ filters, sort }: { filters: LeaderboardFilters; sort: 'score' | 'pull' }) {
  const { hideDemo, player } = useSession();
  const { data, error, loading, reload } = useAsync(
    () => fetchLeaderboard({ ...filters, hideDemo, sort, limit: 50 }),
    [filters.productType, filters.game, filters.setId, filters.period, filters.verifiedOnly, hideDemo, sort],
  );
  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <RowsSkeleton rows={8} />;
  if (!data?.length)
    return (
      <EmptyState
        icon={<Trophy size={24} />}
        title="No openings match"
        body="Try a different game, set or time period, or log a pack to fill this board."
        action={
          <Link to="/rip" className="btn-primary">
            Log a Pack
          </Link>
        }
      />
    );
  return (
    <div className="space-y-2">
      {data.map((o, i) => (
        <LeaderRow key={o.id} opening={o} rank={i + 1} metric={sort} delay={Math.min(i, 12) * 30} highlight={o.player_id === player?.id} />
      ))}
    </div>
  );
}

function HallOfFame() {
  const { hideDemo } = useSession();
  const { data, error, loading, reload } = useAsync(() => fetchTopOpenings(400, hideDemo), [hideDemo]);

  const { records, verified, pulls } = useMemo(() => {
    const list = data ?? [];
    const records: { key: string; title: string; opening: Opening }[] = [];
    for (const g of GAMES) {
      for (const p of PRODUCT_TYPES) {
        const best = list.find((o) => o.game === g.id && o.product_type === p.id);
        if (best) records.push({ key: `${g.id}-${p.id}`, title: `${g.label} / ${p.plural}`, opening: best });
      }
    }
    const verified = list.filter((o) => o.video_review === 'approved').slice(0, 6);
    const pulls = [...list].sort((a, b) => b.best_value - a.best_value).slice(0, 6);
    return { records, verified, pulls };
  }, [data]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data) return <RowsSkeleton rows={6} />;
  if (!data?.length)
    return <EmptyState icon={<Crown size={24} />} title="The Hall is empty" body="Records appear here as soon as packs are logged." />;

  return (
    <div className="space-y-10">
      <section>
        <SectionTitle icon={<ShieldCheck size={18} className="text-gold-300" />} title="Verified Legends" body="Top openings approved from continuous video" />
        {verified.length ? (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-6">
            {verified.map((o, i) => (
              <OpeningTile key={o.id} opening={o} delay={i * 40} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-400">No verified openings yet.</p>
        )}
      </section>

      <section>
        <SectionTitle icon={<Crown size={18} className="text-gold-300" />} title="Record Holders" body="The highest Rip Score for every game and product type" />
        <div className="grid gap-2 sm:grid-cols-2">
          {records.map((r, i) => (
            <div key={r.key}>
              <p className="mb-1 ml-1 text-[11px] font-bold uppercase tracking-wider" style={{ color: gameMeta(r.opening.game).color }}>
                {r.title}
              </p>
              <LeaderRow opening={r.opening} delay={i * 25} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle icon={<Gem size={18} className="text-coral-300" />} title="Pulls of Legend" body="The most valuable single cards ever logged" />
        <div className="space-y-2">
          {pulls.map((o, i) => (
            <LeaderRow key={o.id} opening={o} rank={i + 1} metric="pull" delay={i * 30} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="mb-4">
      <h2 className="inline-flex items-center gap-2 font-display text-xl font-bold text-ink-50">
        {icon} {title}
      </h2>
      <p className="text-sm text-ink-400">{body}</p>
    </div>
  );
}
