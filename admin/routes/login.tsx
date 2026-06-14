import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Mail, Lock, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ApiError, getAuthToken, login, setAuthToken } from "@/lib/api/client";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (getAuthToken()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("admin@taskgo.app");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email.includes("@")) errs.email = "Enter a valid email";
    if (password.length < 6) errs.password = "Min 6 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      const result = await login({ email: email.trim().toLowerCase(), password });
      if (result.user.role !== "admin") {
        setAuthToken(null);
        toast.error("This account does not have admin access.");
        return;
      }
      setAuthToken(result.token);
      const firstName = result.user.name?.split(" ")[0];
      toast.success(firstName ? `Welcome back, ${firstName}!` : "Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unable to sign in. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-secondary via-background to-accent/30">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary to-[oklch(0.35_0.08_160)] text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[oklch(0.88_0.08_158)]/30 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <div className="text-2xl font-bold">TaskGo</div>
              <div className="text-sm opacity-80">Admin Console</div>
            </div>
          </div>
        </div>
        <div className="relative space-y-6">
          <h2 className="text-4xl font-bold leading-tight">Manage your local service marketplace with ease.</h2>
          <p className="opacity-85 text-lg max-w-md">Approve taskers, monitor revenue and resolve complaints — all from one beautifully simple dashboard.</p>
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl p-4 max-w-md">
            <ShieldCheck className="h-8 w-8 shrink-0" />
            <div className="text-sm">
              <div className="font-semibold">Secure by design</div>
              <div className="opacity-80">End-to-end encryption & 2FA enabled</div>
            </div>
          </div>
        </div>
        <div className="relative text-xs opacity-70">© 2026 TaskGo Inc. All rights reserved.</div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-[var(--shadow-card)]">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">Welcome back 👋</h1>
              <p className="text-sm text-muted-foreground">Sign in to your TaskGo admin account</p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 rounded-xl h-11" placeholder="you@taskgo.com" />
                </div>
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 rounded-xl h-11" placeholder="••••••••" />
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Checkbox defaultChecked /> Remember me
                </label>
                <a className="text-primary hover:underline" href="#">Forgot password?</a>
              </div>
              <Button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 font-semibold shadow-[var(--shadow-soft)]">
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground">
              Seeded admin: admin@taskgo.app / password123
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
