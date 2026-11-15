CREATE TYPE "public"."gender" AS ENUM('female', 'male', 'diverse');--> statement-breakpoint
CREATE TABLE "athlete" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"date_of_birth" date,
	"gender" "gender",
	"career_start_date" date,
	"height_cm" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "team" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coach_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_coach_id_unique" UNIQUE("coach_id")
);
--> statement-breakpoint
ALTER TABLE "athlete" ADD CONSTRAINT "athlete_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_coach_id_user_account_id_fk" FOREIGN KEY ("coach_id") REFERENCES "public"."user_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "athlete_team_id_idx" ON "athlete" USING btree ("team_id");