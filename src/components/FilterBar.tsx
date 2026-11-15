import { EyeOff, ShieldCheck } from 'lucide-react';
import { GAMES, PERIODS, PRODUCT_TYPES } from '../lib/catalog';
import { useCatalog } from '../lib/catalogContext';
import { useSession } from '../lib/session';
import type { LeaderboardFilters } from '../lib/types';

export const DEFAULT_FILTERS: LeaderboardFilters = {
  productType: 'booster_pack',
  game: 'all',
  setId: 'all',
  period: 'all',
  verifiedOnly: false,
};

export function FilterBar({
  value,
  onChange,
  showProductType = true,
}: {
  value: LeaderboardFilters;
  onChange: (v: LeaderboardFilters) => void;
  showProductType?: boolean;
}) {
  const { sets } = useCatalog();
  const { hideDemo, setHideDemo } = useSession();
  const gameSets = value.game === 'all' ? [] : sets.filter((s) => s.game === value.game);
  const set = (patch: Partial<LeaderboardFilters>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      {showProductType && (
        <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-1 rounded-2xl border border-ink-700 bg-ink-900 p-1">
            {PRODUCT_TYPES.map((p) => (
              <button
                key={p.id}
                onClick={() => set({ productType: p.id })}
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition duration-200 sm:text-sm ${
                  value.productType === p.id ? 'bg-ink-50 text-ink-950 shadow' : 'text-ink-300 hover:text-ink-50'
                }`}
              >
                {p.plural}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        <button className={value.game === 'all' ? 'chip-on' : 'chip-off'} onClick={() => set({ game: 'all', setId: 'all' })}>
          All games
        </button>
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={value.game === g.id ? 'chip-on' : 'chip-off'}
            onClick={() => set({ game: g.id, setId: 'all' })}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
            {g.label}
          </button>
        ))}
      </div>

      {gameSets.length > 0 && (
        <div className="no-scrollbar -mx-4 flex animate-fade-up gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
          <button className={value.setId === 'all' ? 'chip-on' : 'chip-off'} onClick={() => set({ setId: 'all' })}>
            All sets
          </button>
          {gameSets.map((s) => (
            <button key={s.id} className={value.setId === s.id ? 'chip-on' : 'chip-off'} onClick={() => set({ setId: s.id })}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-ink-700 bg-ink-900 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => set({ period: p.id })}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                value.period === p.id ? 'bg-ink-700 text-ink-50' : 'text-ink-300 hover:text-ink-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-xl border border-ink-700 bg-ink-900 p-0.5">
          <button
            onClick={() => set({ verifiedOnly: false })}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${!value.verifiedOnly ? 'bg-ink-700 text-ink-50' : 'text-ink-300 hover:text-ink-100'}`}
          >
            Open ranking
          </button>
          <button
            onClick={() => set({ verifiedOnly: true })}
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              value.verifiedOnly ? 'bg-gold-400/20 text-gold-200' : 'text-ink-300 hover:text-ink-100'
            }`}
          >
            <ShieldCheck size={13} /> Verified ranking
          </button>
        </div>
        <button
          onClick={() => setHideDemo(!hideDemo)}
          className={hideDemo ? 'chip-on' : 'chip-off'}
          aria-pressed={hideDemo}
        >
          <EyeOff size={13} /> {hideDemo ? 'Demo entries hidden' : 'Hide demo entries'}
        </button>
      </div>
    </div>
  );
}
