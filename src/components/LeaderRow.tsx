import { useNavigate } from 'react-router-dom';
import { gameMeta } from '../lib/catalog';
import { useCatalog } from '../lib/catalogContext';
import { money, timeAgo } from '../lib/format';
import type { Opening } from '../lib/types';
import { PlayerLink } from './Avatar';
import { DemoTag, EvidenceBadge, PendingBadge } from './Badges';
import { CardArt } from './CardArt';

const RANK_STYLES: Record<number, string> = {
  1: 'text-gold-300 drop-shadow-[0_0_10px_rgba(245,194,66,0.6)]',
  2: 'text-ink-100',
  3: 'text-amber-500',
};

export function LeaderRow({
  opening,
  rank,
  metric = 'score',
  highlight = false,
  delay = 0,
}: {
  opening: Opening;
  rank?: number;
  metric?: 'score' | 'pull';
  highlight?: boolean;
  delay?: number;
}) {
  const navigate = useNavigate();
  const { setById } = useCatalog();
  const set = setById(opening.set_id);
  const go = () => navigate(`/pack/${opening.id}`);

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), go())}
      style={{ animationDelay: `${delay}ms` }}
      className={`group flex animate-fade-up cursor-pointer items-center gap-3 rounded-2xl border px-3 py-2.5 transition duration-200 hover:-translate-y-0.5 hover:border-ink-500 hover:bg-ink-800 sm:gap-4 sm:px-4 ${
        highlight ? 'border-brand-400/60 bg-brand-400/10' : 'border-ink-700/70 bg-ink-850/70'
      }`}
    >
      {rank !== undefined && (
        <span className={`score-num w-7 shrink-0 text-center text-xl sm:w-9 sm:text-2xl ${RANK_STYLES[rank] ?? 'text-ink-400'}`}>{rank}</span>
      )}
      <div className="w-11 shrink-0 sm:w-12">
        <CardArt
          name={opening.best_card_name}
          rarity={opening.best_card_rarity}
          tier={opening.best_card_tier}
          image={opening.best_card_image}
          game={opening.game}
          rounded="rounded-md"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-semibold text-ink-50 sm:text-[15px]">{opening.best_card_name}</p>
          <span className="shrink-0 text-xs font-semibold text-gold-300">{money(opening.best_value)}</span>
        </div>
        <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs">
          <PlayerLink player={opening.player} />
          {opening.is_demo && <DemoTag />}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-ink-400">
          <span style={{ color: gameMeta(opening.game).color }}>{gameMeta(opening.game).short}</span>
          {' / '}
          {set?.name ?? opening.set_id} / {opening.product_name} / {timeAgo(opening.opened_at)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        {metric === 'score' ? (
          <span className="score-num text-2xl leading-none text-ink-50 sm:text-3xl">{opening.score}</span>
        ) : (
          <span className="score-num text-xl leading-none text-gold-300 sm:text-2xl">{money(opening.best_value)}</span>
        )}
        {opening.video_review === 'pending' ? <PendingBadge compact /> : <EvidenceBadge opening={opening} compact />}
      </div>
    </div>
  );
}
