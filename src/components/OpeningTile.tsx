import { Link } from 'react-router-dom';
import { gameMeta } from '../lib/catalog';
import { money, timeAgo } from '../lib/format';
import type { Opening } from '../lib/types';
import { Avatar } from './Avatar';
import { DemoTag, EvidenceBadge } from './Badges';
import { CardArt } from './CardArt';

export function OpeningTile({ opening, delay = 0 }: { opening: Opening; delay?: number }) {
  const g = gameMeta(opening.game);
  return (
    <Link
      to={`/pack/${opening.id}`}
      style={{ animationDelay: `${delay}ms` }}
      className="group relative flex w-40 shrink-0 animate-fade-up flex-col overflow-hidden rounded-2xl border border-ink-700/70 bg-ink-850 p-2.5 transition duration-300 hover:-translate-y-1 hover:border-ink-500 sm:w-auto"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-60 transition group-hover:opacity-100"
        style={{ background: `radial-gradient(80% 100% at 50% 0%, ${g.glow}, transparent)` }}
      />
      <div className="relative mx-auto w-[78%] transition duration-300 group-hover:scale-[1.04]">
        <CardArt
          name={opening.best_card_name}
          rarity={opening.best_card_rarity}
          tier={opening.best_card_tier}
          image={opening.best_card_image}
          game={opening.game}
        />
      </div>
      <div className="relative mt-2.5 flex items-center justify-between gap-2">
        <span className="score-num text-xl text-ink-50">{opening.score}</span>
        <EvidenceBadge opening={opening} compact />
      </div>
      <p className="relative truncate text-xs font-semibold text-ink-100">{opening.best_card_name}</p>
      <p className="relative truncate text-[11px] text-gold-300">{money(opening.best_value)}</p>
      <div className="relative mt-2 flex items-center gap-1.5 border-t border-ink-700/70 pt-2">
        {opening.player && <Avatar color={opening.player.avatar_color} icon={opening.player.avatar_icon} size="xs" />}
        <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-ink-200">{opening.player?.username}</span>
        {opening.is_demo ? <DemoTag /> : <span className="text-[10px] text-ink-400">{timeAgo(opening.opened_at)}</span>}
      </div>
    </Link>
  );
}
