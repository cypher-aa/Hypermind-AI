import { useState } from "react";
import Layout from "@/components/Layout";
import {
  useListTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  getListTemplatesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  FileText, Plus, Trash2, Search, ArrowRight, Loader2, X, Copy
} from "lucide-react";
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
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  coding: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  research: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  career: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  learning: "bg-green-500/10 text-green-400 border-green-500/20",
  general: "bg-primary/10 text-primary border-primary/20",
  writing: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export default function TemplatesPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const { toast } = useToast();

  const { data: templates, isLoading } = useListTemplates();
  const createMutation = useCreateTemplate();
  const deleteMutation = useDeleteTemplate();

  const filtered = (templates ?? []).filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) ||
      t.category?.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set((templates ?? []).map((t) => t.category).filter(Boolean))];

  function handleCreate() {
    if (!name.trim() || !content.trim()) return;
    createMutation.mutate(
      { data: { name: name.trim(), description: description.trim(), content: content.trim(), category } },
      {
        onSuccess: () => {
          setName(""); setDescription(""); setContent(""); setCategory("general");
          setOpen(false);
          toast({ title: "Template saved" });
        },
        onError: () => toast({ title: "Failed to save template", variant: "destructive" }),
      }
    );
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => toast({ title: "Template deleted" }),
        onError: () => toast({ title: "Failed to delete template", variant: "destructive" }),
      }
    );
  }

  function handleCopy(content: string) {
    navigator.clipboard.writeText(content);
    toast({ title: "Copied to clipboard" });
  }

  return (
    <Layout>
      <div className="h-full overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Templates</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Reusable prompt templates for common tasks
              </p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-add-template">
                  <Plus className="w-4 h-4 mr-1.5" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input
                      data-testid="input-template-name"
                      placeholder="Code Review"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Input
                      data-testid="input-template-description"
                      placeholder="Brief description of what this template does"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <div className="flex flex-wrap gap-2">
                      {["general", "coding", "research", "career", "learning", "writing"].map((cat) => (
                        <button
                          key={cat}
                          className={cn(
                            "px-3 py-1 text-xs rounded-full border font-medium transition-all capitalize",
                            category === cat
                              ? (CATEGORY_COLORS[cat] ?? "bg-muted text-foreground") + " ring-1 ring-inset ring-current"
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
                    <Label>Prompt Content</Label>
                    <Textarea
                      data-testid="input-template-content"
                      placeholder="Please review the following code and suggest improvements..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <Button
                    data-testid="button-save-template"
                    className="w-full"
                    onClick={handleCreate}
                    disabled={createMutation.isPending || !name.trim() || !content.trim()}
                  >
                    {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Template"}
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
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch("")}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Stats */}
          {!isLoading && (
            <p className="text-xs text-muted-foreground">
              {filtered.length} template{filtered.length !== 1 ? "s" : ""}
              {search && ` matching "${search}"`}
              {categories.length > 0 && !search && ` across ${categories.length} categories`}
            </p>
          )}

          {/* Templates grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{search ? "No templates found" : "No templates yet"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map((template) => (
                <div
                  key={template.id}
                  data-testid={`card-template-${template.id}`}
                  className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3 group hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{template.name}</h3>
                      {template.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{template.description}</p>
                      )}
                    </div>
                    {template.category && (
                      <Badge variant="outline" className={cn("text-[10px] capitalize flex-shrink-0", CATEGORY_COLORS[template.category] ?? "bg-muted text-muted-foreground")}>
                        {template.category}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5 line-clamp-3 font-mono leading-relaxed">
                    {template.content}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      data-testid={`button-use-template-${template.id}`}
                      size="sm"
                      className="flex-1 h-7 text-xs"
                      onClick={() => navigate(`/chat?template=${template.id}`)}
                    >
                      Use <ArrowRight className="w-3 h-3 ml-1" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-7 h-7 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(template.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    {!template.isBuiltin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        data-testid={`button-delete-template-${template.id}`}
                        className="w-7 h-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                        onClick={() => handleDelete(template.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
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
