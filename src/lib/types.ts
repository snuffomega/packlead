export type GameId = 'pokemon' | 'onepiece' | 'mtg' | 'sports';
export type ProductType = 'booster_pack' | 'booster_box' | 'etb' | 'other';
export type Period = 'week' | 'month' | 'all';
export type AvatarColor = 'teal' | 'gold' | 'coral' | 'sky' | 'lime' | 'rose' | 'amber' | 'emerald';
export type AvatarIcon = 'flame' | 'zap' | 'crown' | 'gem' | 'star' | 'shield' | 'swords' | 'ghost';
export type VideoReview = 'none' | 'pending' | 'approved' | 'rejected';

export interface Player {
  id: string;
  username: string;
  avatar_color: AvatarColor;
  avatar_icon: AvatarIcon;
  is_demo: boolean;
  created_at: string;
}

export interface CardSet {
  id: string;
  game: GameId;
  name: string;
  code: string;
  release_year: number;
  sort: number;
}

export interface Product {
  id: string;
  set_id: string;
  product_type: ProductType;
  name: string;
  price: number;
}

export interface Card {
  id: string;
  set_id: string;
  name: string;
  number: string | null;
  rarity: string;
  tier: number;
  value: number;
  image_url: string | null;
}

export interface Opening {
  id: string;
  player_id: string;
  product_id: string;
  set_id: string;
  game: GameId;
  product_type: ProductType;
  product_name: string;
  product_cost: number;
  total_value: number;
  best_value: number;
  best_card_name: string;
  best_card_rarity: string;
  best_card_tier: number;
  best_card_image: string | null;
  card_count: number;
  score: number;
  evidence: 'logged' | 'photo';
  video_review: VideoReview;
  photo_urls: string[];
  video_url: string | null;
  scan_url: string | null;
  is_demo: boolean;
  opened_at: string;
  player: Player | null;
}

export interface OpeningCard {
  id: string;
  opening_id: string;
  card_id: string | null;
  name: string;
  rarity: string;
  tier: number;
  value: number;
  image_url: string | null;
  quantity: number;
  is_manual: boolean;
  position: number;
}

export interface FriendGroup {
  id: string;
  name: string;
  code: string;
  created_by: string;
  is_demo: boolean;
  created_at: string;
}

export interface LeaderboardFilters {
  productType: ProductType;
  game: GameId | 'all';
  setId: string | 'all';
  period: Period;
  verifiedOnly: boolean;
}
