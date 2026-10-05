CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`date` text NOT NULL,
	`hour` integer NOT NULL,
	`amount` integer NOT NULL,
	`status` text NOT NULL,
	`created_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`payment_id` text
);
--> statement-breakpoint
CREATE TABLE `slots` (
	`key` text PRIMARY KEY NOT NULL,
	`booking_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`confirmed` integer DEFAULT 0 NOT NULL
);
