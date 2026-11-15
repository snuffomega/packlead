import { supabase } from './supabase';
import { periodSince } from './catalog';
import type {
  AvatarColor,
  AvatarIcon,
  Card,
  CardSet,
  FriendGroup,
  LeaderboardFilters,
  Opening,
  OpeningCard,
  Player,
  Product,
} from './types';

const OPENING_SELECT = '*, player:players(*)';

function fail(context: string, error: unknown): never {
  console.error(context, error);
  throw new Error(context);
}

export async function fetchCatalog(): Promise<{ sets: CardSet[]; products: Product[] }> {
  const [sets, products] = await Promise.all([
    supabase.from('card_sets').select('*').order('sort'),
    supabase.from('products').select('*').order('price'),
  ]);
  if (sets.error || products.error) fail('Could not load the catalog', sets.error ?? products.error);
  return { sets: sets.data as CardSet[], products: products.data as Product[] };
}

export async function fetchCards(setId: string): Promise<Card[]> {
  const { data, error } = await supabase.from('cards').select('*').eq('set_id', setId).order('value', { ascending: false });
  if (error) fail('Could not load cards', error);
  return data as Card[];
}

interface BoardQuery extends LeaderboardFilters {
  hideDemo: boolean;
  sort: 'score' | 'pull';
  limit: number;
}

export async function fetchLeaderboard(q: BoardQuery): Promise<Opening[]> {
  let query = supabase.from('openings').select(OPENING_SELECT);
  if (q.sort === 'score') query = query.eq('product_type', q.productType);
  if (q.game !== 'all') query = query.eq('game', q.game);
  if (q.setId !== 'all') query = query.eq('set_id', q.setId);
  if (q.verifiedOnly) query = query.eq('video_review', 'approved');
  if (q.hideDemo) query = query.eq('is_demo', false);
  const since = periodSince(q.period);
  if (since) query = query.gte('opened_at', since);
  query =
    q.sort === 'score'
      ? query.order('score', { ascending: false }).order('total_value', { ascending: false })
      : query.order('best_value', { ascending: false });
  const { data, error } = await query.limit(q.limit);
  if (error) fail('Could not load the leaderboard', error);
  return data as Opening[];
}

export async function fetchRecent(hideDemo: boolean, limit = 12): Promise<Opening[]> {
  let query = supabase.from('openings').select(OPENING_SELECT).order('opened_at', { ascending: false });
  if (hideDemo) query = query.eq('is_demo', false);
  const { data, error } = await query.limit(limit);
  if (error) fail('Could not load recent openings', error);
  return data as Opening[];
}

export async function fetchTopOpenings(limit: number, hideDemo: boolean): Promise<Opening[]> {
  let query = supabase.from('openings').select(OPENING_SELECT).order('score', { ascending: false });
  if (hideDemo) query = query.eq('is_demo', false);
  const { data, error } = await query.limit(limit);
  if (error) fail('Could not load records', error);
  return data as Opening[];
}

export async function fetchOpening(id: string): Promise<{ opening: Opening; cards: OpeningCard[] } | null> {
  const [o, c] = await Promise.all([
    supabase.from('openings').select(OPENING_SELECT).eq('id', id).maybeSingle(),
    supabase.from('opening_cards').select('*').eq('opening_id', id).order('value', { ascending: false }),
  ]);
  if (o.error || c.error) fail('Could not load this pack', o.error ?? c.error);
  if (!o.data) return null;
  return { opening: o.data as Opening, cards: c.data as OpeningCard[] };
}

export interface RankInfo {
  rank: number;
  total: number;
}

async function rankWithin(o: Opening, opts: { game?: boolean; since?: string | null; verified?: boolean }): Promise<RankInfo> {
  const base = () => {
    let q = supabase.from('openings').select('id', { count: 'exact', head: true }).eq('product_type', o.product_type);
    if (opts.game) q = q.eq('game', o.game);
    if (opts.since) q = q.gte('opened_at', opts.since);
    if (opts.verified) q = q.eq('video_review', 'approved');
    return q;
  };
  const [above, total] = await Promise.all([
    base().or(`score.gt.${o.score},and(score.eq.${o.score},total_value.gt.${o.total_value})`),
    base(),
  ]);
  if (above.error || total.error) fail('Could not load rank', above.error ?? total.error);
  return { rank: (above.count ?? 0) + 1, total: total.count ?? 0 };
}

export async function fetchRanks(o: Opening) {
  const [global, game, week] = await Promise.all([
    rankWithin(o, {}),
    rankWithin(o, { game: true }),
    rankWithin(o, { since: periodSince('week') }),
  ]);
  return { global, game, week };
}

export async function fetchPlayer(id: string): Promise<Player | null> {
  const { data, error } = await supabase.from('players').select('*').eq('id', id).maybeSingle();
  if (error) fail('Could not load player', error);
  return data as Player | null;
}

export async function createPlayer(username: string, avatar_color: AvatarColor, avatar_icon: AvatarIcon): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({ username, avatar_color, avatar_icon })
    .select('*')
    .maybeSingle();
  if (error) {
    if (error.code === '23505') throw new Error('That username is taken. Try another one.');
    fail('Could not create your profile. Please try again.', error);
  }
  if (!data) fail('Could not create your profile. Please try again.', null);
  return data as Player;
}

export async function fetchPlayerOpenings(playerId: string): Promise<Opening[]> {
  const { data, error } = await supabase
    .from('openings')
    .select(OPENING_SELECT)
    .eq('player_id', playerId)
    .order('opened_at', { ascending: false });
  if (error) fail('Could not load openings', error);
  return data as Opening[];
}

export async function fetchPlayerGroups(playerId: string): Promise<(FriendGroup & { member_count: number })[]> {
  const { data, error } = await supabase
    .from('group_members')
    .select('group:friend_groups(*, group_members(count))')
    .eq('player_id', playerId);
  if (error) fail('Could not load groups', error);
  return (data as unknown as { group: FriendGroup & { group_members: { count: number }[] } }[])
    .filter((r) => r.group)
    .map((r) => ({ ...r.group, member_count: r.group.group_members?.[0]?.count ?? 0 }));
}

export async function fetchGroup(id: string): Promise<{ group: FriendGroup; members: Player[]; openings: Opening[] } | null> {
  const g = await supabase.from('friend_groups').select('*').eq('id', id).maybeSingle();
  if (g.error) fail('Could not load group', g.error);
  if (!g.data) return null;
  const m = await supabase.from('group_members').select('player:players(*)').eq('group_id', id);
  if (m.error) fail('Could not load members', m.error);
  const members = (m.data as unknown as { player: Player | null }[]).map((r) => r.player).filter(Boolean) as Player[];
  const ids = members.map((p) => p.id);
  const o = ids.length
    ? await supabase.from('openings').select(OPENING_SELECT).in('player_id', ids).order('score', { ascending: false })
    : { data: [], error: null };
  if (o.error) fail('Could not load group openings', o.error);
  return { group: g.data as FriendGroup, members, openings: o.data as Opening[] };
}

export async function createGroup(playerId: string, name: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_group', { p_player_id: playerId, p_name: name });
  if (error || !data) fail('Could not create the group. Please try again.', error);
  return data as string;
}

export async function joinGroup(playerId: string, code: string): Promise<string> {
  const { data, error } = await supabase.rpc('join_group', { p_player_id: playerId, p_code: code });
  if (error || !data) {
    if (error?.message?.includes('Group not found')) throw new Error('No group found with that code.');
    fail('Could not join the group. Please try again.', error);
  }
  return data as string;
}

export interface PulledCardInput {
  card_id?: string;
  name?: string;
  rarity?: string;
  value?: number;
  image_url?: string | null;
  quantity: number;
}

export async function logOpening(args: {
  playerId: string;
  productId: string;
  cards: PulledCardInput[];
  photoUrls: string[];
  videoUrl: string | null;
  scanUrl: string | null;
}): Promise<string> {
  const { data, error } = await supabase.rpc('log_opening', {
    p_player_id: args.playerId,
    p_product_id: args.productId,
    p_cards: args.cards,
    p_photo_urls: args.photoUrls,
    p_video_url: args.videoUrl,
    p_scan_url: args.scanUrl,
  });
  if (error || !data) fail('Could not save your opening. Please try again.', error);
  return data as string;
}

export async function uploadMedia(file: File | Blob, folder: 'photos' | 'videos' | 'scans' | 'cards'): Promise<string> {
  const type = file.type || 'image/jpeg';
  const ext = type.split('/')[1]?.replace('quicktime', 'mov').replace('jpeg', 'jpg') ?? 'bin';
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('rip-media').upload(path, file, { contentType: type, upsert: false });
  if (error) fail('Upload failed. Check the file type and size (max 50MB).', error);
  return supabase.storage.from('rip-media').getPublicUrl(path).data.publicUrl;
}

export async function adminCheck(passcode: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('admin_check', { p_passcode: passcode });
  if (error) fail('Could not check the passcode', error);
  return data === true;
}

export async function adminReview(passcode: string, openingId: string, approve: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_review', { p_passcode: passcode, p_opening_id: openingId, p_approve: approve });
  if (error) fail('Could not save the review decision', error);
}

export async function fetchPendingReviews(): Promise<Opening[]> {
  const { data, error } = await supabase
    .from('openings')
    .select(OPENING_SELECT)
    .eq('video_review', 'pending')
    .order('opened_at', { ascending: true });
  if (error) fail('Could not load the review queue', error);
  return data as Opening[];
}
