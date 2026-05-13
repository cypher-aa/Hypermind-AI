import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, memoryTable } from "@workspace/db";
import { CreateMemoryBody, DeleteMemoryParams, SearchMemoryQueryParams } from "@workspace/api-zod";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

// All memory routes require auth
router.use(authenticate);

// GET /memory — list memories for current user
router.get("/memory", async (req, res): Promise<void> => {
  const memories = await db
    .select()
    .from(memoryTable)
    .where(eq(memoryTable.userId, req.user!.userId))
    .orderBy(memoryTable.createdAt);

  res.json(memories);
});

// POST /memory — create a memory entry
router.post("/memory", async (req, res): Promise<void> => {
  const parsed = CreateMemoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [memory] = await db
    .insert(memoryTable)
    .values({ ...parsed.data, userId: req.user!.userId })
    .returning();

  res.status(201).json(memory);
});

// GET /memory/search — search memory entries
router.get("/memory/search", async (req, res): Promise<void> => {
  const parsed = SearchMemoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q } = parsed.data;
  const memories = await db
    .select()
    .from(memoryTable)
    .where(
      and(
        eq(memoryTable.userId, req.user!.userId),
        ilike(memoryTable.value, `%${q}%`)
      )
    )
    .orderBy(memoryTable.createdAt);

  res.json(memories);
});

// DELETE /memory/:id — delete a memory entry
router.delete("/memory/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteMemoryParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(memoryTable)
    .where(
      and(
        eq(memoryTable.id, params.data.id),
        eq(memoryTable.userId, req.user!.userId)
      )
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Memory not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
