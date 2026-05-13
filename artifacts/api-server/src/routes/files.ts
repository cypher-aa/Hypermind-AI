import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, filesTable } from "@workspace/db";
import { UploadFileBody, DeleteFileParams } from "@workspace/api-zod";
import { authenticate } from "../middlewares/authenticate";

const router: IRouter = Router();

// All file routes require auth
router.use(authenticate);

// GET /files — list all files for current user
router.get("/files", async (req, res): Promise<void> => {
  const files = await db
    .select()
    .from(filesTable)
    .where(eq(filesTable.userId, req.user!.userId))
    .orderBy(filesTable.createdAt);

  res.json(files);
});

// POST /files — store file metadata (actual upload is client-side)
router.post("/files", async (req, res): Promise<void> => {
  const parsed = UploadFileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [file] = await db
    .insert(filesTable)
    .values({ ...parsed.data, userId: req.user!.userId })
    .returning();

  res.status(201).json(file);
});

// DELETE /files/:id — delete a file record
router.delete("/files/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteFileParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(filesTable)
    .where(
      and(
        eq(filesTable.id, params.data.id),
        eq(filesTable.userId, req.user!.userId)
      )
    )
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "File not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
