DROP TABLE IF EXISTS `leaderboard`;--> statement-breakpoint
CREATE TABLE `leaderboard` (
	`id` text PRIMARY KEY NOT NULL,
	`left_name` text NOT NULL,
	`right_name` text NOT NULL,
	`score` integer NOT NULL,
	`left_image` blob NOT NULL,
	`right_image` blob NOT NULL,
	`image_type` text NOT NULL,
	`created_at` integer NOT NULL
);--> statement-breakpoint
CREATE INDEX `idx_leaderboard_rank` ON `leaderboard` (`score`,`created_at`);
