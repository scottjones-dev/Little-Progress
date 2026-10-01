CREATE TABLE "attachment" (
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_carer_id" uuid,
	"created_by_user_id" text,
	"entry_id" uuid,
	"family_id" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"key" text NOT NULL UNIQUE,
	"size" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "attachment_created_by_one" CHECK (("created_by_user_id" is not null) <> ("created_by_carer_id" is not null)),
	CONSTRAINT "attachment_size_positive" CHECK ("size" > 0)
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitation" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member" (
	"id" text PRIMARY KEY,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text,
	"carer_pin_hash" text,
	"carer_pin_version" integer DEFAULT 1,
	"join_code" text UNIQUE
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY,
	"key" text NOT NULL UNIQUE,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false,
	"last_login_method" text,
	"locale" text
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry" (
	"child_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"family_id" text NOT NULL,
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
	"family_id" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "child" (
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"date_of_birth" date NOT NULL,
	"family_id" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	"timezone" text DEFAULT 'Europe/London' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "child_id_family_id_unique" UNIQUE("id","family_id")
);
--> statement-breakpoint
CREATE TABLE "food" (
	"category" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"family_id" text NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"name" text NOT NULL,
	CONSTRAINT "food_family_id_name_unique" UNIQUE("family_id","name")
);
--> statement-breakpoint
CREATE INDEX "attachment_family_id_index" ON "attachment" ("family_id");--> statement-breakpoint
CREATE INDEX "attachment_entry_id_index" ON "attachment" ("entry_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" ("user_id");--> statement-breakpoint
CREATE INDEX "invitation_organizationId_idx" ON "invitation" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitation_email_idx" ON "invitation" ("email");--> statement-breakpoint
CREATE INDEX "member_organizationId_idx" ON "member" ("organization_id");--> statement-breakpoint
CREATE INDEX "member_userId_idx" ON "member" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_uidx" ON "organization" ("slug");--> statement-breakpoint
CREATE INDEX "passkey_userId_idx" ON "passkey" ("user_id");--> statement-breakpoint
CREATE INDEX "passkey_credentialID_idx" ON "passkey" ("credential_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "two_factor" ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "two_factor" ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");--> statement-breakpoint
CREATE INDEX "entry_child_id_occurred_at_index" ON "entry" ("child_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "entry_child_id_kind_occurred_at_index" ON "entry" ("child_id","kind","occurred_at");--> statement-breakpoint
CREATE INDEX "meal_trial_food_id_index" ON "meal_trial" ("food_id");--> statement-breakpoint
CREATE INDEX "carer_family_id_index" ON "carer" ("family_id");--> statement-breakpoint
CREATE INDEX "child_family_id_index" ON "child" ("family_id");--> statement-breakpoint
CREATE INDEX "food_family_id_index" ON "food" ("family_id");--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_created_by_carer_id_carer_id_fkey" FOREIGN KEY ("created_by_carer_id") REFERENCES "carer"("id");--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_family_id_organization_id_fkey" FOREIGN KEY ("family_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_user_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_organization_id_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "member" ADD CONSTRAINT "member_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_family_id_organization_id_fkey" FOREIGN KEY ("family_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_logged_by_carer_id_carer_id_fkey" FOREIGN KEY ("logged_by_carer_id") REFERENCES "carer"("id");--> statement-breakpoint
ALTER TABLE "entry" ADD CONSTRAINT "entry_child_id_family_id_child_id_family_id_fkey" FOREIGN KEY ("child_id","family_id") REFERENCES "child"("id","family_id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "meal_trial" ADD CONSTRAINT "meal_trial_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "meal_trial" ADD CONSTRAINT "meal_trial_food_id_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "food"("id");--> statement-breakpoint
ALTER TABLE "milestone" ADD CONSTRAINT "milestone_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "milk" ADD CONSTRAINT "milk_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "nappy" ADD CONSTRAINT "nappy_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sleep" ADD CONSTRAINT "sleep_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "carer" ADD CONSTRAINT "carer_family_id_organization_id_fkey" FOREIGN KEY ("family_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "child" ADD CONSTRAINT "child_family_id_organization_id_fkey" FOREIGN KEY ("family_id") REFERENCES "organization"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "food" ADD CONSTRAINT "food_family_id_organization_id_fkey" FOREIGN KEY ("family_id") REFERENCES "organization"("id") ON DELETE CASCADE;