CREATE TABLE "session_exercise" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"exercise_number" smallint NOT NULL,
	"note" text,
	CONSTRAINT "session_exercise_unique" UNIQUE("session_id","exercise_number")
);
--> statement-breakpoint
CREATE TABLE "set_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_exercise_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"sets" smallint NOT NULL,
	"reps" smallint NOT NULL,
	"weight_kg" numeric(4, 1)
);
--> statement-breakpoint
CREATE TABLE "training_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"week_plan_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"slot" smallint NOT NULL,
	CONSTRAINT "training_session_day_slot_unique" UNIQUE("week_plan_id","weekday","slot")
);
--> statement-breakpoint
CREATE TABLE "week_plan" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"macrocycle_id" uuid NOT NULL,
	"week_number" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "week_plan_macrocycle_week_unique" UNIQUE("macrocycle_id","week_number")
);
--> statement-breakpoint
ALTER TABLE "session_exercise" ADD CONSTRAINT "session_exercise_session_id_training_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."training_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_exercise" ADD CONSTRAINT "session_exercise_exercise_number_exercise_number_fk" FOREIGN KEY ("exercise_number") REFERENCES "public"."exercise"("number") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "set_group" ADD CONSTRAINT "set_group_session_exercise_id_session_exercise_id_fk" FOREIGN KEY ("session_exercise_id") REFERENCES "public"."session_exercise"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_session" ADD CONSTRAINT "training_session_week_plan_id_week_plan_id_fk" FOREIGN KEY ("week_plan_id") REFERENCES "public"."week_plan"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "week_plan" ADD CONSTRAINT "week_plan_macrocycle_id_macrocycle_id_fk" FOREIGN KEY ("macrocycle_id") REFERENCES "public"."macrocycle"("id") ON DELETE cascade ON UPDATE no action;