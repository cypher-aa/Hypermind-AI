import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const memoryTable = pgTable("memory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  agentId: text("agent_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMemorySchema = createInsertSchema(memoryTable).omit({
  id: true,
  createdAt: true,
});

export type InsertMemory = z.infer<typeof insertMemorySchema>;
export type Memory = typeof memoryTable.$inferSelect;
