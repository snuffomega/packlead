import { Crown, Flame, Gem, Ghost, Shield, Star, Swords, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AvatarColor, AvatarIcon, Player } from '../lib/types';

export const AVATAR_COLORS: Record<AvatarColor, string> = {
  teal: 'from-brand-300 to-brand-700',
  gold: 'from-gold-300 to-gold-700',
  coral: 'from-coral-300 to-coral-700',
  sky: 'from-sky-300 to-sky-700',
  lime: 'from-lime-300 to-lime-700',
  rose: 'from-rose-300 to-rose-700',
  amber: 'from-amber-300 to-amber-700',
  emerald: 'from-emerald-300 to-emerald-700',
};

export const AVATAR_ICONS: Record<AvatarIcon, typeof Flame> = {
  flame: Flame,
  zap: Zap,
  crown: Crown,
  gem: Gem,
  star: Star,
  shield: Shield,
  swords: Swords,
  ghost: Ghost,
};

const SIZES = {
  xs: 'h-6 w-6 rounded-md',
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-11 w-11 rounded-xl',
  lg: 'h-16 w-16 rounded-2xl',
  xl: 'h-24 w-24 rounded-3xl',
};
const ICON_SIZES = { xs: 13, sm: 16, md: 20, lg: 28, xl: 40 };

export function Avatar({
  color,
  icon,
  size = 'sm',
}: {
  color: AvatarColor;
  icon: AvatarIcon;
  size?: keyof typeof SIZES;
}) {
  const Icon = AVATAR_ICONS[icon] ?? Flame;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br text-ink-950 shadow-inner ${SIZES[size]} ${AVATAR_COLORS[color] ?? AVATAR_COLORS.teal}`}
      aria-hidden
    >
      <Icon size={ICON_SIZES[size]} strokeWidth={2.4} />
    </span>
  );
}

export function PlayerLink({ player, size = 'xs', className = '' }: { player: Player | null; size?: keyof typeof SIZES; className?: string }) {
  if (!player) return <span className="text-ink-400">Unknown player</span>;
  return (
    <Link
      to={`/u/${player.id}`}
      onClick={(e) => e.stopPropagation()}
      className={`group/player inline-flex min-w-0 items-center gap-2 ${className}`}
    >
      <Avatar color={player.avatar_color} icon={player.avatar_icon} size={size} />
      <span className="truncate font-semibold text-ink-100 transition group-hover/player:text-brand-300">{player.username}</span>
    </Link>
  );
}
