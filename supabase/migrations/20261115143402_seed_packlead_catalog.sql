/*
# Seed PackLead card catalog

1. Data
- 8 card sets (2 each for Pokemon, One Piece, Magic: The Gathering, Sports)
- Sealed products per set with demo estimate prices, split by product type
- ~100 cards with rarity, tier (1 common .. 6 chase) and demo estimate values
- Card images: public Pokemon TCG, Scryfall and One Piece official images where available;
  sports and some commons have no image and use designed placeholders in the app

2. Security
- Removes the storage listing policy: the bucket is public, so files are viewable by URL
  without letting anyone enumerate every uploaded file.

3. Notes
1. All prices/values are demo estimates, not live market data.
2. Upserts keep the migration re-runnable.
*/

DROP POLICY IF EXISTS "rip_media_read" ON storage.objects;

INSERT INTO card_sets (id, game, name, code, release_year, sort) VALUES
('pkm-151','pokemon','Scarlet & Violet 151','MEW',2023,1),
('pkm-ssp','pokemon','Surging Sparks','SSP',2024,2),
('op-op05','onepiece','Awakening of the New Era','OP-05',2023,1),
('op-op09','onepiece','Emperors in the New World','OP-09',2024,2),
('mtg-blb','mtg','Bloomburrow','BLB',2024,1),
('mtg-dsk','mtg','Duskmourn: House of Horror','DSK',2024,2),
('sp-tch24','sports','2024 Topps Chrome Baseball','TCH24',2024,1),
('sp-pzm24','sports','2023-24 Panini Prizm Basketball','PZM24',2024,2)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code, release_year = EXCLUDED.release_year, sort = EXCLUDED.sort;

INSERT INTO products (id, set_id, product_type, name, price) VALUES
('pkm-151-pack','pkm-151','booster_pack','Booster Pack',6.00),
('pkm-151-etb','pkm-151','etb','Elite Trainer Box',75.00),
('pkm-151-bundle','pkm-151','other','Booster Bundle (6 packs)',40.00),
('pkm-ssp-pack','pkm-ssp','booster_pack','Booster Pack',4.50),
('pkm-ssp-box','pkm-ssp','booster_box','Booster Box (36 packs)',150.00),
('pkm-ssp-etb','pkm-ssp','etb','Elite Trainer Box',55.00),
('op-op05-pack','op-op05','booster_pack','Booster Pack',8.00),
('op-op05-box','op-op05','booster_box','Booster Box (24 packs)',220.00),
('op-op09-pack','op-op09','booster_pack','Booster Pack',6.00),
('op-op09-box','op-op09','booster_box','Booster Box (24 packs)',150.00),
('op-op09-double','op-op09','other','Double Pack Set',14.00),
('mtg-blb-play','mtg-blb','booster_pack','Play Booster',5.50),
('mtg-blb-collector','mtg-blb','booster_pack','Collector Booster',25.00),
('mtg-blb-box','mtg-blb','booster_box','Play Booster Box (36 packs)',140.00),
('mtg-dsk-play','mtg-dsk','booster_pack','Play Booster',5.00),
('mtg-dsk-box','mtg-dsk','booster_box','Play Booster Box (36 packs)',130.00),
('mtg-dsk-bundle','mtg-dsk','other','Bundle',45.00),
('sp-tch24-pack','sp-tch24','booster_pack','Hobby Pack',20.00),
('sp-tch24-box','sp-tch24','booster_box','Hobby Box (12 packs)',260.00),
('sp-tch24-blaster','sp-tch24','other','Blaster Box',40.00),
('sp-pzm24-pack','sp-pzm24','booster_pack','Hobby Pack',70.00),
('sp-pzm24-box','sp-pzm24','booster_box','Hobby Box (12 packs)',850.00),
('sp-pzm24-blaster','sp-pzm24','other','Blaster Box',50.00)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, price = EXCLUDED.price, product_type = EXCLUDED.product_type;

INSERT INTO cards (id, set_id, name, number, rarity, tier, value, image_url) VALUES
-- Pokemon 151
('pkm-151-1','pkm-151','Bulbasaur','1','Common',1,0.25,'https://images.pokemontcg.io/sv3pt5/1.png'),
('pkm-151-4','pkm-151','Charmander','4','Common',1,0.35,'https://images.pokemontcg.io/sv3pt5/4.png'),
('pkm-151-7','pkm-151','Squirtle','7','Common',1,0.30,'https://images.pokemontcg.io/sv3pt5/7.png'),
('pkm-151-25','pkm-151','Pikachu','25','Common',1,0.50,'https://images.pokemontcg.io/sv3pt5/25.png'),
('pkm-151-94','pkm-151','Gengar','94','Rare',2,0.80,'https://images.pokemontcg.io/sv3pt5/94.png'),
('pkm-151-149','pkm-151','Dragonite','149','Rare',2,0.90,'https://images.pokemontcg.io/sv3pt5/149.png'),
('pkm-151-6','pkm-151','Charizard ex','6','Double Rare',3,6.50,'https://images.pokemontcg.io/sv3pt5/6.png'),
('pkm-151-151','pkm-151','Mew ex','151','Double Rare',3,3.50,'https://images.pokemontcg.io/sv3pt5/151.png'),
('pkm-151-65','pkm-151','Alakazam ex','65','Double Rare',3,2.00,'https://images.pokemontcg.io/sv3pt5/65.png'),
('pkm-151-173','pkm-151','Pikachu','173','Illustration Rare',4,14.00,'https://images.pokemontcg.io/sv3pt5/173.png'),
('pkm-151-170','pkm-151','Squirtle','170','Illustration Rare',4,22.00,'https://images.pokemontcg.io/sv3pt5/170.png'),
('pkm-151-168','pkm-151','Charmander','168','Illustration Rare',4,24.00,'https://images.pokemontcg.io/sv3pt5/168.png'),
('pkm-151-181','pkm-151','Dragonair','181','Illustration Rare',4,12.00,'https://images.pokemontcg.io/sv3pt5/181.png'),
('pkm-151-183','pkm-151','Charizard ex','183','Ultra Rare',5,45.00,'https://images.pokemontcg.io/sv3pt5/183.png'),
('pkm-151-193','pkm-151','Mew ex','193','Ultra Rare',5,28.00,'https://images.pokemontcg.io/sv3pt5/193.png'),
('pkm-151-204','pkm-151','Giovanni''s Charisma','204','Special Illustration Rare',5,32.00,'https://images.pokemontcg.io/sv3pt5/204.png'),
('pkm-151-201','pkm-151','Alakazam ex','201','Special Illustration Rare',5,48.00,'https://images.pokemontcg.io/sv3pt5/201.png'),
('pkm-151-200','pkm-151','Blastoise ex','200','Special Illustration Rare',6,70.00,'https://images.pokemontcg.io/sv3pt5/200.png'),
('pkm-151-205','pkm-151','Mew ex','205','Hyper Rare',6,75.00,'https://images.pokemontcg.io/sv3pt5/205.png'),
('pkm-151-199','pkm-151','Charizard ex','199','Special Illustration Rare',6,210.00,'https://images.pokemontcg.io/sv3pt5/199.png'),
-- Pokemon Surging Sparks
('pkm-ssp-135','pkm-ssp','Dialga','135','Rare',2,0.40,'https://images.pokemontcg.io/sv8/135.png'),
('pkm-ssp-161','pkm-ssp','Terapagos','161','Rare',2,0.50,'https://images.pokemontcg.io/sv8/161.png'),
('pkm-ssp-162','pkm-ssp','Amulet of Hope','162','ACE SPEC Rare',2,1.00,'https://images.pokemontcg.io/sv8/162.png'),
('pkm-ssp-42','pkm-ssp','Milotic ex','42','Double Rare',3,1.20,'https://images.pokemontcg.io/sv8/42.png'),
('pkm-ssp-76','pkm-ssp','Latias ex','76','Double Rare',3,1.50,'https://images.pokemontcg.io/sv8/76.png'),
('pkm-ssp-57','pkm-ssp','Pikachu ex','57','Double Rare',3,3.00,'https://images.pokemontcg.io/sv8/57.png'),
('pkm-ssp-198','pkm-ssp','Feebas','198','Illustration Rare',4,6.00,'https://images.pokemontcg.io/sv8/198.png'),
('pkm-ssp-203','pkm-ssp','Latios','203','Illustration Rare',4,15.00,'https://images.pokemontcg.io/sv8/203.png'),
('pkm-ssp-220','pkm-ssp','Latias ex','220','Ultra Rare',4,9.00,'https://images.pokemontcg.io/sv8/220.png'),
('pkm-ssp-219','pkm-ssp','Pikachu ex','219','Ultra Rare',5,22.00,'https://images.pokemontcg.io/sv8/219.png'),
('pkm-ssp-240','pkm-ssp','Hydreigon ex','240','Special Illustration Rare',5,30.00,'https://images.pokemontcg.io/sv8/240.png'),
('pkm-ssp-247','pkm-ssp','Pikachu ex','247','Hyper Rare',6,70.00,'https://images.pokemontcg.io/sv8/247.png'),
('pkm-ssp-237','pkm-ssp','Milotic ex','237','Special Illustration Rare',6,85.00,'https://images.pokemontcg.io/sv8/237.png'),
('pkm-ssp-239','pkm-ssp','Latias ex','239','Special Illustration Rare',6,95.00,'https://images.pokemontcg.io/sv8/239.png'),
('pkm-ssp-238','pkm-ssp','Pikachu ex','238','Special Illustration Rare',6,260.00,'https://images.pokemontcg.io/sv8/238.png'),
-- One Piece OP-05
('op-op05-c1','op-op05','Nami','','Common',1,0.20,NULL),
('op-op05-c2','op-op05','Usopp','','Common',1,0.20,NULL),
('op-op05-u1','op-op05','Brook','','Uncommon',1,0.40,NULL),
('op-op05-r1','op-op05','Sabo','','Rare',2,1.50,NULL),
('op-op05-060','op-op05','Monkey.D.Luffy','OP05-060','Leader',3,2.50,'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-060.png'),
('op-op05-069','op-op05','Trafalgar Law','OP05-069','Super Rare',4,8.00,'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-069.png'),
('op-op05-118','op-op05','Kaido','OP05-118','Secret Rare',5,30.00,'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-118.png'),
('op-op05-119','op-op05','Monkey.D.Luffy','OP05-119','Secret Rare',6,95.00,'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119.png'),
('op-op05-119m','op-op05','Monkey.D.Luffy (Manga Art)','OP05-119','Manga Rare',6,1800.00,'https://en.onepiece-cardgame.com/images/cardlist/card/OP05-119.png'),
-- One Piece OP-09
('op-op09-c1','op-op09','Roronoa Zoro','','Common',1,0.20,NULL),
('op-op09-c2','op-op09','Nico Robin','','Common',1,0.20,NULL),
('op-op09-u1','op-op09','Benn.Beckman','','Uncommon',1,0.45,NULL),
('op-op09-r1','op-op09','Yasopp','','Rare',2,1.20,NULL),
('op-op09-051','op-op09','Buggy','OP09-051','Super Rare',4,6.00,'https://en.onepiece-cardgame.com/images/cardlist/card/OP09-051.png'),
('op-op09-004','op-op09','Shanks','OP09-004','Super Rare',4,18.00,'https://en.onepiece-cardgame.com/images/cardlist/card/OP09-004.png'),
('op-op09-119','op-op09','Monkey.D.Luffy','OP09-119','Secret Rare',6,70.00,'https://en.onepiece-cardgame.com/images/cardlist/card/OP09-119.png'),
('op-op09-118','op-op09','Gol.D.Roger','OP09-118','Secret Rare',6,110.00,'https://en.onepiece-cardgame.com/images/cardlist/card/OP09-118.png'),
-- MTG Bloomburrow
('mtg-blb-24','mtg-blb','Parting Gust','24','Uncommon',1,0.60,'https://api.scryfall.com/cards/blb/24?format=image&version=normal'),
('mtg-blb-131','mtg-blb','Coruscation Mage','131','Uncommon',2,1.90,'https://api.scryfall.com/cards/blb/131?format=image&version=normal'),
('mtg-blb-52','mtg-blb','Into the Flood Maw','52','Uncommon',2,2.10,'https://api.scryfall.com/cards/blb/52?format=image&version=normal'),
('mtg-blb-247','mtg-blb','Patchwork Banner','247','Uncommon',2,2.40,'https://api.scryfall.com/cards/blb/247?format=image&version=normal'),
('mtg-blb-9','mtg-blb','Dawn''s Truce','9','Rare',3,8.40,'https://api.scryfall.com/cards/blb/9?format=image&version=normal'),
('mtg-blb-180','mtg-blb','Innkeeper''s Talent','180','Rare',3,9.10,'https://api.scryfall.com/cards/blb/180?format=image&version=normal'),
('mtg-blb-230','mtg-blb','Ral, Crackling Wit','230','Mythic Rare',4,10.60,'https://api.scryfall.com/cards/blb/230?format=image&version=normal'),
('mtg-blb-241','mtg-blb','Ygra, Eater of All','241','Mythic Rare',4,11.30,'https://api.scryfall.com/cards/blb/241?format=image&version=normal'),
('mtg-blb-6','mtg-blb','Caretaker''s Talent','6','Rare',4,11.30,'https://api.scryfall.com/cards/blb/6?format=image&version=normal'),
('mtg-blb-100','mtg-blb','Maha, Its Feathers Night','100','Mythic Rare',5,18.60,'https://api.scryfall.com/cards/blb/100?format=image&version=normal'),
('mtg-blb-183','mtg-blb','Lumra, Bellow of the Woods','183','Mythic Rare',5,27.10,'https://api.scryfall.com/cards/blb/183?format=image&version=normal'),
('mtg-blb-260','mtg-blb','Three Tree City','260','Rare',5,28.30,'https://api.scryfall.com/cards/blb/260?format=image&version=normal'),
-- MTG Duskmourn
('mtg-dsk-208','mtg-dsk','Arabella, Abandoned Doll','208','Uncommon',1,0.80,'https://api.scryfall.com/cards/dsk/208?format=image&version=normal'),
('mtg-dsk-247','mtg-dsk','Friendly Teddy','247','Common',1,0.99,'https://api.scryfall.com/cards/dsk/247?format=image&version=normal'),
('mtg-dsk-30','mtg-dsk','Sheltered by Ghosts','30','Uncommon',2,1.20,'https://api.scryfall.com/cards/dsk/30?format=image&version=normal'),
('mtg-dsk-124','mtg-dsk','Withering Torment','124','Uncommon',2,2.40,'https://api.scryfall.com/cards/dsk/124?format=image&version=normal'),
('mtg-dsk-161','mtg-dsk','Untimely Malfunction','161','Uncommon',3,7.70,'https://api.scryfall.com/cards/dsk/161?format=image&version=normal'),
('mtg-dsk-157','mtg-dsk','Screaming Nemesis','157','Mythic Rare',3,8.20,'https://api.scryfall.com/cards/dsk/157?format=image&version=normal'),
('mtg-dsk-220','mtg-dsk','Kaito, Bane of Nightmares','220','Mythic Rare',3,9.00,'https://api.scryfall.com/cards/dsk/220?format=image&version=normal'),
('mtg-dsk-42','mtg-dsk','Abhorrent Oculus','42','Mythic Rare',3,9.00,'https://api.scryfall.com/cards/dsk/42?format=image&version=normal'),
('mtg-dsk-202','mtg-dsk','Tyvar, the Pummeler','202','Mythic Rare',4,11.70,'https://api.scryfall.com/cards/dsk/202?format=image&version=normal'),
('mtg-dsk-260','mtg-dsk','Gloomlake Verge','260','Rare',4,12.30,'https://api.scryfall.com/cards/dsk/260?format=image&version=normal'),
('mtg-dsk-95','mtg-dsk','Enduring Tenacity','95','Rare',4,12.80,'https://api.scryfall.com/cards/dsk/95?format=image&version=normal'),
('mtg-dsk-176','mtg-dsk','Enduring Vitality','176','Rare',4,14.30,'https://api.scryfall.com/cards/dsk/176?format=image&version=normal'),
('mtg-dsk-113','mtg-dsk','Overlord of the Balemurk','113','Mythic Rare',5,21.90,'https://api.scryfall.com/cards/dsk/113?format=image&version=normal'),
('mtg-dsk-120','mtg-dsk','Valgavoth, Terror Eater','120','Mythic Rare',5,23.90,'https://api.scryfall.com/cards/dsk/120?format=image&version=normal'),
-- Sports: Topps Chrome Baseball
('sp-tch24-b1','sp-tch24','Veteran Base','','Base',1,0.30,NULL),
('sp-tch24-b2','sp-tch24','Rookie Base','','Base RC',1,0.75,NULL),
('sp-tch24-judge','sp-tch24','Aaron Judge','','Base',2,1.50,NULL),
('sp-tch24-holliday','sp-tch24','Jackson Holliday','','Base RC',2,2.00,NULL),
('sp-tch24-ohtani','sp-tch24','Shohei Ohtani','','Base',2,2.50,NULL),
('sp-tch24-skenes','sp-tch24','Paul Skenes','','Base RC',3,6.00,NULL),
('sp-tch24-elly','sp-tch24','Elly De La Cruz','','Refractor',3,9.00,NULL),
('sp-tch24-ohtani-ref','sp-tch24','Shohei Ohtani','','Refractor',4,12.00,NULL),
('sp-tch24-caminero','sp-tch24','Junior Caminero','','RC Auto',6,150.00,NULL),
('sp-tch24-skenes-gold','sp-tch24','Paul Skenes','','Gold Refractor /50',6,900.00,NULL),
-- Sports: Prizm Basketball
('sp-pzm24-b1','sp-pzm24','Veteran Base','','Base',1,0.25,NULL),
('sp-pzm24-b2','sp-pzm24','Rookie Base','','Base RC',1,0.60,NULL),
('sp-pzm24-chet','sp-pzm24','Chet Holmgren','','Base',2,2.00,NULL),
('sp-pzm24-scoot','sp-pzm24','Scoot Henderson','','Base RC',2,2.00,NULL),
('sp-pzm24-lebron','sp-pzm24','LeBron James','','Base',2,3.00,NULL),
('sp-pzm24-wemby','sp-pzm24','Victor Wembanyama','','Base RC',4,25.00,NULL),
('sp-pzm24-miller-s','sp-pzm24','Brandon Miller','','Silver Prizm RC',5,30.00,NULL),
('sp-pzm24-curry-s','sp-pzm24','Stephen Curry','','Silver Prizm',5,40.00,NULL),
('sp-pzm24-wemby-s','sp-pzm24','Victor Wembanyama','','Silver Prizm RC',6,180.00,NULL),
('sp-pzm24-wemby-g','sp-pzm24','Victor Wembanyama','','Gold Prizm RC /10',6,4000.00,NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, number = EXCLUDED.number, rarity = EXCLUDED.rarity,
  tier = EXCLUDED.tier, value = EXCLUDED.value, image_url = EXCLUDED.image_url;
