CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`reason` text,
	`metadata` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `credit_tx_user_idx` ON `credit_transactions` (`user_id`);--> statement-breakpoint
CREATE INDEX `credit_tx_user_created_idx` ON `credit_transactions` (`user_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `users` ADD `plan_slug` text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `credits` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_daily_reset` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `next_monthly_reset` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `billing_status` text DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `users` ADD `whop_membership_id` text;--> statement-breakpoint
ALTER TABLE `users` ADD `whop_product_id` text;--> statement-breakpoint
CREATE INDEX `users_plan_idx` ON `users` (`plan_slug`);