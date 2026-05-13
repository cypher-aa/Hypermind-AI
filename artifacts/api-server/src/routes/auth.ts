import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import {
  RegisterUserBody,
  LoginUserBody,
} from "@workspace/api-zod";
import { hashPassword, comparePassword, signToken } from "../lib/auth";
import { authenticate } from "../middlewares/authenticate";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// POST /auth/register
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, username, password } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "Email already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({ email, username, passwordHash })
    .returning();

  const token = signToken({ userId: user.id, email: user.email });
  req.log.info({ userId: user.id }, "User registered");

  res.status(201).json({
    user: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt },
    token,
  });
});

// POST /auth/login
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = signToken({ userId: user.id, email: user.email });
  req.log.info({ userId: user.id }, "User logged in");

  res.json({
    user: { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt },
    token,
  });
});

// POST /auth/logout
router.post("/auth/logout", (_req, res): void => {
  res.json({ message: "Logged out successfully" });
});

// GET /auth/me
router.get("/auth/me", authenticate, async (req, res): Promise<void> => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({ id: user.id, email: user.email, username: user.username, createdAt: user.createdAt });
});

export default router;
