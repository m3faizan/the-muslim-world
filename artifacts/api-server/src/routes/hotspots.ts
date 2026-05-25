import { Router, type Request, type Response, type NextFunction } from "express";
import { db, hotspotsTable, sitesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { isAdmin } from "./auth";

const router = Router();

const CreateHotspotBody = z.object({
  label: z.string().optional().default(""),
  description: z.string().optional().default(""),
  positionX: z.number(),
  positionY: z.number(),
  positionZ: z.number(),
  arabicTerm: z.string().optional(),
  historicalPeriod: z.string().optional(),
});

function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  if (!req.session?.userEmail || !isAdmin(req.session.userEmail)) {
    res.status(403).json({ error: "Admin only" }); return;
  }
  next();
}

router.post("/sites/:id/hotspots", requireAdmin, async (req, res) => {
  const siteId = Number(req.params.id);
  if (!Number.isFinite(siteId)) { res.status(400).json({ error: "Invalid site id" }); return; }
  const parsed = CreateHotspotBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  try {
    const [site] = await db.select().from(sitesTable).where(eq(sitesTable.id, siteId));
    if (!site) { res.status(404).json({ error: "Site not found" }); return; }
    const [hotspot] = await db.insert(hotspotsTable).values({
      siteId,
      label: parsed.data.label,
      description: parsed.data.description,
      positionX: parsed.data.positionX,
      positionY: parsed.data.positionY,
      positionZ: parsed.data.positionZ,
      arabicTerm: parsed.data.arabicTerm ?? null,
      historicalPeriod: parsed.data.historicalPeriod ?? null,
    }).returning();
    res.status(201).json(hotspot);
  } catch (err) {
    req.log.error({ err }, "Create hotspot failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/sites/:siteId/hotspots/:hotspotId", requireAdmin, async (req, res) => {
  const hotspotId = Number(req.params.hotspotId);
  if (!Number.isFinite(hotspotId)) { res.status(400).json({ error: "Invalid hotspot id" }); return; }
  try {
    await db.delete(hotspotsTable).where(eq(hotspotsTable.id, hotspotId));
    res.json({ ok: true });
  } catch (err) {
    req.log.error({ err }, "Delete hotspot failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
