import { pgTable, serial, text, timestamp, integer, boolean, unique } from "drizzle-orm/pg-core";
import { sitesTable } from "./sites";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userSiteLogsTable = pgTable("user_site_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  siteId: integer("site_id").notNull().references(() => sitesTable.id, { onDelete: "cascade" }),
  visited: boolean("visited").notNull().default(false),
  prayed: boolean("prayed").notNull().default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [unique().on(t.userId, t.siteId)]);

export type User = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
export type UserSiteLog = typeof userSiteLogsTable.$inferSelect;
