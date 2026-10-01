CREATE TABLE "attachment" (
	"content_type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_carer_id" uuid,
	"created_by_user_id" text,
	"entry_id" uuid,
	"family_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"key" text NOT NULL UNIQUE,
	"size" bigint NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	CONSTRAINT "attachment_created_by_one" CHECK (("created_by_user_id" is not null) <> ("created_by_carer_id" is not null)),
	CONSTRAINT "attachment_size_positive" CHECK ("size" > 0)
);
--> statement-breakpoint
CREATE INDEX "attachment_family_id_index" ON "attachment" ("family_id");--> statement-breakpoint
CREATE INDEX "attachment_entry_id_index" ON "attachment" ("entry_id");--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_created_by_carer_id_carer_id_fkey" FOREIGN KEY ("created_by_carer_id") REFERENCES "carer"("id");--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_entry_id_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_family_id_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "family"("id") ON DELETE CASCADE;