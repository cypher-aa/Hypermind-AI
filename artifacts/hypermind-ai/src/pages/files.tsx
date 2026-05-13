import { useRef, useState } from "react";
import Layout from "@/components/Layout";
import { useListFiles, useDeleteFile, getListFilesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Files, Upload, Trash2, Search, X, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image className="w-5 h-5 text-blue-400" />;
  if (mimeType.includes("pdf") || mimeType.includes("text")) return <FileText className="w-5 h-5 text-amber-400" />;
  return <File className="w-5 h-5 text-muted-foreground" />;
}

export default function FilesPage() {
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: files, isLoading, refetch } = useListFiles();
  const deleteMutation = useDeleteFile();

  const filtered = (files ?? []).filter((f) =>
    f.filename.toLowerCase().includes(search.toLowerCase())
  );

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/files/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      await refetch();
      toast({ title: "File uploaded" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate(
      { id },
      {
        onSuccess: () => toast({ title: "File deleted" }),
        onError: () => toast({ title: "Failed to delete file", variant: "destructive" }),
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
              <h1 className="text-2xl font-bold tracking-tight">Files</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Uploaded files and attachments
              </p>
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
                accept="image/*,.pdf,.txt,.md,.csv,.json,.js,.ts,.py"
                data-testid="input-file"
              />
              <Button
                size="sm"
                data-testid="button-upload"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4 mr-1.5" />
                {uploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              data-testid="input-search"
              className="pl-9"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setSearch("")}>
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Upload drop zone */}
          <button
            data-testid="button-drop-zone"
            className={cn(
              "w-full border-2 border-dashed border-border rounded-xl p-8 text-center transition-all",
              "hover:border-primary/50 hover:bg-primary/5",
              uploading && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => !uploading && fileRef.current?.click()}
            disabled={uploading}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {uploading ? "Uploading..." : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Images, PDFs, text files, code files up to 10MB
            </p>
          </button>

          {/* Count */}
          {!isLoading && (
            <p className="text-xs text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "file" : "files"}
              {search && ` matching "${search}"`}
            </p>
          )}

          {/* File list */}
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Files className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">{search ? "No files found" : "No files uploaded yet"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((file) => (
                <div
                  key={file.id}
                  data-testid={`card-file-${file.id}`}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-3 group hover:border-border/80 transition-all"
                >
                  <div className="flex-shrink-0">
                    <FileIcon mimeType={file.mimeType ?? ""} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{formatBytes(file.size ?? 0)}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{file.mimeType}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    data-testid={`button-delete-file-${file.id}`}
                    className="w-7 h-7 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                    onClick={() => handleDelete(file.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
