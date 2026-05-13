import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import Layout from "@/components/Layout";
import {
  useListGeminiConversations,
  useCreateGeminiConversation,
  useListTemplates,
} from "@workspace/api-client-react";
import { MessageSquare, Plus, ChevronRight, Search, Sparkles, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const AGENT_ICONS: Record<string, string> = {
  coding: "💻",
  research: "🔬",
  career: "💼",
  learning: "📚",
  general: "✨",
};

const AGENT_OPTIONS = [
  { id: "general", name: "General", description: "Open-ended reasoning", icon: "✨", color: "border-primary/30 bg-primary/5 hover:border-primary/60" },
  { id: "coding", name: "Coding", description: "Code, debug, architecture", icon: "💻", color: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/60" },
  { id: "research", name: "Research", description: "Analysis & deep research", icon: "🔬", color: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500/60" },
  { id: "career", name: "Career", description: "Resume, interviews, strategy", icon: "💼", color: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60" },
  { id: "learning", name: "Learning", description: "Explanations & tutorials", icon: "📚", color: "border-green-500/30 bg-green-500/5 hover:border-green-500/60" },
];

export default function ChatPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initialAgent = params.get("agent") ?? "general";

  const [, navigate] = useLocation();
  const [selectedAgent, setSelectedAgent] = useState(initialAgent);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const createMutation = useCreateGeminiConversation();
  const { data: conversations, isLoading } = useListGeminiConversations();
  const { data: templates } = useListTemplates();

  const filtered = (conversations ?? []).filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  function startConversation(title?: string) {
    createMutation.mutate(
      { data: { title: title ?? "New Conversation", agentId: selectedAgent } },
      {
        onSuccess: (conv) => navigate(`/chat/${conv.id}`),
        onError: () => toast({ title: "Could not start conversation", variant: "destructive" }),
      }
    );
  }

  function useTemplate(templateContent: string, templateName: string) {
    createMutation.mutate(
      { data: { title: templateName, agentId: selectedAgent } },
      {
        onSuccess: (conv) => navigate(`/chat/${conv.id}?prompt=${encodeURIComponent(templateContent)}`),
        onError: () => toast({ title: "Could not start conversation", variant: "destructive" }),
      }
    );
  }

  const suggestedTemplates = (templates ?? []).slice(0, 3);

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">New Conversation</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Choose an agent and start chatting</p>
          </div>

          {/* Agent selector */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Select Agent</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {AGENT_OPTIONS.map((agent) => (
                <button
                  key={agent.id}
                  data-testid={`button-agent-${agent.id}`}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all",
                    selectedAgent === agent.id
                      ? agent.color + " ring-2 ring-primary/40"
                      : "border-border bg-card hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedAgent(agent.id)}
                >
                  <span className="text-2xl">{agent.icon}</span>
                  <div>
                    <p className="text-xs font-semibold">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{agent.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Chat CTA */}
          <div className="flex gap-3">
            <Button
              data-testid="button-start-chat"
              size="lg"
              className="flex-1 sm:flex-none"
              onClick={() => startConversation()}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Start Chat
            </Button>
          </div>

          {/* Template suggestions */}
          {suggestedTemplates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Quick Templates</h2>
                <Button variant="ghost" size="sm" onClick={() => navigate("/templates")} className="text-xs h-7 text-muted-foreground">
                  All templates <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {suggestedTemplates.map((t) => (
                  <button
                    key={t.id}
                    data-testid={`button-template-${t.id}`}
                    className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/40 hover:bg-muted/30 text-left transition-all group"
                    onClick={() => useTemplate(t.content, t.name)}
                  >
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-primary transition-colors" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.name}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{t.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation history */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex-1">History</h2>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  data-testid="input-search"
                  className="pl-8 h-8 text-xs w-48"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm">{searchQuery ? "No conversations found" : "No conversations yet"}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {[...filtered].reverse().map((conv) => (
                  <button
                    key={conv.id}
                    data-testid={`button-conv-${conv.id}`}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 text-left transition-colors group"
                    onClick={() => navigate(`/chat/${conv.id}`)}
                  >
                    <span className="text-base flex-shrink-0">
                      {conv.agentId ? AGENT_ICONS[conv.agentId] : "💬"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      {conv.agentId && (
                        <p className="text-xs text-muted-foreground capitalize">{conv.agentId} agent</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.createdAt), { addSuffix: true })}
                      </p>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
