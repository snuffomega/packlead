import { Minus, PenLine, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { RARITY_TIERS } from '../../lib/catalog';
import { money } from '../../lib/format';
import type { Card, GameId } from '../../lib/types';
import { CardArt } from '../CardArt';
import { ErrorState, Skeleton } from '../States';
import { ManualCardModal, type ManualCard } from './ManualCardModal';

export function PullsStep({
  game,
  cards,
  loading,
  error,
  onRetry,
  picks,
  setPicks,
  manual,
  setManual,
}: {
  game: GameId;
  cards: Card[] | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  picks: Record<string, number>;
  setPicks: (p: Record<string, number>) => void;
  manual: ManualCard[];
  setManual: (m: ManualCard[]) => void;
}) {
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<number | null>(null);
  const [manualOpen, setManualOpen] = useState(false);

  const change = (id: string, delta: number) => {
    const next = { ...picks, [id]: Math.min(20, Math.max(0, (picks[id] ?? 0) + delta)) };
    if (next[id] === 0) delete next[id];
    setPicks(next);
  };

  const q = query.trim().toLowerCase();
  const visible = (cards ?? []).filter(
    (c) => (!q || `${c.name} ${c.number ?? ''} ${c.rarity}`.toLowerCase().includes(q)) && (tier === null || c.tier === tier),
  );
  const tiers = [...new Set((cards ?? []).map((c) => c.tier))].sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or number" className="input pl-11" />
        </div>
        <button onClick={() => setManualOpen(true)} className="btn-ghost shrink-0 px-3" title="Add a card by hand">
          <PenLine size={16} /> <span className="hidden sm:inline">Add by hand</span>
        </button>
      </div>

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <button className={tier === null ? 'chip-on' : 'chip-off'} onClick={() => setTier(null)}>
          All rarities
        </button>
        {tiers.map((t) => (
          <button key={t} className={tier === t ? 'chip-on' : 'chip-off'} onClick={() => setTier(t)}>
            <span className="h-2 w-2 rounded-full" style={{ background: RARITY_TIERS[t]?.color }} />
            {RARITY_TIERS[t]?.label}
          </button>
        ))}
      </div>

      {manual.length > 0 && (
        <div className="space-y-2">
          <p className="label">Added by hand</p>
          {manual.map((m, i) => (
            <div key={i} className="surface flex items-center gap-3 px-3 py-2.5">
              <PenLine size={15} className="shrink-0 text-ink-400" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-50">{m.name}</p>
                <p className="text-xs text-ink-400">
                  {m.rarity} / {money(m.value)}
                </p>
              </div>
              <button className="text-xs font-semibold text-coral-300 hover:text-coral-200" onClick={() => setManual(manual.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : loading && !cards ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[63/88]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="surface px-4 py-8 text-center text-sm text-ink-300">
          No cards match. You can add any card by hand.
          <div className="mt-3">
            <button className="btn-ghost" onClick={() => setManualOpen(true)}>
              <PenLine size={15} /> Add by hand
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {visible.map((c) => {
            const qty = picks[c.id] ?? 0;
            return (
              <div key={c.id} className="group">
                <button
                  onClick={() => change(c.id, 1)}
                  className={`relative block w-full transition duration-200 ${qty ? 'scale-[0.97]' : 'hover:-translate-y-1'}`}
                  aria-label={`Add ${c.name}`}
                >
                  <CardArt name={c.name} rarity={c.rarity} tier={c.tier} image={c.image_url} game={game} className={qty ? '' : 'opacity-80 group-hover:opacity-100'} />
                  {qty > 0 && (
                    <span className="absolute inset-0 z-10 rounded-[6%/4.3%] ring-[3px] ring-brand-400">
                      <span className="absolute -right-1.5 -top-1.5 flex h-7 min-w-[28px] animate-pop-in items-center justify-center rounded-full bg-brand-400 px-1.5 text-xs font-bold text-ink-950 shadow-lg">
                        {qty}
                      </span>
                    </span>
                  )}
                </button>
                <div className="mt-1.5 flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold text-ink-100">{c.name}</p>
                    <p className="text-[10px] font-semibold text-gold-300">{money(c.value)}</p>
                  </div>
                  {qty > 0 && (
                    <button
                      onClick={() => change(c.id, -1)}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-ink-600 bg-ink-800 text-ink-200 hover:text-ink-50"
                      aria-label={`Remove one ${c.name}`}
                    >
                      <Minus size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-ink-400">
        <Plus size={12} /> Tap a card to add it. Tap again for duplicates. Values are demo estimates.
      </p>

      <ManualCardModal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        onAdd={(m) => {
          setManual([...manual, m]);
          setManualOpen(false);
        }}
      />
    </div>
  );
}
