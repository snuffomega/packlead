/*
# Widen provisional score curve

1. Changes
- `packlead_score` now uses wider "jackpot" multiples per product type so top openings rarely
  tie at 1000: booster_pack (total 400x, best card 250x), booster_box (15x, 10x),
  etb/other (20x, 12x).
- Recomputes the score of every existing opening with the updated formula.

2. Security
- No permission changes.
*/

CREATE OR REPLACE FUNCTION packlead_score(p_type text, p_cost numeric, p_total numeric, p_best numeric)
RETURNS int
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT round(
    700 * least(1, ln(1 + greatest(p_total, 0) / p_cost) / ln(1 + CASE p_type WHEN 'booster_pack' THEN 400 WHEN 'booster_box' THEN 15 ELSE 20 END))
  + 300 * least(1, ln(1 + greatest(p_best, 0) / p_cost) / ln(1 + CASE p_type WHEN 'booster_pack' THEN 250 WHEN 'booster_box' THEN 10 ELSE 12 END))
  )::int;
$$;

UPDATE openings SET score = packlead_score(product_type, product_cost, total_value, best_value);
