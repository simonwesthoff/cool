-- Variation and reason of each chosen exercise. Existing choices get an empty
-- reason that the coach completes in planning step 3; new choices always
-- provide one.
ALTER TABLE "mesocycle_exercise" ADD COLUMN "variation" text;--> statement-breakpoint
ALTER TABLE "mesocycle_exercise" ADD COLUMN "reason" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "mesocycle_exercise" ALTER COLUMN "reason" DROP DEFAULT;
