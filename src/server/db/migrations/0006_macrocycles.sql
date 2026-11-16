CREATE TYPE "public"."mesocycle_type" AS ENUM('general_preparation', 'special_preparation', 'competition_preparation');--> statement-breakpoint
CREATE TYPE "public"."week_level" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TABLE "macrocycle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"duration_weeks" smallint NOT NULL,
	"entry_value_pct" numeric(4, 1) NOT NULL,
	"snatch_best_kg" numeric(5, 1) NOT NULL,
	"clean_and_jerk_best_kg" numeric(5, 1) NOT NULL,
	"snatch_goal_kg" numeric(5, 1) NOT NULL,
	"clean_and_jerk_goal_kg" numeric(5, 1) NOT NULL,
	"body_weight_kg" numeric(5, 1) NOT NULL,
	"target_body_weight_kg" numeric(5, 1) NOT NULL,
	"body_fat_pct" numeric(4, 1),
	"muscle_mass_pct" numeric(4, 1),
	"deficits" text NOT NULL,
	"injuries_and_illnesses" text NOT NULL,
	"competition_date" date NOT NULL,
	"competition_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "macrocycle_athlete_id_unique" UNIQUE("athlete_id")
);
--> statement-breakpoint
CREATE TABLE "macrocycle_week" (
	"macrocycle_id" uuid NOT NULL,
	"week_number" smallint NOT NULL,
	"level" "week_level" DEFAULT 'medium' NOT NULL,
	CONSTRAINT "macrocycle_week_macrocycle_id_week_number_pk" PRIMARY KEY("macrocycle_id","week_number")
);
--> statement-breakpoint
CREATE TABLE "mesocycle" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"macrocycle_id" uuid NOT NULL,
	"type" "mesocycle_type" NOT NULL,
	"first_week" smallint NOT NULL,
	"last_week" smallint NOT NULL,
	CONSTRAINT "mesocycle_macrocycle_type_unique" UNIQUE("macrocycle_id","type")
);
--> statement-breakpoint
CREATE TABLE "mesocycle_exercise" (
	"mesocycle_id" uuid NOT NULL,
	"exercise_number" smallint NOT NULL,
	CONSTRAINT "mesocycle_exercise_mesocycle_id_exercise_number_pk" PRIMARY KEY("mesocycle_id","exercise_number")
);
--> statement-breakpoint
ALTER TABLE "macrocycle" ADD CONSTRAINT "macrocycle_athlete_id_athlete_id_fk" FOREIGN KEY ("athlete_id") REFERENCES "public"."athlete"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "macrocycle_week" ADD CONSTRAINT "macrocycle_week_macrocycle_id_macrocycle_id_fk" FOREIGN KEY ("macrocycle_id") REFERENCES "public"."macrocycle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mesocycle" ADD CONSTRAINT "mesocycle_macrocycle_id_macrocycle_id_fk" FOREIGN KEY ("macrocycle_id") REFERENCES "public"."macrocycle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mesocycle_exercise" ADD CONSTRAINT "mesocycle_exercise_mesocycle_id_mesocycle_id_fk" FOREIGN KEY ("mesocycle_id") REFERENCES "public"."mesocycle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mesocycle_exercise" ADD CONSTRAINT "mesocycle_exercise_exercise_number_exercise_number_fk" FOREIGN KEY ("exercise_number") REFERENCES "public"."exercise"("number") ON DELETE no action ON UPDATE no action;