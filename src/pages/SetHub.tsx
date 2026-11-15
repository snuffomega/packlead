import { ArrowLeft, Clock, Gem, Layers, PackageOpen, ShieldCheck, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { GameTag } from '../components/Badges';
import { LeaderRow } from '../components/LeaderRow';
import { SetCatalog } from '../components/SetCatalog';
import { EmptyState, ErrorState, RowsSkeleton, Skeleton } from '../components/States';
import { fetchSetOpenings } from '../lib/api';
import { PRODUCT_TYPES, gameMeta, productArt } from '../lib/catalog';
import { useCatalog } from '../lib/catalogContext';
import { money } from '../lib/format';
import { useSession } from '../lib/session';
import type { CardSet, Opening, ProductType } from '../lib/types';
import { useAsync } from '../lib/useAsync';

const TABS = [
  { id: 'top', label: 'Top Openings', Icon: Trophy },
  { id: 'pulls', label: 'Biggest Pulls', Icon: Gem },
  { id: 'verified', label: 'Verified', Icon: ShieldCheck },
  { id: 'recent', label: 'Recent', Icon: Clock },
  { id: 'cards', label: 'Cards', Icon: Layers },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function SetHub() {
  const { id = '' } = useParams();
  const { setById, loading, error } = useCatalog();
  const set = setById(id);

  if (error) return <ErrorState message={error} />;
  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-40" />
        <RowsSkeleton rows={4} />
      </div>
    );
  if (!set)
    return (
      <EmptyState
        icon={<Layers size={24} />}
        title="Set not found"
        body="This set isn't in the PackLead catalog."
        action={<Link to="/explore?tab=sets" className="btn-primary">Browse sets</Link>}
      />
    );
  return <SetView set={set} />;
}

function SetView({ set }: { set: CardSet }) {
  const { products } = useCatalog();
  const { hideDemo, player } = useSession();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'top') as Tab;
  const g = gameMeta(set.game);
  const setProducts = useMemo(() => products.filter((p) => p.set_id === set.id), [products, set.id]);
  const { data, error, loading, reload } = useAsync(() => fetchSetOpenings(set.id, hideDemo), [set.id, hideDemo]);

  const stats = useMemo(() => {
    const list = data ?? [];
    return {
      count: list.length,
      verified: list.filter((o) => o.video_review === 'approved').length,
      bestPull: list.reduce((m, o) => Math.max(m, o.best_value), 0),
    };
  }, [data]);

  return (
    <div className="space-y-8">
      <Link to="/explore?tab=sets" className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-ink-300 transition hover:text-ink-50">
        <ArrowLeft size={16} /> All sets
      </Link>

      <section className="surface relative overflow-hidden p-5 sm:p-8">
        <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(circle at 85% 0%, ${g.glow}, transparent 60%)` }} />
        <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <GameTag game={set.game} />
            <span className="text-xs font-semibold text-ink-400">
              {set.code} / {set.release_year}
            </span>
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink-50 sm:text-4xl">{set.name}</h1>
          <dl className="mt-5 grid grid-cols-3 gap-3 sm:max-w-md">
            <Stat label="Openings" value={loading && !data ? '-' : String(stats.count)} />
            <Stat label="Verified" value={loading && !data ? '-' : String(stats.verified)} />
            <Stat label="Best pull" value={loading && !data ? '-' : stats.bestPull ? money(stats.bestPull) : '-'} />
          </dl>
          <Link to={`/rip?set=${set.id}`} className="btn-primary mt-6 min-h-[52px] w-full sm:w-auto">
            <PackageOpen size={18} /> Log from this set
          </Link>
        </div>
      </section>

      {setProducts.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold text-ink-50">Sealed products</h2>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
            {setProducts.map((p) => (
              <Link
                key={p.id}
                to={`/rip?product=${p.id}`}
                className="surface flex w-[220px] shrink-0 items-center gap-3 p-3 transition hover:-translate-y-0.5 hover:border-ink-500 sm:w-auto"
              >
                <img src={productArt(set.game, p.product_type)} alt="" loading="lazy" className="h-16 w-12 shrink-0 object-contain" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{PRODUCT_TYPES.find((t) => t.id === p.product_type)?.label}</p>
                  <p className="truncate text-sm font-semibold text-ink-50">{p.name}</p>
                  <p className="text-xs text-ink-300">
                    {money(p.price)} <span className="text-ink-500">/ reference price</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setParams({ tab: t.id }, { replace: true })}
              className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition ${
                tab === t.id ? 'border-brand-400/60 bg-brand-400/15 text-brand-100' : 'border-ink-700 bg-ink-850 text-ink-300 hover:text-ink-50'
              }`}
            >
              <t.Icon size={16} /> {t.label}
            </button>
          ))}
        </div>
        {tab === 'cards' ? (
          <SetCatalog setId={set.id} game={set.game} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : loading && !data ? (
          <RowsSkeleton rows={5} />
        ) : (
          <OpeningsTab tab={tab} openings={data ?? []} setId={set.id} myId={player?.id} />
        )}
      </section>
    </div>
  );
}

function OpeningsTab({ tab, openings, setId, myId }: { tab: Exclude<Tab, 'cards'>; openings: Opening[]; setId: string; myId?: string }) {
  const types = useMemo(() => PRODUCT_TYPES.filter((t) => openings.some((o) => o.product_type === t.id)), [openings]);
  const [type, setType] = useState<ProductType | null>(null);
  const activeType = type && types.some((t) => t.id === type) ? type : types[0]?.id;

  const list = useMemo(() => {
    if (tab === 'top') return openings.filter((o) => o.product_type === activeType).slice(0, 25);
    if (tab === 'pulls') return [...openings].sort((a, b) => b.best_value - a.best_value).slice(0, 25);
    if (tab === 'verified') return openings.filter((o) => o.video_review === 'approved').slice(0, 25);
    return [...openings].sort((a, b) => b.opened_at.localeCompare(a.opened_at)).slice(0, 25);
  }, [tab, openings, activeType]);

  if (!openings.length || !list.length)
    return (
      <EmptyState
        icon={tab === 'verified' ? <ShieldCheck size={24} /> : <Trophy size={24} />}
        title={tab === 'verified' ? 'No verified openings yet' : 'No openings yet'}
        body={
          tab === 'verified'
            ? 'Openings become verified when a continuous video is approved by a moderator.'
            : 'Be the first to log a pack from this set.'
        }
        action={
          <Link to={`/rip?set=${setId}`} className="btn-primary">
            Log from this set
          </Link>
        }
      />
    );

  return (
    <div className="space-y-3">
      {tab === 'top' && types.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Product type">
          {types.map((t) => (
            <button key={t.id} onClick={() => setType(t.id)} aria-pressed={activeType === t.id} className={`min-h-[40px] ${activeType === t.id ? 'chip-on' : 'chip-off'}`}>
              {t.plural}
            </button>
          ))}
        </div>
      )}
      {tab === 'top' && <p className="text-xs text-ink-400">Rip Scores are only compared within the same product type.</p>}
      <div className="space-y-2">
        {list.map((o, i) => (
          <LeaderRow
            key={o.id}
            opening={o}
            rank={tab === 'recent' ? undefined : i + 1}
            metric={tab === 'pulls' ? 'pull' : 'score'}
            highlight={o.player_id === myId}
            delay={Math.min(i, 12) * 30}
          />
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-ink-700/70 bg-ink-900/60 px-3 py-2.5">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{label}</dt>
      <dd className="score-num mt-0.5 truncate text-lg text-ink-50">{value}</dd>
    </div>
  );
}
