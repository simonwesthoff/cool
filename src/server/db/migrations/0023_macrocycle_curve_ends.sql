ALTER TABLE "macrocycle" ADD COLUMN "curve_entry_t" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "macrocycle" ADD COLUMN "curve_end_pct" numeric(4, 1) DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE "macrocycle" ADD COLUMN "curve_end_t" double precision DEFAULT 1 NOT NULL;