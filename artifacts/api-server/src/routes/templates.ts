import { Router, type IRouter } from "express";
import { eq, or, isNull } from "drizzle-orm";
import { db, templatesTable } from "@workspace/db";
import {
  CreateTemplateBody,
  ListTemplatesQueryParams,
  GetTemplateParams,
  DeleteTemplateParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /templates — list all templates, optionally filtered by agentId
router.get("/templates", async (req, res): Promise<void> => {
  const parsed = ListTemplatesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { agentId } = parsed.data;

  let templates;
  if (agentId) {
    templates = await db
      .select()
      .from(templatesTable)
      .where(
        or(
          eq(templatesTable.agentId, agentId),
          isNull(templatesTable.agentId)
        )
      )
      .orderBy(templatesTable.createdAt);
  } else {
    templates = await db
      .select()
      .from(templatesTable)
      .orderBy(templatesTable.createdAt);
  }

  res.json(templates);
});

// POST /templates — create a new template
router.post("/templates", async (req, res): Promise<void> => {
  const parsed = CreateTemplateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [template] = await db
    .insert(templatesTable)
    .values({ ...parsed.data, isBuiltin: false })
    .returning();

  res.status(201).json(template);
});

// GET /templates/:id — get a specific template
router.get("/templates/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTemplateParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [template] = await db
    .select()
    .from(templatesTable)
    .where(eq(templatesTable.id, params.data.id));

  if (!template) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.json(template);
});

// DELETE /templates/:id — delete a template
router.delete("/templates/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteTemplateParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(templatesTable)
    .where(eq(templatesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
