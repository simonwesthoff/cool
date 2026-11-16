-- Any number of own reasons per chosen exercise; an existing note becomes
-- the first own reason. The note column is dropped in 0014.
ALTER TABLE "mesocycle_exercise" ADD COLUMN "own_reasons" text[] NOT NULL DEFAULT '{}';--> statement-breakpoint
UPDATE "mesocycle_exercise" SET "own_reasons" = ARRAY["note"] WHERE "note" IS NOT NULL AND "note" <> '';--> statement-breakpoint
ALTER TABLE "mesocycle_exercise" ALTER COLUMN "own_reasons" DROP DEFAULT;
