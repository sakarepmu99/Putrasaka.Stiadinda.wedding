CREATE TABLE `rsvps` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`name` text NOT NULL,
	`attendance` text NOT NULL,
	`guests` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);

CREATE UNIQUE INDEX `rsvps_visitor_idx` ON `rsvps` (`visitor_id`);
CREATE TABLE `wishes` (
	`id` text PRIMARY KEY NOT NULL,
	`visitor_id` text NOT NULL,
	`name` text NOT NULL,
	`message` text NOT NULL,
	`created_at` integer NOT NULL
);

CREATE INDEX `wishes_created_idx` ON `wishes` (`created_at`);
CREATE INDEX `wishes_visitor_idx` ON `wishes` (`visitor_id`);