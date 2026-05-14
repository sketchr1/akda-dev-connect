import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects/new")({
  component: PostProjectPage,
  head: () => ({
    meta: [
      { title: "Post a project · Akda" },
      { name: "description", content: "Describe your project, set a budget, and let vetted Akda coders bid for the job." },
    ],
  }),
});

const SKILL_OPTIONS = [
  "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust",
  "Ruby", "PHP", "Swift", "Kotlin", "React", "Vue", "Next.js", "Node.js",
  "Django", "Rails", "SQL", "GraphQL", "AWS", "Docker", "Kubernetes",
];

const schema = z.object({
  title: z.string().trim().min(4, "At least 4 characters").max(120),
  description: z.string().trim().min(20, "At least 20 characters").max(4000),
  budget_usd: z.number().min(1, "Budget must be at least $1").max(1_000_000),
  deadline: z.date({ required_error: "Pick a deadline" }),
  skills: z.array(z.string()).min(1, "Pick at least one skill"),
});

function PostProjectPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [skills, setSkills] = useState<string[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  const toggleSkill = (s: string) =>
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const parsed = schema.safeParse({
      title,
      description,
      budget_usd: Number(budget),
      deadline,
      skills,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check the form");
      return;
    }

    setSubmitting(true);
    try {
      const { data: project, error: pErr } = await supabase
        .from("projects")
        .insert({
          customer_id: user.id,
          title: parsed.data.title,
          description: parsed.data.description,
          budget_usd: parsed.data.budget_usd,
          deadline: format(parsed.data.deadline, "yyyy-MM-dd"),
          skills: parsed.data.skills,
          status: "open",
        })
        .select("id")
        .single();
      if (pErr || !project) throw pErr ?? new Error("Failed to create project");

      const { error: eErr } = await supabase
        .from("escrow")
        .insert({ project_id: project.id, status: "pending" });
      if (eErr) throw eErr;

      toast.success("Project posted — coders can now find it.");
      navigate({ to: "/coders" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-12">
        <Link to="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Post a project</h1>
          <p className="mt-2 text-muted-foreground">
            Tell coders what you're building. Funds stay in Akda Escrow until you're happy with the delivery.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-8 rounded-2xl border border-border/50 bg-surface/40 p-8 backdrop-blur">
          <div className="space-y-2">
            <Label htmlFor="title">Project title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build a Next.js dashboard for our analytics team" maxLength={120} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Goals, deliverables, tech stack, any constraints…" rows={7} maxLength={4000} />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input id="budget" type="number" min={1} step="1" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="2500" />
            </div>

            <div className="space-y-2">
              <Label>Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !deadline && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deadline ? format(deadline, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Required skills</Label>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((s) => {
                const active = skills.includes(s);
                return (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSkill(s)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {s}
                    {active && <X className="ml-1.5 inline h-3 w-3" />}
                  </button>
                );
              })}
            </div>
            {skills.length > 0 && (
              <p className="text-xs text-muted-foreground">{skills.length} selected</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/" })}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-gradient-akda text-primary-foreground shadow-glow">
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Post project
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
