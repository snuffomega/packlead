/*
# PackLead core schema

1. New Tables
- `card_sets` - trading card sets (id, game, name, code, release_year)
- `products` - sealed products per set (id, set_id, product_type, name, price)
  - product_type is one of booster_pack, booster_box, etb, other; each ranks separately
- `cards` - seeded card catalog (id, set_id, name, number, rarity, tier 1-6, value, image_url)
- `players` - lightweight device-based profiles (username, avatar_color, avatar_icon, is_demo)
- `openings` - one logged pack/box opening with denormalized product + best card info,
  server-computed provisional score, evidence status and video review status
- `opening_cards` - cards pulled in an opening (catalog or manual)
- `friend_groups`, `group_members` - private friend leaderboards joined by invite code
- `admin_settings` - holds hashed review passcode; no client access at all

2. Security
- RLS enabled on every table. Public read (SELECT) for anon + authenticated on game data,
  because the leaderboard is intentionally public. admin_settings has no policies/grants.
- Clients may only INSERT players (username + avatar columns). All other writes go through
  SECURITY DEFINER functions that validate input and compute values server-side:
  `log_opening`, `create_group`, `join_group`, `admin_check`, `admin_review`.
- Verified status can only be set by `admin_review` with the correct passcode.
- Storage bucket `rip-media` (public read, anon upload of images/videos up to 50MB, no overwrite/delete).

3. Notes
1. Score formula `packlead_score` is a provisional demo formula, ratio-based per product type.
2. Demo rows are flagged is_demo = true; client-created rows are always is_demo = false.
*/

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS card_sets (
  id text PRIMARY KEY,
  game text NOT NULL CHECK (game IN ('pokemon','onepiece','mtg','sports')),
  name text NOT NULL,
  code text NOT NULL,
  release_year int NOT NULL,
  sort int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  set_id text NOT NULL REFERENCES card_sets(id),
  product_type text NOT NULL CHECK (product_type IN ('booster_pack','booster_box','etb','other')),
  name text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price > 0)
);

CREATE TABLE IF NOT EXISTS cards (
  id text PRIMARY KEY,
  set_id text NOT NULL REFERENCES card_sets(id),
  name text NOT NULL,
  number text,
  rarity text NOT NULL,
  tier int NOT NULL CHECK (tier BETWEEN 1 AND 6),
  value numeric(12,2) NOT NULL CHECK (value >= 0),
  image_url text
);

CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL CHECK (username ~ '^[A-Za-z0-9_]{3,20}$'),
  avatar_color text NOT NULL DEFAULT 'teal' CHECK (avatar_color IN ('teal','gold','coral','sky','lime','rose','amber','emerald')),
  avatar_icon text NOT NULL DEFAULT 'flame' CHECK (avatar_icon IN ('flame','zap','crown','gem','star','shield','swords','ghost')),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS players_username_lower_key ON players (lower(username));

CREATE TABLE IF NOT EXISTS openings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  product_id text NOT NULL REFERENCES products(id),
  set_id text NOT NULL REFERENCES card_sets(id),
  game text NOT NULL,
  product_type text NOT NULL,
  product_name text NOT NULL,
  product_cost numeric(10,2) NOT NULL,
  total_value numeric(12,2) NOT NULL,
  best_value numeric(12,2) NOT NULL,
  best_card_name text NOT NULL,
  best_card_rarity text NOT NULL,
  best_card_tier int NOT NULL DEFAULT 1,
  best_card_image text,
  card_count int NOT NULL,
  score int NOT NULL,
  evidence text NOT NULL DEFAULT 'logged' CHECK (evidence IN ('logged','photo')),
  video_review text NOT NULL DEFAULT 'none' CHECK (video_review IN ('none','pending','approved','rejected')),
  photo_urls text[] NOT NULL DEFAULT '{}',
  video_url text,
  scan_url text,
  is_demo boolean NOT NULL DEFAULT false,
  opened_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX IF NOT EXISTS openings_type_score_idx ON openings (product_type, score DESC);
CREATE INDEX IF NOT EXISTS openings_best_value_idx ON openings (best_value DESC);
CREATE INDEX IF NOT EXISTS openings_opened_at_idx ON openings (opened_at DESC);
CREATE INDEX IF NOT EXISTS openings_player_idx ON openings (player_id);
CREATE INDEX IF NOT EXISTS openings_review_idx ON openings (video_review);

CREATE TABLE IF NOT EXISTS opening_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opening_id uuid NOT NULL REFERENCES openings(id) ON DELETE CASCADE,
  card_id text REFERENCES cards(id),
  name text NOT NULL,
  rarity text NOT NULL,
  tier int NOT NULL DEFAULT 1,
  value numeric(12,2) NOT NULL,
  image_url text,
  quantity int NOT NULL DEFAULT 1,
  is_manual boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS opening_cards_opening_idx ON opening_cards (opening_id);

CREATE TABLE IF NOT EXISTS friend_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  created_by uuid NOT NULL REFERENCES players(id),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id uuid NOT NULL REFERENCES friend_groups(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES players(id),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, player_id)
);
CREATE INDEX IF NOT EXISTS group_members_player_idx ON group_members (player_id);

CREATE TABLE IF NOT EXISTS admin_settings (
  id int PRIMARY KEY CHECK (id = 1),
  passcode_hash text NOT NULL
);

ALTER TABLE card_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE openings ENABLE ROW LEVEL SECURITY;
ALTER TABLE opening_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON admin_settings FROM anon, authenticated;

GRANT SELECT ON card_sets, products, cards, players, openings, opening_cards, friend_groups, group_members TO anon, authenticated;
GRANT INSERT (username, avatar_color, avatar_icon) ON players TO anon, authenticated;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['card_sets','products','cards','players','openings','opening_cards','friend_groups','group_members'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "public_read_%s" ON %I', t, t);
    EXECUTE format('CREATE POLICY "public_read_%s" ON %I FOR SELECT TO anon, authenticated USING (true)', t, t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "create_own_player" ON players;
CREATE POLICY "create_own_player" ON players FOR INSERT TO anon, authenticated WITH CHECK (is_demo = false);

INSERT INTO admin_settings (id, passcode_hash)
VALUES (1, extensions.crypt('packlead-review', extensions.gen_salt('bf')))
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION packlead_score(p_type text, p_cost numeric, p_total numeric, p_best numeric)
RETURNS int
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT round(
    700 * least(1, ln(1 + greatest(p_total, 0) / p_cost) / ln(1 + CASE p_type WHEN 'booster_pack' THEN 40 WHEN 'booster_box' THEN 4 ELSE 6 END))
  + 300 * least(1, ln(1 + greatest(p_best, 0) / p_cost) / ln(1 + CASE p_type WHEN 'booster_pack' THEN 25 WHEN 'booster_box' THEN 2.5 ELSE 3 END))
  )::int;
$$;

CREATE OR REPLACE FUNCTION log_opening(
  p_player_id uuid,
  p_product_id text,
  p_cards jsonb,
  p_photo_urls text[] DEFAULT '{}',
  p_video_url text DEFAULT NULL,
  p_scan_url text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product products%ROWTYPE;
  v_game text;
  v_opening uuid;
  v_item jsonb;
  v_card cards%ROWTYPE;
  v_name text; v_rarity text; v_tier int; v_value numeric; v_image text; v_qty int; v_card_id text;
  v_total numeric := 0;
  v_best numeric := -1;
  v_best_name text; v_best_rarity text; v_best_tier int; v_best_image text;
  v_count int := 0;
  v_pos int := 0;
  v_url text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id = p_player_id AND is_demo = false) THEN
    RAISE EXCEPTION 'Invalid player';
  END IF;
  SELECT * INTO v_product FROM products WHERE id = p_product_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid product'; END IF;
  SELECT game INTO v_game FROM card_sets WHERE id = v_product.set_id;

  IF p_cards IS NULL OR jsonb_typeof(p_cards) <> 'array' OR jsonb_array_length(p_cards) < 1 OR jsonb_array_length(p_cards) > 60 THEN
    RAISE EXCEPTION 'Invalid cards';
  END IF;
  IF coalesce(array_length(p_photo_urls, 1), 0) > 8 THEN RAISE EXCEPTION 'Too many photos'; END IF;
  FOREACH v_url IN ARRAY coalesce(p_photo_urls, '{}') LOOP
    IF v_url !~ '^https://' THEN RAISE EXCEPTION 'Invalid photo'; END IF;
  END LOOP;
  IF p_video_url IS NOT NULL AND p_video_url !~ '^https://' THEN RAISE EXCEPTION 'Invalid video'; END IF;
  IF p_scan_url IS NOT NULL AND p_scan_url !~ '^https://' THEN RAISE EXCEPTION 'Invalid scan'; END IF;

  INSERT INTO openings (player_id, product_id, set_id, game, product_type, product_name, product_cost,
    total_value, best_value, best_card_name, best_card_rarity, card_count, score, evidence, video_review,
    photo_urls, video_url, scan_url, is_demo)
  VALUES (p_player_id, v_product.id, v_product.set_id, v_game, v_product.product_type, v_product.name, v_product.price,
    0, 0, '', '', 0, 0,
    CASE WHEN coalesce(array_length(p_photo_urls, 1), 0) > 0 THEN 'photo' ELSE 'logged' END,
    CASE WHEN p_video_url IS NOT NULL THEN 'pending' ELSE 'none' END,
    coalesce(p_photo_urls, '{}'), p_video_url, p_scan_url, false)
  RETURNING id INTO v_opening;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_cards) LOOP
    v_qty := coalesce((v_item->>'quantity')::int, 1);
    IF v_qty < 1 OR v_qty > 20 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;
    v_card_id := v_item->>'card_id';
    IF v_card_id IS NOT NULL THEN
      SELECT * INTO v_card FROM cards WHERE id = v_card_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Invalid card'; END IF;
      v_name := v_card.name; v_rarity := v_card.rarity; v_tier := v_card.tier; v_value := v_card.value; v_image := v_card.image_url;
    ELSE
      v_name := btrim(coalesce(v_item->>'name', ''));
      v_rarity := btrim(coalesce(v_item->>'rarity', 'Unknown'));
      v_value := coalesce((v_item->>'value')::numeric, 0);
      v_image := v_item->>'image_url';
      IF length(v_name) < 1 OR length(v_name) > 80 OR length(v_rarity) > 40 THEN RAISE EXCEPTION 'Invalid card name'; END IF;
      IF v_value < 0 OR v_value > 100000 THEN RAISE EXCEPTION 'Invalid value'; END IF;
      IF v_image IS NOT NULL AND v_image !~ '^https://' THEN RAISE EXCEPTION 'Invalid image'; END IF;
      v_tier := CASE WHEN v_value >= 100 THEN 6 WHEN v_value >= 30 THEN 5 WHEN v_value >= 10 THEN 4 WHEN v_value >= 3 THEN 3 WHEN v_value >= 1 THEN 2 ELSE 1 END;
    END IF;

    INSERT INTO opening_cards (opening_id, card_id, name, rarity, tier, value, image_url, quantity, is_manual, position)
    VALUES (v_opening, v_card_id, v_name, v_rarity, v_tier, v_value, v_image, v_qty, v_card_id IS NULL, v_pos);
    v_pos := v_pos + 1;
    v_total := v_total + v_value * v_qty;
    v_count := v_count + v_qty;
    IF v_value > v_best THEN
      v_best := v_value; v_best_name := v_name; v_best_rarity := v_rarity; v_best_tier := v_tier; v_best_image := v_image;
    END IF;
  END LOOP;

  UPDATE openings SET
    total_value = v_total, best_value = v_best, best_card_name = v_best_name, best_card_rarity = v_best_rarity,
    best_card_tier = v_best_tier, best_card_image = v_best_image, card_count = v_count,
    score = packlead_score(v_product.product_type, v_product.price, v_total, v_best)
  WHERE id = v_opening;

  RETURN v_opening;
END;
$$;

CREATE OR REPLACE FUNCTION create_group(p_player_id uuid, p_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_code text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id = p_player_id AND is_demo = false) THEN
    RAISE EXCEPTION 'Invalid player';
  END IF;
  IF p_name IS NULL OR length(btrim(p_name)) < 2 OR length(btrim(p_name)) > 40 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;
  LOOP
    v_code := upper(substr(translate(encode(extensions.gen_random_bytes(6), 'base64'), '+/=0O1I', ''), 1, 6));
    EXIT WHEN length(v_code) = 6 AND NOT EXISTS (SELECT 1 FROM friend_groups WHERE code = v_code);
  END LOOP;
  INSERT INTO friend_groups (name, code, created_by) VALUES (btrim(p_name), v_code, p_player_id) RETURNING id INTO v_id;
  INSERT INTO group_members (group_id, player_id) VALUES (v_id, p_player_id);
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION join_group(p_player_id uuid, p_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM players WHERE id = p_player_id AND is_demo = false) THEN
    RAISE EXCEPTION 'Invalid player';
  END IF;
  SELECT id INTO v_id FROM friend_groups WHERE code = upper(btrim(p_code));
  IF v_id IS NULL THEN RAISE EXCEPTION 'Group not found'; END IF;
  INSERT INTO group_members (group_id, player_id) VALUES (v_id, p_player_id) ON CONFLICT DO NOTHING;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_check(p_passcode text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM admin_settings WHERE id = 1 AND passcode_hash = extensions.crypt(coalesce(p_passcode, ''), passcode_hash));
$$;

CREATE OR REPLACE FUNCTION admin_review(p_passcode text, p_opening_id uuid, p_approve boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT admin_check(p_passcode) THEN RAISE EXCEPTION 'Not authorized'; END IF;
  UPDATE openings
  SET video_review = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END, reviewed_at = now()
  WHERE id = p_opening_id AND video_review = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Not pending'; END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION log_opening(uuid, text, jsonb, text[], text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION create_group(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION join_group(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_check(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION admin_review(text, uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION log_opening(uuid, text, jsonb, text[], text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_group(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION join_group(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_check(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_review(text, uuid, boolean) TO anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('rip-media', 'rip-media', true, 52428800,
  ARRAY['image/jpeg','image/png','image/webp','image/heic','image/heif','video/mp4','video/webm','video/quicktime'])
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "rip_media_upload" ON storage.objects;
CREATE POLICY "rip_media_upload" ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'rip-media');

DROP POLICY IF EXISTS "rip_media_read" ON storage.objects;
CREATE POLICY "rip_media_read" ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'rip-media');
