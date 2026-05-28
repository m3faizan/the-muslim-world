import { Router, type Request, type Response, type NextFunction } from "express";
import { db, sitesTable, hotspotsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { isAdmin } from "./auth";
import {
  GetSiteParams,
  ListHotspotsParams,
} from "@workspace/api-zod";

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  if (!req.session?.userEmail || !isAdmin(req.session.userEmail)) {
    res.status(403).json({ error: "Admin only" }); return;
  }
  next();
}

const UpdateSiteBody = z.object({
  name: z.string().optional(),
  arabicName: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  category: z.string().optional(),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  yearFounded: z.string().nullable().optional(),
  significance: z.string().optional(),
  isFeatured: z.boolean().optional(),
  imageUrl: z.string().nullable().optional(),
  modelUrl: z.string().nullable().optional(),
  architecturalStyle: z.string().nullable().optional(),
  capacity: z.number().int().nullable().optional(),
  areaSqm: z.number().int().nullable().optional(),
  dualUse: z.string().nullable().optional(),
  eidPrayer: z.boolean().optional(),
  ramadanVisit: z.boolean().optional(),
  jumaPrayer: z.boolean().optional(),
  sect: z.string().nullable().optional(),
  cameraPosition: z.string().nullable().optional(),
  cameraTarget: z.string().nullable().optional(),
  cameraLocked: z.boolean().optional(),
});

const router = Router();

router.get("/sites", async (req, res) => {
  try {
    const sites = await db.select().from(sitesTable).orderBy(sitesTable.name);
    res.json(sites.map(formatSite));
  } catch (err) {
    req.log.error({ err }, "Failed to list sites");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sites/featured", async (req, res) => {
  try {
    const sites = await db
      .select()
      .from(sitesTable)
      .where(eq(sitesTable.isFeatured, true))
      .orderBy(sitesTable.name);
    res.json(sites.map(formatSite));
  } catch (err) {
    req.log.error({ err }, "Failed to list featured sites");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sites/by-region", async (req, res) => {
  try {
    const sites = await db.select().from(sitesTable).orderBy(sitesTable.region, sitesTable.name);
    const grouped: Record<string, typeof sites> = {};
    for (const site of sites) {
      if (!grouped[site.region]) grouped[site.region] = [];
      grouped[site.region].push(site);
    }
    const result = Object.entries(grouped).map(([region, regionSites]) => ({
      region,
      count: regionSites.length,
      sites: regionSites.map(formatSite),
    }));
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to list sites by region");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sites/:id", async (req, res) => {
  try {
    const { id } = GetSiteParams.parse({ id: Number(req.params.id) });
    const [site] = await db.select().from(sitesTable).where(eq(sitesTable.id, id));
    if (!site) {
      res.status(404).json({ error: "Site not found" }); return;
    }
    const hotspots = await db.select().from(hotspotsTable).where(eq(hotspotsTable.siteId, id));
    res.json({ ...formatSiteDetail(site), hotspots: hotspots.map(formatHotspot) });
  } catch (err) {
    req.log.error({ err }, "Failed to get site");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/sites/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) { res.status(400).json({ error: "Invalid site id" }); return; }
  const parsed = UpdateSiteBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  try {
    const [existing] = await db.select().from(sitesTable).where(eq(sitesTable.id, id));
    if (!existing) { res.status(404).json({ error: "Site not found" }); return; }
    await db.update(sitesTable).set(parsed.data).where(eq(sitesTable.id, id));
    const [updated] = await db.select().from(sitesTable).where(eq(sitesTable.id, id));
    const hotspots = await db.select().from(hotspotsTable).where(eq(hotspotsTable.siteId, id));
    res.json({ ...formatSiteDetail(updated), hotspots: hotspots.map(formatHotspot) });
  } catch (err) {
    req.log.error({ err }, "Failed to update site");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/sites/:id/hotspots", async (req, res) => {
  try {
    const { id } = ListHotspotsParams.parse({ id: Number(req.params.id) });
    const hotspots = await db.select().from(hotspotsTable).where(eq(hotspotsTable.siteId, id));
    res.json(hotspots.map(formatHotspot));
  } catch (err) {
    req.log.error({ err }, "Failed to list hotspots");
    res.status(500).json({ error: "Internal server error" });
  }
});

function formatSite(s: typeof sitesTable.$inferSelect) {
  return {
    id: s.id,
    name: s.name,
    arabicName: s.arabicName,
    region: s.region,
    country: s.country,
    latitude: s.latitude,
    longitude: s.longitude,
    category: s.category,
    shortDescription: s.shortDescription,
    yearFounded: s.yearFounded ?? null,
    significance: s.significance,
    isFeatured: s.isFeatured,
    imageUrl: s.imageUrl ?? null,
    modelUrl: s.modelUrl ?? null,
    eidPrayer: s.eidPrayer,
    ramadanVisit: s.ramadanVisit,
    jumaPrayer: s.jumaPrayer,
  };
}

function formatSiteDetail(s: typeof sitesTable.$inferSelect) {
  return {
    ...formatSite(s),
    fullDescription: s.fullDescription,
    architecturalStyle: s.architecturalStyle ?? null,
    capacity: s.capacity ?? null,
    areaSqm: s.areaSqm ?? null,
    dualUse: s.dualUse ?? null,
    sect: s.sect ?? null,
    cameraPosition: s.cameraPosition ?? null,
    cameraTarget: s.cameraTarget ?? null,
    cameraLocked: s.cameraLocked,
  };
}

function formatHotspot(h: typeof hotspotsTable.$inferSelect) {
  return {
    id: h.id,
    siteId: h.siteId,
    label: h.label,
    description: h.description,
    positionX: h.positionX,
    positionY: h.positionY,
    positionZ: h.positionZ,
    arabicTerm: h.arabicTerm ?? null,
    historicalPeriod: h.historicalPeriod ?? null,
    imageUrl: h.imageUrl ?? null,
  };
}

export default router;
