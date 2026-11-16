-- Deficits per lift and reason tags (acceptance feedback).
-- Existing deficits become the other deficits; snatch, clean and jerk
-- deficits start empty and are completed in planning step 1. An existing
-- reason becomes the note of the choice. The old columns are dropped in 0010.
CREATE TABLE "exercise_addresses" (
	"exercise_number" smallint NOT NULL,
	"tag" text NOT NULL,
	"position" smallint NOT NULL,
	CONSTRAINT "exercise_addresses_exercise_number_tag_pk" PRIMARY KEY("exercise_number","tag")
);
--> statement-breakpoint
CREATE TABLE "exercise_tag" (
	"name_de" text PRIMARY KEY NOT NULL,
	"name_en" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "macrocycle" ADD COLUMN "snatch_deficits" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "macrocycle" ADD COLUMN "clean_deficits" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "macrocycle" ADD COLUMN "jerk_deficits" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "macrocycle" ADD COLUMN "other_deficits" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "mesocycle_exercise" ADD COLUMN "tags" text[] NOT NULL DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "mesocycle_exercise" ADD COLUMN "note" text;--> statement-breakpoint
ALTER TABLE "exercise_addresses" ADD CONSTRAINT "exercise_addresses_exercise_number_exercise_number_fk" FOREIGN KEY ("exercise_number") REFERENCES "public"."exercise"("number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_addresses" ADD CONSTRAINT "exercise_addresses_tag_exercise_tag_name_de_fk" FOREIGN KEY ("tag") REFERENCES "public"."exercise_tag"("name_de") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
UPDATE "macrocycle" SET "other_deficits" = "deficits";--> statement-breakpoint
UPDATE "mesocycle_exercise" SET "note" = NULLIF("reason", '');--> statement-breakpoint
ALTER TABLE "macrocycle" ALTER COLUMN "snatch_deficits" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "macrocycle" ALTER COLUMN "clean_deficits" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "macrocycle" ALTER COLUMN "jerk_deficits" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "macrocycle" ALTER COLUMN "other_deficits" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "mesocycle_exercise" ALTER COLUMN "tags" DROP DEFAULT;
