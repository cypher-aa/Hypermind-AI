import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversationsTable } from "@workspace/db";
import { AGENTS, getAgent } from "../lib/agents";

const router: IRouter = Router();

// GET /agents — list all agents with conversation counts
router.get("/agents", async (_req, res): Promise<void> => {
  // Count conversations per agent
  const convCounts = await db
    .select({ agentId: conversationsTable.agentId, count: count() })
    .from(conversationsTable)
    .groupBy(conversationsTable.agentId);

  const countMap = new Map<string, number>();
  for (const row of convCounts) {
    if (row.agentId) countMap.set(row.agentId, Number(row.count));
  }

  const agents = AGENTS.map((agent) => ({
    ...agent,
    conversationCount: countMap.get(agent.id) ?? 0,
  }));

  res.json(agents);
});

// GET /agents/:id — get a single agent
router.get("/agents/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const agent = getAgent(raw);

  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  // Count conversations for this agent
  const [row] = await db
    .select({ count: count() })
    .from(conversationsTable)
    .where(eq(conversationsTable.agentId, raw));

  res.json({ ...agent, conversationCount: Number(row?.count ?? 0) });
});

// GET /agents/:id/conversations — list conversations for an agent
router.get("/agents/:id/conversations", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const agent = getAgent(raw);

  if (!agent) {
    res.status(404).json({ error: "Agent not found" });
    return;
  }

  const conversations = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.agentId, raw))
    .orderBy(conversationsTable.createdAt);

  res.json(conversations);
});

export default router;
