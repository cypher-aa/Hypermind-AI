import { Router, type IRouter } from "express";
import { eq, count, gte } from "drizzle-orm";
import { db, conversationsTable, messagesTable, memoryTable, filesTable } from "@workspace/db";

const router: IRouter = Router();

// GET /dashboard/stats — aggregate stats
router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [convRow] = await db.select({ count: count() }).from(conversationsTable);
  const [msgRow] = await db.select({ count: count() }).from(messagesTable);
  const [memRow] = await db.select({ count: count() }).from(memoryTable);
  const [fileRow] = await db.select({ count: count() }).from(filesTable);
  const [weekRow] = await db
    .select({ count: count() })
    .from(messagesTable)
    .where(gte(messagesTable.createdAt, oneWeekAgo));

  // Find most used agent
  const agentCounts = await db
    .select({ agentId: conversationsTable.agentId, count: count() })
    .from(conversationsTable)
    .groupBy(conversationsTable.agentId)
    .orderBy(count());

  const mostUsedAgent =
    agentCounts.length > 0 ? (agentCounts[agentCounts.length - 1]?.agentId ?? null) : null;

  res.json({
    totalConversations: Number(convRow?.count ?? 0),
    totalMessages: Number(msgRow?.count ?? 0),
    totalMemories: Number(memRow?.count ?? 0),
    totalFiles: Number(fileRow?.count ?? 0),
    mostUsedAgent,
    messagesThisWeek: Number(weekRow?.count ?? 0),
  });
});

// GET /dashboard/recent-activity — last 10 conversations as activity items
router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const conversations = await db
    .select()
    .from(conversationsTable)
    .orderBy(conversationsTable.createdAt)
    .limit(10);

  const activity = conversations.reverse().map((conv) => ({
    id: conv.id,
    type: "conversation",
    title: conv.title,
    description: conv.agentId
      ? `Started with ${conv.agentId} agent`
      : "General conversation",
    agentId: conv.agentId,
    createdAt: conv.createdAt,
  }));

  res.json(activity);
});

export default router;
