import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/onboarding/coder")({
  component: CoderOnboarding,
  head: () => ({
    meta: [
      { title: "Set up your coder profile · Akda" },
      { name: "description", content: "Tell clients who you are, what you build, and where to see your work." },
    ],
  }),
});

const FLUENCY_OPTIONS = [
  "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust",
  "Ruby", "PHP", "Swift", "Kotlin", "React", "Vue", "Next.js", "Node.js",
  "Django", "Rails", "SQL", "GraphQL", "AWS", "Docker", "Kubernetes",
];

const stepOneSchema = z.object({
  display_name: z.string().trim().min(2).max(60),
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{2,30}$/, "2–30 letters, numbers, or underscores"),
  location: z.string().trim().min(2).max(80),
  home_language: z.string().trim().min(2).max(40),
});

const stepTwoSchema = z.object({
  headline: z.string().trim().min(4).max(100),
  fluency: z.array(z.string()).min(1, "Pick at least one"),
  hourly_rate_usd: z.number().min(1).max(10000),
  years_experience: z.number().int().min(0).max(80),
});

const stepThreeSchema = z.object({
  portfolio_urls: z.array(z.string().url()).max(5),
  bio: z.string().trim().min(10).max(600),
});

function CoderOnboarding() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [homeLanguage, setHomeLanguage] = useState("");

  // Step 2
  const [headline, setHeadline] = useState("");
  const [fluency, setFluency] = useState<string[]>([]);
  const [rate, setRate] = useState<string>("");
  const [yearsExperience, setYearsExperience] = useState<string>("");

  // Step 3
  const [urls, setUrls] = useState<string[]>([""]);
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  // Prefill from profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.username) setUsername((u) => u || data.username!);
        if (data?.display_name) setDisplayName((d) => d || data.display_name!);
      });
  }, [user]);

  function next() {
    if (step === 1) {
      const r = stepOneSchema.safeParse({ display_name: displayName, username, location, home_language: homeLanguage });
      if (!r.success) return toast.error(r.error.issues[0].message);
      setStep(2);
    } else if (step === 2) {
      const r = stepTwoSchema.safeParse({ headline, fluency, hourly_rate_usd: Number(rate), years_experience: Number(yearsExperience) });
      if (!r.success) return toast.error(r.error.issues[0].message);
      setStep(3);
    }
  }

  async function submit() {
    if (!user) return;
    const cleanedUrls = urls.map((u) => u.trim()).filter(Boolean);
    const three = stepThreeSchema.safeParse({ portfolio_urls: cleanedUrls, bio });
    if (!three.success) return toast.error(three.error.issues[0].message);

    setSubmitting(true);

    // Update display name + username on profiles
    const { error: pErr } = await supabase
      .from("profiles")
      .update({ display_name: displayName, username })
      .eq("id", user.id);
    if (pErr) {
      setSubmitting(false);
      const isDuplicateUsername =
        pErr.code === "23505" ||
        /duplicate key|already exists|unique constraint/i.test(pErr.message) ||
        (pErr.message?.toLowerCase().includes("username") ?? false);
      return toast.error(
        isDuplicateUsername
          ? "That username is already taken, please choose another"
          : pErr.message,
      );
    }

    const { error: cErr } = await supabase.from("coder_profiles").upsert({
      profile_id: user.id,
      location,
      home_language: homeLanguage,
      headline,
      fluency,
      hourly_rate_usd: Number(rate),
      years_experience: Number(yearsExperience),
      portfolio_urls: cleanedUrls,
      bio,
    });

    setSubmitting(false);
    if (cErr) return toast.error(cErr.message);

    toast.success("Profile published");
    navigate({ to: "/coders/$coderId", params: { coderId: username } });
  }

  const progress = useMemo(() => (step / 3) * 100, [step]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
            <span>Step {step} of 3</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-surface">
            <div className="h-full bg-gradient-akda transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <h1 className="mb-2 text-3xl font-semibold tracking-tight">
          {step === 1 && "About you"}
          {step === 2 && "What you build"}
          {step === 3 && "Show your work"}
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">
          {step === 1 && "Help clients recognize you and know where you're based."}
          {step === 2 && "Set the tone for your offers and price your time."}
          {step === 3 && "Link verified work and write a short intro."}
        </p>

        {step === 1 && (
          <div className="space-y-4">
            <Field label="Display name">
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Mira Cruz" />
            </Field>
            <Field label="Username">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="miracode" />
            </Field>
            <Field label="Location">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Manila, Philippines" />
            </Field>
            <Field label="Home language">
              <Input value={homeLanguage} onChange={(e) => setHomeLanguage(e.target.value)} placeholder="Tagalog" />
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Field label="Specialty headline">
              <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Full-stack web apps with React + Django" />
            </Field>
            <Field label="Fluency tags">
              <div className="flex flex-wrap gap-2">
                {FLUENCY_OPTIONS.map((tag) => {
                  const active = fluency.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() =>
                        setFluency((prev) => (active ? prev.filter((t) => t !== tag) : [...prev, tag]))
                      }
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? "border-primary bg-primary/15 text-primary shadow-glow"
                          : "border-border bg-surface text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Hourly rate (USD)">
              <Input type="number" min={1} value={rate} onChange={(e) => setRate(e.target.value)} placeholder="45" />
            </Field>
            <Field label="Years of experience">
              <Input type="number" min={0} max={80} value={yearsExperience} onChange={(e) => setYearsExperience(e.target.value)} placeholder="5" />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Field label="Portfolio URLs (up to 5)">
              <div className="space-y-2">
                {urls.map((u, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      value={u}
                      onChange={(e) => setUrls((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
                      placeholder="https://github.com/you/project"
                    />
                    {urls.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => setUrls((prev) => prev.filter((_, idx) => idx !== i))}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {urls.length < 5 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setUrls((prev) => [...prev, ""])}>
                    <Plus className="h-4 w-4" /> Add another
                  </Button>
                )}
              </div>
            </Field>
            <Field label="Short bio">
              <Textarea
                rows={5}
                maxLength={600}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A few sentences about your experience, your approach, and what you love to build."
              />
              <div className="mt-1 text-right text-xs text-muted-foreground">{bio.length}/600</div>
            </Field>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2) : s))}
            disabled={step === 1 || submitting}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          {step < 3 ? (
            <Button onClick={next} className="bg-gradient-akda text-primary-foreground shadow-glow">
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={submit} disabled={submitting} className="bg-gradient-akda text-primary-foreground shadow-glow">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Publish profile
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
