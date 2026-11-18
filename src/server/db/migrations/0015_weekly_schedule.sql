-- Weekly schedule instead of a number of sessions per week. Existing
-- frequencies become a schedule over Monday–Saturday: one session per day
-- first, then second and third sessions from Monday on (8 -> Mon 1+2,
-- Tue 1+2, Wed-Sat). The column is dropped in 0016.
CREATE TABLE "macrocycle_session" (
	"macrocycle_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"slot" smallint NOT NULL,
	CONSTRAINT "macrocycle_session_macrocycle_id_weekday_slot_pk" PRIMARY KEY("macrocycle_id","weekday","slot")
);
--> statement-breakpoint
ALTER TABLE "macrocycle_session" ADD CONSTRAINT "macrocycle_session_macrocycle_id_macrocycle_id_fk" FOREIGN KEY ("macrocycle_id") REFERENCES "public"."macrocycle"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "macrocycle_session" ("macrocycle_id", "weekday", "slot")
SELECT m."id", (g.i % 6) + 1, (g.i / 6) + 1
FROM "macrocycle" m
CROSS JOIN LATERAL generate_series(0, m."training_frequency" - 1) AS g(i);
