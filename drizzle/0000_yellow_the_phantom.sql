CREATE TABLE `leaderboard` (
	`id` text PRIMARY KEY NOT NULL,
	`left_name` text NOT NULL,
	`right_name` text NOT NULL,
	`score` integer NOT NULL,
	`left_image_key` text NOT NULL,
	`right_image_key` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_leaderboard_rank` ON `leaderboard` (`score`,`created_at`);