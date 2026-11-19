ALTER TABLE "macrocycle" ADD COLUMN "curve_anchors" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
-- Macrocycles planned with the former S-curve keep an approximation of it:
-- two inner anchors at 1/3 and 2/3 of the cycle, 25 % and 75 % of the way
-- from the entry value to 100 % (see the spline-progression-curve change).
UPDATE "macrocycle" SET "curve_anchors" = jsonb_build_array(
  jsonb_build_object('t', 1::float8 / 3, 'pct', round(("entry_value_pct" + (100 - "entry_value_pct") * 0.25)::numeric, 1)),
  jsonb_build_object('t', 2::float8 / 3, 'pct', round(("entry_value_pct" + (100 - "entry_value_pct") * 0.75)::numeric, 1))
);
