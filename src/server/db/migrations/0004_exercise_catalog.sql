CREATE TYPE "public"."reference_lift" AS ENUM('snatch', 'clean_and_jerk');--> statement-breakpoint
CREATE TABLE "exercise" (
	"number" smallint PRIMARY KEY NOT NULL,
	"group_number" smallint NOT NULL,
	"name_de" text NOT NULL,
	"name_en" text NOT NULL,
	"reference_lift" "reference_lift",
	"best_value_pct" numeric(5, 1),
	"max_weekly_average_weight_pct" numeric(5, 1),
	"min_reps_per_set" smallint,
	"max_reps_per_set" smallint,
	"min_reps_per_week" smallint,
	"max_reps_per_week" smallint,
	"comment_de" text,
	"comment_en" text
);
--> statement-breakpoint
CREATE TABLE "exercise_group" (
	"number" smallint PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name_de" text NOT NULL,
	"name_en" text NOT NULL,
	CONSTRAINT "exercise_group_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "exercise" ADD CONSTRAINT "exercise_group_number_exercise_group_number_fk" FOREIGN KEY ("group_number") REFERENCES "public"."exercise_group"("number") ON DELETE no action ON UPDATE no action;