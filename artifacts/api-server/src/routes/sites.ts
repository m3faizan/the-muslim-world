import { Router } from "express";
import { db, sitesTable, hotspotsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  GetSiteParams,
  ListHotspotsParams,
} from "@workspace/api-zod";

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
      return res.status(404).json({ error: "Site not found" });
    }
    const hotspots = await db.select().from(hotspotsTable).where(eq(hotspotsTable.siteId, id));
    res.json({ ...formatSiteDetail(site), hotspots: hotspots.map(formatHotspot) });
  } catch (err) {
    req.log.error({ err }, "Failed to get site");
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
  };
}

function formatSiteDetail(s: typeof sitesTable.$inferSelect) {
  return {
    ...formatSite(s),
    fullDescription: s.fullDescription,
    architecturalStyle: s.architecturalStyle ?? null,
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
