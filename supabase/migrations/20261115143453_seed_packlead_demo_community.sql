/*
# Seed PackLead demo community

1. Data
- 18 demo players (is_demo = true)
- 6 hand-picked marquee openings plus 66 generated openings across all games and product types,
  spread over the last ~120 days, with a mix of Logged, Photo Evidence, Verified (approved video),
  pending review and one rejected review
- 2 demo friend groups (invite codes FRIDAY and SHOP42) with demo members

2. Security
- No schema or permission changes.

3. Notes
1. All seeded rows are flagged is_demo = true so the app labels them "Demo" and can hide them.
2. Generation uses setseed for repeatable output, and the block is skipped if demo players exist.
3. Scores use the same packlead_score function as real submissions.
*/

DO $$
DECLARE
  v_names text[] := ARRAY['VaultHunter','HoloQueen','PullStrategist','MintCondition','SleeveKing','GradeTen','RipCityRae','BoosterBaron','FoilFiend','ChaseCardCam','PackPilot','NamiNavigator','GoldStarGabe','BlackLotusLiv','TopLoaderTom','SlabSeeker','ShinyHunterKai','WaxBreakerJ'];
  v_colors text[] := ARRAY['teal','gold','coral','sky','lime','rose','amber','emerald'];
  v_icons text[] := ARRAY['flame','zap','crown','gem','star','shield','swords','ghost'];
  v_photos text[] := ARRAY[
    'https://images.pexels.com/photos/7708401/pexels-photo-7708401.jpeg?auto=compress&cs=tinysrgb&w=940',
    'https://images.pexels.com/photos/9343494/pexels-photo-9343494.jpeg?auto=compress&cs=tinysrgb&w=940',
    'https://images.pexels.com/photos/7708408/pexels-photo-7708408.jpeg?auto=compress&cs=tinysrgb&w=940',
    'https://images.pexels.com/photos/7708407/pexels-photo-7708407.jpeg?auto=compress&cs=tinysrgb&w=940',
    'https://images.pexels.com/photos/7708411/pexels-photo-7708411.jpeg?auto=compress&cs=tinysrgb&w=940',
    'https://images.pexels.com/photos/7708409/pexels-photo-7708409.jpeg?auto=compress&cs=tinysrgb&w=940'];
  v_marquee jsonb := '[
    {"p":"VaultHunter","prod":"pkm-151-pack","cards":["pkm-151-199","pkm-151-25","pkm-151-94","pkm-151-4"],"days":4,"ev":"approved"},
    {"p":"NamiNavigator","prod":"op-op05-pack","cards":["op-op05-119m","op-op05-c1","op-op05-u1","op-op05-r1"],"days":19,"ev":"approved"},
    {"p":"GoldStarGabe","prod":"sp-tch24-pack","cards":["sp-tch24-skenes-gold","sp-tch24-b1","sp-tch24-b2","sp-tch24-judge"],"days":2,"ev":"photo"},
    {"p":"HoloQueen","prod":"pkm-ssp-pack","cards":["pkm-ssp-238","pkm-ssp-135","pkm-ssp-42"],"days":1,"ev":"pending"},
    {"p":"SlabSeeker","prod":"sp-pzm24-box","cards":["sp-pzm24-wemby-g","sp-pzm24-wemby","sp-pzm24-miller-s","sp-pzm24-lebron","sp-pzm24-chet","sp-pzm24-scoot","sp-pzm24-b1","sp-pzm24-b2"],"days":70,"ev":"approved"},
    {"p":"BlackLotusLiv","prod":"mtg-blb-collector","cards":["mtg-blb-260","mtg-blb-183","mtg-blb-6","mtg-blb-9"],"days":9,"ev":"photo"}
  ]';
  v_m jsonb;
  i int;
  v_player uuid;
  v_product products%ROWTYPE;
  v_game text;
  v_opening uuid;
  v_card_ids text[];
  v_n int;
  v_r double precision;
  v_ev text;
  v_review text;
  v_days double precision;
  v_g1 uuid; v_g2 uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM players WHERE is_demo) THEN RETURN; END IF;
  PERFORM setseed(0.42);

  FOR i IN 1..array_length(v_names, 1) LOOP
    INSERT INTO players (username, avatar_color, avatar_icon, is_demo, created_at)
    VALUES (v_names[i], v_colors[1 + (i * 3) % 8], v_icons[1 + (i * 5) % 8], true, now() - interval '150 days');
  END LOOP;

  FOR i IN 1..(6 + 66) LOOP
    IF i <= 6 THEN
      v_m := v_marquee -> (i - 1);
      SELECT id INTO v_player FROM players WHERE username = v_m->>'p';
      SELECT * INTO v_product FROM products WHERE id = v_m->>'prod';
      SELECT array_agg(x) INTO v_card_ids FROM jsonb_array_elements_text(v_m->'cards') x;
      v_days := (v_m->>'days')::double precision + 0.3;
      v_review := CASE v_m->>'ev' WHEN 'approved' THEN 'approved' WHEN 'pending' THEN 'pending' ELSE 'none' END;
      v_ev := CASE WHEN v_m->>'ev' IN ('photo','approved') THEN 'photo' ELSE 'logged' END;
    ELSE
      SELECT id INTO v_player FROM players WHERE is_demo ORDER BY random() LIMIT 1;
      v_r := random();
      SELECT * INTO v_product FROM products
      WHERE (v_r < 0.6 AND product_type = 'booster_pack') OR (v_r >= 0.6 AND product_type <> 'booster_pack')
      ORDER BY random() LIMIT 1;
      v_n := CASE v_product.product_type
        WHEN 'booster_pack' THEN 3 + floor(random() * 3)::int
        WHEN 'booster_box' THEN 10 + floor(random() * 7)::int
        ELSE 5 + floor(random() * 5)::int END;
      SELECT array_agg(id) INTO v_card_ids FROM (
        SELECT id FROM cards WHERE set_id = v_product.set_id
        ORDER BY -ln(greatest(random(), 1e-9)) / (CASE v_product.product_type
          WHEN 'booster_pack' THEN (ARRAY[50,25,10,4,1.5,0.4])[tier]
          WHEN 'booster_box' THEN (ARRAY[30,25,20,10,4,1.2])[tier]
          ELSE (ARRAY[40,25,15,6,2,0.6])[tier] END)
        LIMIT v_n
      ) s;
      v_days := power(random(), 1.6) * 120 + 0.05;
      v_r := random();
      v_ev := CASE WHEN v_r < 0.42 THEN 'logged' ELSE 'photo' END;
      v_review := CASE WHEN v_r >= 0.8 THEN 'approved' ELSE 'none' END;
      IF i IN (20, 41) THEN v_review := 'pending'; END IF;
      IF i = 33 THEN v_review := 'rejected'; END IF;
    END IF;

    SELECT game INTO v_game FROM card_sets WHERE id = v_product.set_id;

    INSERT INTO openings (player_id, product_id, set_id, game, product_type, product_name, product_cost,
      total_value, best_value, best_card_name, best_card_rarity, card_count, score, evidence, video_review,
      photo_urls, is_demo, opened_at, reviewed_at)
    VALUES (v_player, v_product.id, v_product.set_id, v_game, v_product.product_type, v_product.name, v_product.price,
      0, 0, '', '', 0, 0, v_ev, v_review,
      CASE WHEN v_ev = 'photo' THEN ARRAY[v_photos[1 + (i % 6)], v_photos[1 + ((i + 2) % 6)]] ELSE '{}' END,
      true, now() - make_interval(secs => v_days * 86400),
      CASE WHEN v_review IN ('approved','rejected') THEN now() - make_interval(secs => greatest(v_days - 1, 0.01) * 86400) END)
    RETURNING id INTO v_opening;

    INSERT INTO opening_cards (opening_id, card_id, name, rarity, tier, value, image_url, quantity, is_manual, position)
    SELECT v_opening, c.id, c.name, c.rarity, c.tier, c.value, c.image_url,
      CASE WHEN c.tier = 1 AND v_product.product_type <> 'booster_pack' THEN 2 ELSE 1 END, false, ord::int - 1
    FROM unnest(v_card_ids) WITH ORDINALITY AS u(cid, ord)
    JOIN cards c ON c.id = u.cid;

    UPDATE openings o SET
      total_value = s.total, card_count = s.cnt,
      best_value = b.value, best_card_name = b.name, best_card_rarity = b.rarity, best_card_tier = b.tier, best_card_image = b.image_url,
      score = packlead_score(o.product_type, o.product_cost, s.total, b.value)
    FROM (SELECT sum(value * quantity) AS total, sum(quantity)::int AS cnt FROM opening_cards WHERE opening_id = v_opening) s,
         (SELECT value, name, rarity, tier, image_url FROM opening_cards WHERE opening_id = v_opening ORDER BY value DESC LIMIT 1) b
    WHERE o.id = v_opening;
  END LOOP;

  INSERT INTO friend_groups (name, code, created_by, is_demo)
  VALUES ('Friday Night Rips', 'FRIDAY', (SELECT id FROM players WHERE username = 'VaultHunter'), true)
  RETURNING id INTO v_g1;
  INSERT INTO friend_groups (name, code, created_by, is_demo)
  VALUES ('Card Shop Crew', 'SHOP42', (SELECT id FROM players WHERE username = 'BoosterBaron'), true)
  RETURNING id INTO v_g2;

  INSERT INTO group_members (group_id, player_id)
  SELECT v_g1, id FROM players WHERE username IN ('VaultHunter','HoloQueen','PackPilot','FoilFiend','GradeTen','NamiNavigator');
  INSERT INTO group_members (group_id, player_id)
  SELECT v_g2, id FROM players WHERE username IN ('BoosterBaron','SlabSeeker','GoldStarGabe','TopLoaderTom','BlackLotusLiv');
END $$;
