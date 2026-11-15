import type { GameId, Opening, Period, ProductType } from './types';

export const GAMES: { id: GameId; label: string; short: string; color: string; glow: string }[] = [
  { id: 'pokemon', label: 'Pokemon', short: 'PKM', color: '#f5c242', glow: 'rgba(245,194,66,0.35)' },
  { id: 'onepiece', label: 'One Piece', short: 'OP', color: '#ff5a5f', glow: 'rgba(255,90,95,0.35)' },
  { id: 'mtg', label: 'Magic: The Gathering', short: 'MTG', color: '#46adfa', glow: 'rgba(70,173,250,0.35)' },
  { id: 'sports', label: 'Sports', short: 'SPT', color: '#14e0c2', glow: 'rgba(20,224,194,0.35)' },
];

export function gameMeta(id: GameId) {
  return GAMES.find((g) => g.id === id) ?? GAMES[0];
}

export const PRODUCT_TYPES: { id: ProductType; label: string; plural: string }[] = [
  { id: 'booster_pack', label: 'Booster Pack', plural: 'Booster Packs' },
  { id: 'booster_box', label: 'Booster Box', plural: 'Booster Boxes' },
  { id: 'etb', label: 'Elite Trainer Box', plural: 'ETBs' },
  { id: 'other', label: 'Other Sealed', plural: 'Other Sealed' },
];

export function productTypeMeta(id: ProductType) {
  return PRODUCT_TYPES.find((p) => p.id === id) ?? PRODUCT_TYPES[0];
}

export function productArt(game: GameId, type: ProductType): string {
  return `/products/${type === 'booster_pack' ? 'pack' : 'box'}-${game}.webp`;
}

export const PERIODS: { id: Period; label: string; days: number | null }[] = [
  { id: 'week', label: 'This Week', days: 7 },
  { id: 'month', label: 'This Month', days: 30 },
  { id: 'all', label: 'All Time', days: null },
];

export function periodSince(period: Period): string | null {
  const days = PERIODS.find((p) => p.id === period)?.days;
  if (!days) return null;
  return new Date(Date.now() - days * 86400000).toISOString();
}

export const RARITY_TIERS: Record<number, { label: string; color: string }> = {
  1: { label: 'Common', color: '#8b97ab' },
  2: { label: 'Rare', color: '#b9c2d0' },
  3: { label: 'Holo', color: '#46adfa' },
  4: { label: 'Hit', color: '#14e0c2' },
  5: { label: 'Big Hit', color: '#ff5a5f' },
  6: { label: 'Chase', color: '#f5c242' },
};

export type EvidenceStatus = 'verified' | 'photo' | 'logged';

export function evidenceOf(o: Pick<Opening, 'evidence' | 'video_review'>): EvidenceStatus {
  if (o.video_review === 'approved') return 'verified';
  return o.evidence === 'photo' ? 'photo' : 'logged';
}

export function largeImage(url: string | null): string | null {
  if (!url) return null;
  if (url.includes('images.pokemontcg.io') && !url.includes('_hires')) return url.replace(/\.png$/, '_hires.png');
  if (url.includes('api.scryfall.com')) return url.replace('version=normal', 'version=large');
  return url;
}
