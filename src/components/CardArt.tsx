import { useState, type CSSProperties, type MouseEvent } from 'react';
import { gameMeta } from '../lib/catalog';
import type { GameId } from '../lib/types';

interface Props {
  name: string;
  rarity: string;
  tier: number;
  image: string | null;
  game: GameId;
  className?: string;
  interactive?: boolean;
  rounded?: string;
}

export function CardArt({ name, rarity, tier, image, game, className = '', interactive = false, rounded = 'rounded-[6%/4.3%]' }: Props) {
  const [failed, setFailed] = useState(false);
  const [tilt, setTilt] = useState<CSSProperties>({});
  const holo = tier >= 4;
  const showImage = image && !failed;

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    setTilt({
      transform: `perspective(900px) rotateX(${(0.5 - y) * 14}deg) rotateY(${(x - 0.5) * 16}deg)`,
      ['--holo-x' as string]: `${x * 100}%`,
      ['--holo-opacity' as string]: '0.6',
    });
  };

  return (
    <div
      onMouseMove={onMove}
      onMouseLeave={() => setTilt({})}
      style={{ containerType: 'inline-size', ...tilt }}
      className={`relative aspect-[63/88] overflow-hidden bg-ink-800 transition-transform duration-300 ease-out frame-${Math.min(Math.max(tier, 1), 6)} ${rounded} ${holo ? 'holo' : ''} ${interactive ? 'holo-interactive' : ''} ${className}`}
    >
      {showImage ? (
        <img
          src={image}
          alt={`${name} - ${rarity}`}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <CardPlaceholder name={name} rarity={rarity} tier={tier} game={game} />
      )}
    </div>
  );
}

function CardPlaceholder({ name, rarity, tier, game }: { name: string; rarity: string; tier: number; game: GameId }) {
  const meta = gameMeta(game);
  const initials = name
    .replace(/\(.*\)/, '')
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  return (
    <div
      className="grid-noise flex h-full w-full flex-col justify-between p-[8%]"
      style={{ fontSize: '12cqw', background: `linear-gradient(160deg, ${meta.glow}, #0e121a 55%, #06080c)` }}
    >
      <div className="flex items-center justify-between text-[0.55em] font-bold uppercase tracking-widest" style={{ color: meta.color }}>
        <span>{meta.short}</span>
        <span>{'\u25C6'.repeat(Math.min(tier, 6))}</span>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <span className="font-display text-[2.2em] font-bold leading-none" style={{ color: meta.color, textShadow: `0 0 24px ${meta.glow}` }}>
          {initials || '?'}
        </span>
      </div>
      <div className="min-w-0">
        <p className="line-clamp-2 text-[0.7em] font-bold leading-tight text-ink-50">{name}</p>
        <p className="truncate text-[0.55em] font-semibold text-ink-300">{rarity}</p>
      </div>
    </div>
  );
}
