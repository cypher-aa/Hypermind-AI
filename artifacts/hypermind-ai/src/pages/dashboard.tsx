import Layout from "@/components/Layout";
import { useGetDashboardStats, useGetRecentActivity, useListAgents } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { MessageSquare, Brain, Files, Activity, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const AGENT_ICONS: Record<string, string> = {
  coding: "💻",
  research: "🔬",
  career: "💼",
  learning: "📚",
  general: "✨",
};

const AGENT_COLORS: Record<string, string> = {
  coding: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50",
  research: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/50",
  career: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50",
  learning: "border-green-500/30 bg-green-500/5 hover:border-green-500/50",
  general: "border-primary/30 bg-primary/5 hover:border-primary/50",
};

export default function DashboardPage() {
  const [, navigate] = useLocation();
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: activity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: agents } = useListAgents();

  const statCards = [
    { label: "Conversations", value: stats?.totalConversations ?? 0, icon: MessageSquare, color: "text-blue-400" },
    { label: "Messages", value: stats?.totalMessages ?? 0, icon: Activity, color: "text-purple-400" },
    { label: "Memories", value: stats?.totalMemories ?? 0, icon: Brain, color: "text-amber-400" },
    { label: "Files", value: stats?.totalFiles ?? 0, icon: Files, color: "text-green-400" },
  ];

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-sm text-muted-foreground mt-0.5">Your AI workspace at a glance</p>
            </div>
            <Button onClick={() => navigate("/chat")} data-testid="button-new-chat">
              <Sparkles className="w-4 h-4 mr-1.5" />
              New Chat
            </Button>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-card border border-border rounded-xl p-4 space-y-3">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-12" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                      <card.icon className={cn("w-4 h-4", card.color)} />
                    </div>
                    <p data-testid={`text-stat-${card.label.toLowerCase()}`} className="text-3xl font-bold tabular-nums">
                      {card.value.toLocaleString()}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Weekly activity */}
          {stats && (
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">This week</p>
                <p className="text-xs text-muted-foreground">
                  <span className="text-foreground font-semibold">{stats.messagesThisWeek}</span> messages exchanged
                  {stats.mostUsedAgent && (
                    <> — most active with <span className="text-foreground font-semibold capitalize">{stats.mostUsedAgent}</span> agent</>
                  )}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick launch agents */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Quick Launch</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate("/agents")} className="text-xs h-7 text-muted-foreground">
                  All agents <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-2">
                {(agents ?? []).map((agent) => (
                  <button
                    key={agent.id}
                    data-testid={`button-agent-${agent.id}`}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      AGENT_COLORS[agent.id] ?? "border-border bg-card hover:border-border/80"
                    )}
                    onClick={() => navigate(`/chat?agent=${agent.id}`)}
                  >
                    <span className="text-lg flex-shrink-0">{AGENT_ICONS[agent.id] ?? "🤖"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent Activity</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate("/chat")} className="text-xs h-7 text-muted-foreground">
                  All chats <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="space-y-1">
                {activityLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))
                ) : (activity ?? []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No conversations yet</p>
                    <Button size="sm" variant="ghost" className="mt-2" onClick={() => navigate("/chat")}>
                      Start your first chat
                    </Button>
                  </div>
                ) : (
                  (activity ?? []).map((item) => (
                    <button
                      key={item.id}
                      data-testid={`card-activity-${item.id}`}
                      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 text-left transition-colors"
                      onClick={() => navigate(`/chat/${item.id}`)}
                    >
                      <span className="text-base mt-0.5 flex-shrink-0">
                        {item.agentId ? AGENT_ICONS[item.agentId] : "💬"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0 mt-0.5">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
