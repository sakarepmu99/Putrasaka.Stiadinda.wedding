import { integer, sqliteTable, text, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const rsvps = sqliteTable("rsvps", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  name: text("name").notNull(),
  attendance: text("attendance", { enum: ["yes", "no"] }).notNull(),
  guests: integer("guests").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [uniqueIndex("rsvps_visitor_idx").on(table.visitorId)]);

export const wishes = sqliteTable("wishes", {
  id: text("id").primaryKey(),
  visitorId: text("visitor_id").notNull(),
  name: text("name").notNull(),
  message: text("message").notNull(),
  createdAt: integer("created_at").notNull(),
}, (table) => [index("wishes_created_idx").on(table.createdAt), index("wishes_visitor_idx").on(table.visitorId)]);
