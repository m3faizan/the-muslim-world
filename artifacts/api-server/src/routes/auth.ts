import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, userSiteLogsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const RegisterBody = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(80),
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const LogBody = z.object({
  visited: z.boolean().optional(),
  prayed: z.boolean().optional(),
});

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { email, password, displayName } = parsed.data;
  try {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (existing) { res.status(409).json({ error: "Email already in use" }); return; }
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(usersTable).values({ email: email.toLowerCase(), passwordHash, displayName }).returning();
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.save((err) => {
      if (err) req.log.error({ err }, "Session save failed on register");
      res.status(201).json({ id: user.id, email: user.email, displayName: user.displayName, isAdmin: isAdmin(user.email) });
    });
  } catch (err) {
    req.log.error({ err }, "Register failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const { email, password } = parsed.data;
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
    if (!user) { res.status(401).json({ error: "Invalid email or password" }); return; }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) { res.status(401).json({ error: "Invalid email or password" }); return; }
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.save((err) => {
      if (err) req.log.error({ err }, "Session save failed on login");
      res.json({ id: user.id, email: user.email, displayName: user.displayName, isAdmin: isAdmin(user.email) });
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
    if (!user) { res.status(401).json({ error: "Not authenticated" }); return; }
    res.json({ id: user.id, email: user.email, displayName: user.displayName, isAdmin: isAdmin(user.email) });
  } catch (err) {
    req.log.error({ err }, "Me failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/auth/logs", async (req, res) => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const logs = await db.select().from(userSiteLogsTable).where(eq(userSiteLogsTable.userId, req.session.userId));
    res.json(logs);
  } catch (err) {
    req.log.error({ err }, "Logs fetch failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/auth/logs/:siteId", async (req, res) => {
  if (!req.session.userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const siteId = Number(req.params.siteId);
  if (!Number.isFinite(siteId)) { res.status(400).json({ error: "Invalid siteId" }); return; }
  const parsed = LogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const userId = req.session.userId;
  try {
    const existing = await db.select().from(userSiteLogsTable)
      .where(and(eq(userSiteLogsTable.userId, userId), eq(userSiteLogsTable.siteId, siteId)));
    let log;
    if (existing.length > 0) {
      const updates: Partial<{ visited: boolean; prayed: boolean; updatedAt: Date }> = { updatedAt: new Date() };
      if (parsed.data.visited !== undefined) updates.visited = parsed.data.visited;
      if (parsed.data.prayed !== undefined) updates.prayed = parsed.data.prayed;
      [log] = await db.update(userSiteLogsTable).set(updates)
        .where(and(eq(userSiteLogsTable.userId, userId), eq(userSiteLogsTable.siteId, siteId)))
        .returning();
    } else {
      [log] = await db.insert(userSiteLogsTable).values({
        userId,
        siteId,
        visited: parsed.data.visited ?? false,
        prayed: parsed.data.prayed ?? false,
        updatedAt: new Date(),
      }).returning();
    }
    res.json(log);
  } catch (err) {
    req.log.error({ err }, "Log update failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

export function isAdmin(email: string): boolean {
  return email.toLowerCase() === (process.env.ADMIN_EMAIL ?? "").toLowerCase();
}

export default router;
