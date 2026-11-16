-- New macrocycle base data. Existing macrocycles get placeholder values
-- (empty texts, no focus points, 1 session per week) that the coach completes
-- in planning step 1; new macrocycles always provide them.
ALTER TABLE "macrocycle" ADD COLUMN "strengths" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "macrocycle" ADD COLUMN "experience" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "macrocycle" ADD COLUMN "training_frequency" smallint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE "macrocycle" ADD COLUMN "focus_points" text[] NOT NULL DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "macrocycle" ALTER COLUMN "strengths" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "macrocycle" ALTER COLUMN "experience" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "macrocycle" ALTER COLUMN "training_frequency" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "macrocycle" ALTER COLUMN "focus_points" DROP DEFAULT;
