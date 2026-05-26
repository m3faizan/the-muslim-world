import { pgTable, serial, text, boolean, doublePrecision, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sitesTable = pgTable("sites", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  arabicName: text("arabic_name").notNull(),
  region: text("region").notNull(),
  country: text("country").notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  category: text("category").notNull(),
  shortDescription: text("short_description").notNull(),
  fullDescription: text("full_description").notNull(),
  yearFounded: text("year_founded"),
  significance: text("significance").notNull(),
  isFeatured: boolean("is_featured").notNull().default(false),
  imageUrl: text("image_url"),
  modelUrl: text("model_url"),
  architecturalStyle: text("architectural_style"),
  capacity: integer("capacity"),
  areaSqm: integer("area_sqm"),
  dualUse: text("dual_use"),
  eidPrayer: boolean("eid_prayer").notNull().default(false),
  ramadanVisit: boolean("ramadan_visit").notNull().default(false),
  jumaPrayer: boolean("juma_prayer").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const hotspotsTable = pgTable("hotspots", {
  id: serial("id").primaryKey(),
  siteId: serial("site_id").references(() => sitesTable.id),
  label: text("label").notNull(),
  description: text("description").notNull(),
  positionX: doublePrecision("position_x").notNull(),
  positionY: doublePrecision("position_y").notNull(),
  positionZ: doublePrecision("position_z").notNull(),
  arabicTerm: text("arabic_term"),
  historicalPeriod: text("historical_period"),
  imageUrl: text("image_url"),
});

export const insertSiteSchema = createInsertSchema(sitesTable).omit({ id: true, createdAt: true });
export const insertHotspotSchema = createInsertSchema(hotspotsTable).omit({ id: true });

export type InsertSite = z.infer<typeof insertSiteSchema>;
export type Site = typeof sitesTable.$inferSelect;
export type InsertHotspot = z.infer<typeof insertHotspotSchema>;
export type Hotspot = typeof hotspotsTable.$inferSelect;
