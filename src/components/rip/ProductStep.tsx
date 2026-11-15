import { Check, History, ScanLine, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { GAMES, PRODUCT_TYPES, gameMeta, productArt, productTypeMeta } from '../../lib/catalog';
import { useCatalog } from '../../lib/catalogContext';
import { money } from '../../lib/format';
import { getRecentProducts } from '../../lib/session';
import type { GameId, Product } from '../../lib/types';
import { ScanModal } from './ScanModal';

export function ProductStep({
  selected,
  onSelect,
}: {
  selected: Product | null;
  onSelect: (p: Product, scanUrl: string | null) => void;
}) {
  const { sets, products, setById, productById } = useCatalog();
  const [game, setGame] = useState<GameId | null>(selected ? (setById(selected.set_id)?.game ?? null) : null);
  const [setId, setSetId] = useState<string | null>(selected?.set_id ?? null);
  const [query, setQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const recent = useMemo(() => getRecentProducts().map(productById).filter(Boolean) as Product[], [productById]);

  const q = query.trim().toLowerCase();
  const gameSets = sets.filter((s) => s.game === game);
  const visible = q
    ? products.filter((p) => `${p.name} ${setById(p.set_id)?.name ?? ''}`.toLowerCase().includes(q))
    : setId
      ? products.filter((p) => p.set_id === setId)
      : [];

  const pickGame = (g: GameId) => {
    setGame(g);
    setSetId(sets.find((s) => s.game === g)?.id ?? null);
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => setScanning(true)}
        className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-brand-400/40 bg-gradient-to-br from-brand-400/15 via-ink-900 to-ink-900 p-4 text-left transition hover:border-brand-400/80"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-400 text-ink-950 shadow-[0_0_24px_-4px_rgba(20,224,194,0.8)] transition group-hover:scale-105">
          <ScanLine size={24} />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-lg font-bold text-ink-50">Scan your pack</span>
          <span className="block text-xs text-ink-300">Point your camera at the product. Demo recognition suggests a match.</span>
        </span>
      </button>

      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products or sets" className="input pl-11" />
      </div>

      {!q && recent.length > 0 && (
        <div>
          <p className="label mb-2 flex items-center gap-1.5">
            <History size={13} /> Recent
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {recent.map((p) => (
              <ProductTile key={p.id} product={p} selected={selected?.id === p.id} onClick={() => onSelect(p, null)} compact />
            ))}
          </div>
        </div>
      )}

      {!q && (
        <>
          <div>
            <p className="label mb-2">Game</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GAMES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => pickGame(g.id)}
                  className={`relative overflow-hidden rounded-xl border p-3 text-left transition ${game === g.id ? 'bg-ink-800' : 'border-ink-700 bg-ink-850 hover:border-ink-500'}`}
                  style={game === g.id ? { borderColor: g.color, boxShadow: `0 0 24px -8px ${g.glow}` } : undefined}
                >
                  <img src={productArt(g.id, 'booster_pack')} alt="" className="absolute -right-2 -top-1 h-16 w-14 rotate-12 object-contain opacity-70" />
                  <span className="relative block text-[10px] font-bold tracking-widest" style={{ color: g.color }}>
                    {g.short}
                  </span>
                  <span className="relative mt-3 block text-sm font-semibold text-ink-50">{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          {game && (
            <div className="animate-fade-up">
              <p className="label mb-2">Set</p>
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                {gameSets.map((s) => (
                  <button key={s.id} onClick={() => setSetId(s.id)} className={setId === s.id ? 'chip-on' : 'chip-off'}>
                    {s.name}
                    <span className="opacity-60">{s.release_year}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {(q || setId) && (
        <div className="animate-fade-up">
          <p className="label mb-2">{q ? `${visible.length} result${visible.length === 1 ? '' : 's'}` : 'Product'}</p>
          {visible.length === 0 ? (
            <p className="surface px-4 py-6 text-center text-sm text-ink-300">No products match that search.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {[...visible]
                .sort((a, b) => PRODUCT_TYPES.findIndex((t) => t.id === a.product_type) - PRODUCT_TYPES.findIndex((t) => t.id === b.product_type))
                .map((p) => (
                  <ProductTile key={p.id} product={p} selected={selected?.id === p.id} onClick={() => onSelect(p, null)} />
                ))}
            </div>
          )}
        </div>
      )}

      <ScanModal
        open={scanning}
        onClose={() => setScanning(false)}
        hintGame={game}
        onConfirm={(p, url) => {
          setScanning(false);
          onSelect(p, url);
        }}
      />
    </div>
  );
}

function ProductTile({ product, selected, onClick, compact = false }: { product: Product; selected: boolean; onClick: () => void; compact?: boolean }) {
  const { setById } = useCatalog();
  const set = setById(product.set_id);
  const g = gameMeta(set?.game ?? 'pokemon');
  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl border text-left transition duration-200 ${selected ? 'border-brand-400 bg-brand-400/10' : 'border-ink-700 bg-ink-850 hover:-translate-y-0.5 hover:border-ink-500'} ${compact ? 'flex-row items-center gap-2 p-2' : 'p-3'}`}
    >
      {selected && (
        <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-brand-400 text-ink-950">
          <Check size={14} strokeWidth={3} />
        </span>
      )}
      <div
        className={`relative flex items-center justify-center ${compact ? 'h-12 w-10 shrink-0' : 'mb-3 aspect-square rounded-xl'}`}
        style={compact ? undefined : { background: `radial-gradient(circle at 50% 60%, ${g.glow}, transparent 70%)` }}
      >
        <img
          src={productArt(set?.game ?? 'pokemon', product.product_type)}
          alt=""
          loading="lazy"
          className={`object-contain drop-shadow-2xl transition duration-300 group-hover:scale-105 ${compact ? 'h-full w-full' : 'h-[85%] w-[85%]'}`}
        />
      </div>
      <div className="min-w-0">
        <p className={`font-semibold text-ink-50 ${compact ? 'truncate text-xs' : 'line-clamp-2 text-sm leading-snug'}`}>{product.name}</p>
        <p className="mt-0.5 truncate text-[11px] text-ink-400">
          {productTypeMeta(product.product_type).label} / <span className="text-ink-200">{money(product.price)}</span>
        </p>
      </div>
    </button>
  );
}
