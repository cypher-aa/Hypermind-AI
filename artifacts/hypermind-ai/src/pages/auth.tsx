import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRegisterUser, useLoginUser } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Sparkles, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const loginSchema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

const registerSchema = z.object({
  username: z.string().min(2, "Username must be at least 2 characters"),
  email: z.string().email("Valid email required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const loginMutation = useLoginUser();
  const registerMutation = useRegisterUser();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  async function onLogin(data: LoginForm) {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token);
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Login failed";
          toast({ title: "Login failed", description: msg, variant: "destructive" });
        },
      }
    );
  }

  async function onRegister(data: RegisterForm) {
    registerMutation.mutate(
      { data },
      {
        onSuccess: (res) => {
          login(res.token);
        },
        onError: (err: unknown) => {
          const msg = (err as { data?: { error?: string } })?.data?.error ?? "Registration failed";
          toast({ title: "Registration failed", description: msg, variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-sidebar border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">HyperMind AI</span>
        </div>

        <div className="relative space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-bold leading-tight text-foreground">
              Your intelligent<br />
              <span className="text-primary">AI workspace.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
              Five specialized agents. Persistent memory. Streaming intelligence. All in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Coding Agent", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
              { label: "Research Agent", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
              { label: "Career Agent", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
              { label: "Learning Agent", color: "bg-green-500/10 text-green-400 border-green-500/20" },
            ].map((a) => (
              <div key={a.label} className={cn("px-3 py-2 rounded-lg border text-xs font-medium", a.color)}>
                {a.label}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-muted-foreground">
          Powered by Gemini AI — built for professionals.
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Logo (mobile) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base">HyperMind AI</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold">
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "login"
                ? "Sign in to your workspace"
                : "Start with HyperMind for free"}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            <button
              data-testid="button-login-tab"
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                mode === "login" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setMode("login")}
            >
              Sign In
            </button>
            <button
              data-testid="button-register-tab"
              className={cn(
                "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                mode === "register" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  data-testid="input-email"
                  type="email"
                  placeholder="you@example.com"
                  {...loginForm.register("email")}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...loginForm.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Sign In <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </form>
          )}

          {/* Register Form */}
          {mode === "register" && (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="reg-username">Username</Label>
                <Input
                  id="reg-username"
                  data-testid="input-username"
                  placeholder="yourname"
                  {...registerForm.register("username")}
                />
                {registerForm.formState.errors.username && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email</Label>
                <Input
                  id="reg-email"
                  data-testid="input-email"
                  type="email"
                  placeholder="you@example.com"
                  {...registerForm.register("email")}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    data-testid="input-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    {...registerForm.register("password")}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <Button
                data-testid="button-submit"
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Create Account <ArrowRight className="w-4 h-4 ml-1" /></>
                )}
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-muted-foreground">
            {mode === "login" ? "New to HyperMind? " : "Already have an account? "}
            <button
              className="text-primary hover:underline font-medium"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
