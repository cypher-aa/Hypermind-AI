import { useState } from "react";
import Layout from "@/components/Layout";
import {
  useListMemories,
  useCreateMemory,
  useDeleteMemory,
  getListMemoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Brain, Plus, Trash2, Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  preference: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  fact: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  skill: "bg-green-500/10 text-green-400 border-green-500/20",
  goal: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  context: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function MemoryPage() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("fact");
  const [tags, setTags] = useState("");
  const { toast } = useToast();

  const { data: memories, isLoading } = useListMemories();
  const createMutation = useCreateMemory();
  const deleteMutation = useDeleteMemory();

  const filtered = (memories ?? []).filter((m) =>
    m.content.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  function handleCreate() {
    if (!content.trim()) return;
    createMutation.mutate(
      {
        data: {
          content: content.trim(),
          category,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        },
      },
      {
        onSuccess: () => {
          setContent("");
          setTags("");
          setCategory("fact");
          setOpen(false);
          toast({ title: "Memory saved" });
        },
        onError: () => toast({ title: "Failed to save memory", variant: "destructive" }),
      }
    );
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => toast({ title: "Memory deleted" }),
        onError: () => toast({ title: "Failed to delete memory", variant: "destructive" }),
      }
    );
  }

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Memory</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Facts and preferences the AI remembers about you
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-memory">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add Memory
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Save a Memory</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Content</Label>
                    <Textarea
                      data-testid="input-memory-content"
                      placeholder="e.g. I prefer Python over JavaScript for scripting tasks"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <div className="flex flex-wrap gap-2">
                      {["fact", "preference", "skill", "goal", "context"].map((cat) => (
                        <button
                          key={cat}
                          className={cn(
                            "px-3 py-1 text-xs rounded-full border font-medium transition-all capitalize",
                            category === cat
                              ? CATEGORY_COLORS[cat] + " ring-1 ring-inset ring-current"
                              : "border-border text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tags <span className="text-muted-foreground font-normal">(comma separated)</span></Label>
                    <Input
                      data-testid="input-memory-tags"
                      placeholder="python, coding, preferences"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </div>
                  <Button
                    data-testid="button-save-memory"
                    className="w-full"
                    onClick={handleCreate}
                    disabled={createMutation.isPending || !content.trim()}
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Memory"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-search"
              className="pl-9"
              placeholder="Search memories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Count */}
          {!isLoading && (
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "memory" : "memories"}
              {search && ` matching "${search}"`}
            </p>
          )}

          {/* Memory list */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{search ? "No memories found" : "No memories yet"}</p>
              {!search && (
                <p className="text-xs mt-1">Add facts about yourself to personalize the AI experience</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((memory) => (
                <div
                  key={memory.id}
                  data-testid={`card-memory-${memory.id}`}
                  className="bg-card border border-border rounded-xl p-4 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-relaxed">{memory.content}</p>
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        {memory.category && (
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] capitalize", CATEGORY_COLORS[memory.category] ?? "bg-muted text-muted-foreground")}
                          >
                            {memory.category}
                          </Badge>
                        )}
                        {(memory.tags as string[] ?? []).map((tag) => (
                          <span key={tag} className="px-2 py-0.5 text-[10px] bg-muted rounded-full text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {formatDistanceToNow(new Date(memory.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-delete-memory-${memory.id}`}
                      className="w-7 h-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0 transition-all"
                      onClick={() => handleDelete(memory.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
