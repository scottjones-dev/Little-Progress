CREATE TABLE "entry" (
	"child_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"family_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"kind" text NOT NULL,
	"logged_by_carer_id" uuid,
	"logged_by_user_id" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"timezone" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "entry_child_id_client_id_unique" UNIQUE("child_id","client_id"),
	CONSTRAINT "entry_logged_by_one" CHECK (("logged_by_user_id" is not null) <> ("logged_by_carer_id" is not null)),
	CONSTRAINT "entry_kind_valid" CHECK ("kind" in ('meal', 'sleep', 'nappy', 'milk', 'milestone'))
);
--> statement-breakpoint
CREATE TABLE "meal_trial" (
	"amount" text,
	"attempt_number" integer DEFAULT 1 NOT NULL,
	"distractions" text[] DEFAULT '{}'::text[] NOT NULL,
	"entry_id" uuid PRIMARY KEY,
	"fed_by" text,
	"food_id" uuid NOT NULL,
	"note" text,
	"preparation" text NOT NULL,
	"reaction" text NOT NULL,
	"setting" text,
	"temperature" text NOT NULL,
	CONSTRAINT "meal_trial_attempt_positive" CHECK ("attempt_number" >= 1)
);
--> statement-breakpoint
CREATE TABLE "milestone" (
	"category" text NOT NULL,
	"entry_id" uuid PRIMARY KEY,
	"text" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "milk" (
	"amount_ml" integer,
	"duration_minutes" integer,
	"entry_id" uuid PRIMARY KEY,
	"kind" text
);
--> statement-breakpoint
CREATE TABLE "nappy" (
	"entry_id" uuid PRIMARY KEY,
	"type" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sleep" (
	"ended_at" timestamp with time zone,
	"entry_id" uuid PRIMARY KEY,
	"started_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sleep_end_after_start" CHECK ("ended_at" is null or "ended_at" > "started_at")
);
--> statement-breakpoint
CREATE TABLE "carer" (
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"display_name" text NOT NULL,
	"family_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "child" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"date_of_birth" date NOT NULL,
	"family_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"timezone" text DEFAULT 'Europe/London' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_id_family_id_unique" UNIQUE("id","family_id")
);
--> statement-breakpoint
CREATE TABLE "family" (
	"carer_pin_hash" text,
	"carer_pin_version" text DEFAULT '1' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"join_code" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "food" (
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"family_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	CONSTRAINT "food_family_id_name_unique" UNIQUE("family_id","name")
);
--> statement-breakpoint
CREATE INDEX "entry_child_id_occurred_at_index" ON "entry" ("child_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "entry_child_id_kind_occurred_at_index" ON "entry" ("child_id","kind","occurred_at");--> statement-breakpoint
CREATE INDEX "meal_trial_food_id_index" ON "meal_trial" ("food_id");--> statement-breakpoint
CREATE INDEX "carer_family_id_index" ON "carer" ("family_id");--> statement-breakpoint
CREATE INDEX "child_family_id_index" ON "child" ("family_id");--> statement-breakpoint
CREATE INDEX "food_family_id_index" ON "food" ("family_id");--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_family_id_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_logged_by_carer_id_carer_id_fkey" FOREIGN KEY ("logged_by_carer_id") REFERENCES "carer"("id");--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_child_id_family_id_child_id_family_id_fkey" FOREIGN KEY ("child_id","family_id") REFERENCES "child"("id","family_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "meal_trial" ADD CONSTRAINT "meal_trial_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "meal_trial" ADD CONSTRAINT "meal_trial_food_id_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food"("id");--> statement-breakpoint
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "milk" ADD CONSTRAINT "milk_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "nappy" ADD CONSTRAINT "nappy_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sleep" ADD CONSTRAINT "sleep_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "carer" ADD CONSTRAINT "carer_family_id_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "child" ADD CONSTRAINT "child_family_id_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "food" ADD CONSTRAINT "food_family_id_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE;