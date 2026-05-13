import Layout from "@/components/Layout";
import { useListAgents } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { ArrowRight, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const AGENT_ICONS: Record<string, string> = {
  coding: "💻",
  research: "🔬",
  career: "💼",
  learning: "📚",
  general: "✨",
};

const AGENT_COLORS: Record<string, { card: string; badge: string }> = {
  coding: {
    card: "border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5",
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  research: {
    card: "border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5",
    badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  career: {
    card: "border-amber-500/30 hover:border-amber-500/60 bg-amber-500/5",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  learning: {
    card: "border-green-500/30 hover:border-green-500/60 bg-green-500/5",
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  general: {
    card: "border-primary/30 hover:border-primary/60 bg-primary/5",
    badge: "bg-primary/10 text-primary border-primary/20",
  },
};

const AGENT_CAPABILITIES: Record<string, string[]> = {
  coding: ["Code generation", "Debugging", "Architecture", "Code review", "Performance"],
  research: ["Deep research", "Fact checking", "Data analysis", "Summarization", "Literature review"],
  career: ["Resume writing", "Interview prep", "Job strategy", "LinkedIn optimization", "Salary negotiation"],
  learning: ["Concept explanations", "Tutoring", "Practice problems", "Study plans", "Skill assessment"],
  general: ["Open-ended Q&A", "Brainstorming", "Writing", "Planning", "Problem solving"],
};

export default function AgentsPage() {
  const [, navigate] = useLocation();
  const { data: agents, isLoading } = useListAgents();

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Agents</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Specialized agents tuned for different tasks
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(agents ?? []).map((agent) => {
                const colors = AGENT_COLORS[agent.id] ?? { card: "border-border bg-card", badge: "bg-muted text-muted-foreground" };
                const caps = AGENT_CAPABILITIES[agent.id] ?? [];

                return (
                  <div
                    key={agent.id}
                    data-testid={`card-agent-${agent.id}`}
                    className={cn(
                      "rounded-xl border p-5 flex flex-col gap-4 transition-all",
                      colors.card
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{AGENT_ICONS[agent.id] ?? "🤖"}</span>
                        <div>
                          <h3 className="font-semibold text-base">{agent.name}</h3>
                          <Badge variant="outline" className={cn("text-[10px] mt-0.5", colors.badge)}>
                            {agent.id} agent
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {agent.description}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {caps.map((cap) => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 text-[10px] bg-background/60 border border-border rounded-full text-muted-foreground"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        data-testid={`button-start-${agent.id}`}
                        className="flex-1"
                        size="sm"
                        onClick={() => navigate(`/chat?agent=${agent.id}`)}
                      >
                        Start Chat
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty */}
          {!isLoading && (agents ?? []).length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No agents available</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
