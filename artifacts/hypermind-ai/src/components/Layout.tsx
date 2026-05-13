import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  Brain,
  FileText,
  Files,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useListGeminiConversations } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "New Chat", icon: MessageSquare },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/files", label: "Files", icon: Files },
];

const AGENT_COLORS: Record<string, string> = {
  coding: "text-blue-400",
  research: "text-purple-400",
  career: "text-amber-400",
  learning: "text-green-400",
  general: "text-primary",
};

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { data: conversations } = useListGeminiConversations();

  const recentConvs = (conversations ?? []).slice(-5).reverse();

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </div>
        <div>
          <p className="font-bold text-sm tracking-tight text-sidebar-foreground">HyperMind AI</p>
          <p className="text-[10px] text-muted-foreground">Intelligent Workspace</p>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        {/* Main Nav */}
        <nav className="space-y-0.5 mb-6">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = location === href || (href !== "/dashboard" && location.startsWith(href));
            return (
              <Link key={href} href={href}>
                <a
                  data-testid={`nav-${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                  {active && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* Recent Conversations */}
        {recentConvs.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 mb-2 font-semibold">
              Recent Chats
            </p>
            <nav className="space-y-0.5">
              {recentConvs.map((conv) => {
                const active = location === `/chat/${conv.id}`;
                return (
                  <Link key={conv.id} href={`/chat/${conv.id}`}>
                    <a
                      data-testid={`nav-conv-${conv.id}`}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-xs transition-all truncate",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <MessageSquare className={cn("w-3 h-3 flex-shrink-0", conv.agentId ? AGENT_COLORS[conv.agentId] : "text-muted-foreground")} />
                      <span className="truncate">{conv.title}</span>
                    </a>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </ScrollArea>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5">
          <Avatar className="w-7 h-7 flex-shrink-0">
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-bold">
              {user?.username?.slice(0, 2).toUpperCase() ?? "HM"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p data-testid="text-username" className="text-xs font-medium text-sidebar-foreground truncate">{user?.username}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-7 h-7 text-muted-foreground hover:text-destructive flex-shrink-0"
            onClick={logout}
            data-testid="button-logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 border-r border-sidebar-border bg-sidebar flex-col flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar border-r border-sidebar-border">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            data-testid="button-menu"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">HyperMind AI</span>
          </div>
        </div>

        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
