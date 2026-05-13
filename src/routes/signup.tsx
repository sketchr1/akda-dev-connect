import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Code2, Briefcase, ArrowLeft, Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/signup")({
  component: SignUpPage,
  head: () => ({
    meta: [
      { title: "Sign up · Akda" },
      { name: "description", content: "Create your Akda account as a coder or as a customer hiring developers." },
    ],
  }),
});

type Role = "coder" | "customer";

function SignUpPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !username) {
      toast.error("Please fill out email, password, and username.");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]{2,30}$/.test(username)) {
      toast.error("Username must be 2–30 letters, numbers, or underscores.");
      return;
    }
    setStep(2);
  }

  async function handleSignUp(selectedRole: Role) {
    setRole(selectedRole);
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          role: selectedRole,
          username,
          display_name: displayName || username,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created. Check your email to confirm.");
    if (selectedRole === "coder") {
      navigate({ to: "/onboarding/coder" });
    } else {
      navigate({ to: "/" });
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error("Could not sign in with Google.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {step === 1 ? "Create your Akda account" : "Choose your role"}
          </h1>
          <span className="text-xs text-muted-foreground">Step {step} of 2</span>
        </div>

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. miracode" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display">Display name <span className="text-muted-foreground">(optional)</span></Label>
              <Input id="display" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Mira Cruz" />
            </div>

            <Button type="submit" className="w-full bg-gradient-akda text-primary-foreground shadow-glow">
              Continue
            </Button>

            <div className="relative py-2 text-center text-xs uppercase tracking-wider text-muted-foreground">
              <span className="relative z-10 bg-background px-2">or</span>
              <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
            </div>

            <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={googleLoading}>
              {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue with Google"}
            </Button>

            <p className="pt-2 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>

            <p className="text-sm text-muted-foreground">Tell us how you'll use Akda. You can change this later.</p>

            <div className="grid gap-3">
              <RoleCard
                icon={<Briefcase className="h-6 w-6" />}
                title="I'm hiring"
                subtitle="Find and commission verified developers."
                selected={role === "customer"}
                disabled={submitting}
                onClick={() => handleSignUp("customer")}
              />
              <RoleCard
                icon={<Code2 className="h-6 w-6" />}
                title="I'm a coder"
                subtitle="Showcase your work and take on commissions."
                selected={role === "coder"}
                disabled={submitting}
                onClick={() => handleSignUp("coder")}
              />
            </div>

            {submitting && (
              <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Creating your account…
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  subtitle,
  selected,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group flex items-center gap-4 rounded-xl border p-5 text-left transition-all hover:border-primary hover:bg-surface disabled:opacity-60 ${
        selected ? "border-primary bg-surface shadow-glow" : "border-border bg-card"
      }`}
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-akda text-primary-foreground">
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-foreground">{title}</div>
        <div className="text-sm text-muted-foreground">{subtitle}</div>
      </div>
      {selected && <Check className="h-5 w-5 text-primary" />}
    </button>
  );
}
