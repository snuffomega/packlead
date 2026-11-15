import { Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { fetchCards } from '../lib/api';
import { RARITY_TIERS } from '../lib/catalog';
import { money } from '../lib/format';
import type { Card, GameId } from '../lib/types';
import { useAsync } from '../lib/useAsync';
import { CardArt } from './CardArt';
import { CardViewer } from './CardViewer';
import { EmptyState, ErrorState, Skeleton } from './States';

export function SetCatalog({ setId, game }: { setId: string; game: GameId }) {
  const { data, error, loading, reload } = useAsync(() => fetchCards(setId), [setId]);
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<number | null>(null);
  const [viewing, setViewing] = useState<Card | null>(null);

  const tiers = useMemo(() => [...new Set((data ?? []).map((c) => c.tier))].sort((a, b) => b - a), [data]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (c) => (tier === null || c.tier === tier) && (!q || c.name.toLowerCase().includes(q) || (c.number ?? '').toLowerCase().includes(q)),
    );
  }, [data, query, tier]);

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (loading && !data)
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[63/88]" />
        ))}
      </div>
    );
  if (!data?.length) return <EmptyState icon={<Sparkles size={24} />} title="No cards listed yet" body="This set's card list hasn't been added to PackLead." />;

  return (
    <div className="space-y-4">
      <label className="relative block">
        <span className="sr-only">Search cards in this set</span>
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or number"
          className="input h-12 pl-11"
        />
      </label>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter by rarity">
        <button onClick={() => setTier(null)} aria-pressed={tier === null} className={`min-h-[40px] shrink-0 ${tier === null ? 'chip-on' : 'chip-off'}`}>
          All rarities
        </button>
        {tiers.map((t) => (
          <button key={t} onClick={() => setTier(t)} aria-pressed={tier === t} className={`min-h-[40px] shrink-0 ${tier === t ? 'chip-on' : 'chip-off'}`}>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: RARITY_TIERS[t]?.color }} />
            {RARITY_TIERS[t]?.label ?? `Tier ${t}`}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-400">
        {shown.length} of {data.length} cards / values are catalog reference estimates
      </p>
      {shown.length ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-6">
          {shown.map((c) => (
            <button key={c.id} onClick={() => setViewing(c)} className="group text-left" aria-label={`${c.name}, ${money(c.value)}`}>
              <CardArt name={c.name} rarity={c.rarity} tier={c.tier} image={c.image_url} game={game} className="transition group-hover:-translate-y-1" />
              <p className="mt-1.5 truncate text-xs font-semibold text-ink-100">{c.name}</p>
              <p className="text-[11px] font-semibold text-gold-300">{money(c.value)}</p>
            </button>
          ))}
        </div>
      ) : (
        <p className="surface px-4 py-8 text-center text-sm text-ink-300">No cards match that search.</p>
      )}
      <CardViewer card={viewing} game={game} onClose={() => setViewing(null)} />
    </div>
  );
}
