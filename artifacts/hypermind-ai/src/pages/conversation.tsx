import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import Layout from "@/components/Layout";
import {
  useGetGeminiConversation,
  useDeleteGeminiConversation,
  useListGeminiConversations,
  getSendGeminiMessageUrl,
} from "@workspace/api-client-react";
import {
  Send,
  Trash2,
  Copy,
  ChevronLeft,
  Loader2,
  Bot,
  User,
  Sparkles,
  StopCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
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
  coding: "text-blue-400",
  research: "text-purple-400",
  career: "text-amber-400",
  learning: "text-green-400",
  general: "text-primary",
};

interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  streaming?: boolean;
}

function MessageBubble({ msg, agentId }: { msg: LocalMessage; agentId?: string | null }) {
  const { toast } = useToast();
  const isUser = msg.role === "user";

  function copy() {
    navigator.clipboard.writeText(msg.content);
    toast({ title: "Copied" });
  }

  return (
    <div className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div
          className={cn(
            "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm",
            "bg-primary/10"
          )}
        >
          {agentId ? AGENT_ICONS[agentId] : <Bot className="w-3.5 h-3.5 text-primary" />}
        </div>
      )}

      <div className={cn("max-w-[78%] space-y-1", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card border border-border rounded-tl-sm"
          )}
        >
          {msg.content}
          {msg.streaming && (
            <span className="inline-block w-1.5 h-4 bg-primary/60 ml-0.5 animate-pulse rounded-sm align-text-bottom" />
          )}
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity",
            isUser ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
          </span>
          <button
            className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
            onClick={copy}
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const convId = Number(id);
  const search = useSearch();
  const initialPrompt = new URLSearchParams(search).get("prompt") ?? "";

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [input, setInput] = useState(initialPrompt);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const { data: conv, isLoading } = useGetGeminiConversation(convId, {
    query: { enabled: !isNaN(convId) },
  });

  const deleteMutation = useDeleteGeminiConversation();

  // Initialize messages from server
  useEffect(() => {
    if (conv?.messages) {
      setMessages(
        conv.messages.map((m) => ({
          id: String(m.id),
          role: m.role as "user" | "assistant",
          content: m.content,
          createdAt: m.createdAt,
        }))
      );
    }
  }, [conv?.messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus if initial prompt
  useEffect(() => {
    if (initialPrompt) {
      textareaRef.current?.focus();
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");

    // Optimistically add user message
    const userMsg: LocalMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    // Placeholder for streaming AI response
    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg: LocalMessage = {
      id: aiMsgId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
      streaming: true,
    };

    setMessages((prev) => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const token = localStorage.getItem("token");
      const url = getSendGeminiMessageUrl(convId);

      const res = await fetch(url, {
        method: "POST",
        signal: ctrl.signal,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          content: text,
          agentId: conv?.agentId ?? "general",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.done) break;
              if (parsed.content) {
                accumulated += parsed.content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId
                      ? { ...m, content: accumulated, streaming: true }
                      : m
                  )
                );
              }
            } catch {
              // ignore parse errors for partial chunks
            }
          }
        }
      }

      // Mark streaming done
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aiMsgId ? { ...m, streaming: false } : m
        )
      );

      // Refresh conversation list in sidebar
      qc.invalidateQueries({ queryKey: ["/api/gemini/conversations"] });
    } catch (err: unknown) {
      if ((err as Error)?.name === "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId ? { ...m, streaming: false, content: m.content || "(stopped)" } : m
          )
        );
      } else {
        toast({
          title: "Failed to send message",
          description: (err as Error)?.message,
          variant: "destructive",
        });
        setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [input, isStreaming, convId, conv?.agentId, qc, toast]);

  function stopStreaming() {
    abortRef.current?.abort();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleDelete() {
    deleteMutation.mutate(
      { id: convId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["/api/gemini/conversations"] });
          navigate("/chat");
          toast({ title: "Conversation deleted" });
        },
        onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
      }
    );
  }

  const agentId = conv?.agentId ?? null;
  const agentIcon = agentId ? AGENT_ICONS[agentId] : "✨";
  const agentColor = agentId ? AGENT_COLORS[agentId] : "text-primary";

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground"
            onClick={() => navigate("/chat")}
            data-testid="button-back"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg flex-shrink-0">{agentIcon}</span>
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              ) : (
                <p className="text-sm font-semibold truncate">{conv?.title ?? "Conversation"}</p>
              )}
              {agentId && (
                <p className={cn("text-[10px] capitalize font-medium", agentColor)}>
                  {agentId} agent
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            data-testid="button-delete-conversation"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Ready to help</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  {agentId
                    ? `You're chatting with the ${agentId} agent. Ask anything!`
                    : "Send a message to start the conversation."}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} agentId={agentId} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="px-4 py-4 border-t border-border bg-background/80 backdrop-blur flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end bg-card border border-border rounded-2xl px-3 py-2 focus-within:border-primary/50 transition-colors">
              <Textarea
                ref={textareaRef}
                data-testid="input-message"
                className="flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 py-1.5 px-0 min-h-[40px] max-h-[160px] text-sm placeholder:text-muted-foreground"
                placeholder={`Message ${agentId ? `${agentId} agent` : "HyperMind"}...`}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                rows={1}
              />
              <div className="flex-shrink-0 pb-0.5">
                {isStreaming ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-9 h-9 text-destructive hover:bg-destructive/10"
                    onClick={stopStreaming}
                    data-testid="button-stop"
                  >
                    <StopCircle className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="w-9 h-9"
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    data-testid="button-send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
