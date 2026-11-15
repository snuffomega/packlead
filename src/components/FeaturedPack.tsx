import { Crown, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { gameMeta, productTypeMeta } from '../lib/catalog';
import { useCatalog } from '../lib/catalogContext';
import { money, multiple, timeAgo } from '../lib/format';
import type { Opening } from '../lib/types';
import { PlayerLink } from './Avatar';
import { DemoTag, EvidenceBadge } from './Badges';
import { CardArt } from './CardArt';

export function FeaturedPack({ opening, label }: { opening: Opening; label: string }) {
  const { setById } = useCatalog();
  const g = gameMeta(opening.game);
  return (
    <Link
      to={`/pack/${opening.id}`}
      className="group relative block animate-fade-up overflow-hidden rounded-3xl border border-gold-400/30 bg-ink-900 p-5 transition duration-300 hover:border-gold-400/60 sm:p-6"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: `radial-gradient(70% 90% at 75% 20%, ${g.glow}, transparent 70%), radial-gradient(50% 60% at 0% 100%, rgba(245,194,66,0.12), transparent)` }}
      />
      <div className="grid-noise pointer-events-none absolute inset-0 opacity-50" />
      <div className="relative flex items-center gap-5 sm:gap-7">
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/50 bg-gold-400/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gold-200">
            <Crown size={13} /> {label}
          </div>
          <div className="mt-3 flex items-end gap-2">
            <span className="score-num text-6xl leading-none text-ink-50 sm:text-7xl">{opening.score}</span>
            <span className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-ink-300">Rip Score</span>
          </div>
          <p className="mt-3 truncate font-display text-lg font-bold text-ink-50 sm:text-xl">{opening.best_card_name}</p>
          <p className="text-sm font-semibold text-gold-300">
            {money(opening.best_value)} <span className="font-normal text-ink-400">/ {opening.best_card_rarity}</span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <PlayerLink player={opening.player} size="sm" />
            {opening.is_demo && <DemoTag />}
          </div>
          <p className="mt-2 truncate text-xs text-ink-400">
            <span style={{ color: g.color }}>{g.label}</span> / {setById(opening.set_id)?.name} / {productTypeMeta(opening.product_type).label}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <EvidenceBadge opening={opening} />
            <span className="inline-flex items-center gap-1 rounded-full border border-ink-600 bg-ink-800/80 px-2.5 py-1 text-xs font-semibold text-ink-200">
              <Sparkles size={12} className="text-brand-300" /> {multiple(opening.total_value, opening.product_cost)} return
            </span>
            <span className="text-xs text-ink-400">{timeAgo(opening.opened_at)}</span>
          </div>
        </div>
        <div className="relative w-[36%] max-w-[210px] shrink-0">
          <div className="absolute inset-0 -z-0 scale-110 rounded-full blur-2xl" style={{ background: g.glow }} />
          <div className="relative animate-float transition duration-500 group-hover:scale-[1.04]">
            <CardArt
              name={opening.best_card_name}
              rarity={opening.best_card_rarity}
              tier={Math.max(opening.best_card_tier, 5)}
              image={opening.best_card_image}
              game={opening.game}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
