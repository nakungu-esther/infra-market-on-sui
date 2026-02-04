CREATE TABLE `entitlements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`service_id` integer NOT NULL,
	`payment_id` text NOT NULL,
	`pricing_tier` text NOT NULL,
	`quota_limit` integer NOT NULL,
	`quota_used` integer DEFAULT 0 NOT NULL,
	`valid_from` text NOT NULL,
	`valid_until` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`token_type` text NOT NULL,
	`amount_paid` text NOT NULL,
	`tx_digest` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `entitlements_payment_id_unique` ON `entitlements` (`payment_id`);--> statement-breakpoint
CREATE TABLE `pricing_tiers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`service_id` integer NOT NULL,
	`tier_name` text NOT NULL,
	`price_sui` text NOT NULL,
	`price_wal` text NOT NULL,
	`price_usdc` text NOT NULL,
	`quota_limit` integer NOT NULL,
	`validity_days` integer NOT NULL,
	`features` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `usage_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entitlement_id` integer NOT NULL,
	`user_id` text NOT NULL,
	`service_id` integer NOT NULL,
	`timestamp` text NOT NULL,
	`requests_count` integer DEFAULT 1 NOT NULL,
	`endpoint` text NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`entitlement_id`) REFERENCES `entitlements`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON UPDATE no action ON DELETE cascade
);
