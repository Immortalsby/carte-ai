CREATE TABLE "referrals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"referrer_user_id" text NOT NULL,
	"referred_tenant_id" uuid NOT NULL,
	"reward_granted" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "referred_by_code" varchar(16);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referral_code" varchar(16);--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "permanent_free" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_referrals_referrer" ON "referrals" USING btree ("referrer_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_referrals_referred_tenant" ON "referrals" USING btree ("referred_tenant_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_referral_code_unique" UNIQUE("referral_code");