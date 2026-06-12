import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  Lock,
  MessageSquare,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ProgressTracker } from "@/components/ProgressTracker";
import { CommendationDialog } from "@/components/CommendationDialog";
import { stageOrder, type WorkspaceStage } from "@/data/workspaces";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type EscrowStatus = "pending" | "funded" | "released" | "refunded";

interface DbWorkspace {
  id: string;
  customer_id: string;
  coder_id: string;
  project: {
    title: string;
    description: string;
    budget_usd: number;
    deadline: string;
  };
  escrow: {
    status: EscrowStatus;
    amount_usd: number;
  } | null;
  customer: { display_name: string | null; username: string | null };
  coder: { display_name: string | null; username: string | null };
}

interface ChatMessage {
  id: string;
  sender_id: string | null;
  body: string;
  is_system: boolean;
  created_at: string;
}

function escrowToStage(status: EscrowStatus | undefined): WorkspaceStage {
  switch (status) {
    case "funded":
      return "development";
    case "released":
      return "released";
    case "refunded":
      return "initialized";
    case "pending":
    default:
      return "escrow";
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export const Route = createFileRoute("/workspaces/$workspaceId")({
  head: ({ params }) => ({
    meta: [{ title: `Workspace ${params.workspaceId} · Akda` }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="text-3xl font-semibold">Workspace not found</h1>
        <Link to="/" className="mt-6 inline-block text-akda hover:underline">Back home</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-32 text-center text-muted-foreground">{error.message}</div>
    </div>
  ),
  component: WorkspacePage,
});

function WorkspacePage() {
  const { workspaceId } = Route.useParams();
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<DbWorkspace | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [commendOpen, setCommendOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const stage: WorkspaceStage = escrowToStage(workspace?.escrow?.status);
  const released = stage === "released";
  const isCustomer = !!user && workspace?.customer_id === user.id;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const { data: ws, error: wsErr } = await supabase
        .from("workspaces")
        .select("id, customer_id, coder_id, project_id")
        .eq("id", workspaceId)
        .maybeSingle();

      if (cancelled) return;
      if (wsErr || !ws) {
        setNotFoundState(true);
        setLoading(false);
        return;
      }

      const [{ data: project }, { data: escrow }, { data: customer }, { data: coder }] = await Promise.all([
        supabase.from("projects").select("title, description, budget_usd, deadline").eq("id", ws.project_id).maybeSingle(),
        supabase.from("escrow").select("status, amount_usd").eq("project_id", ws.project_id).maybeSingle(),
        supabase.from("profiles").select("display_name, username").eq("id", ws.customer_id).maybeSingle(),
        supabase.from("profiles").select("display_name, username").eq("id", ws.coder_id).maybeSingle(),
      ]);

      if (cancelled) return;
      if (!project) {
        setNotFoundState(true);
        setLoading(false);
        return;
      }

      setWorkspace({
        id: ws.id,
        customer_id: ws.customer_id,
        coder_id: ws.coder_id,
        project: {
          title: project.title,
          description: project.description,
          budget_usd: Number(project.budget_usd),
          deadline: project.deadline,
        },
        escrow: escrow ? { status: escrow.status as EscrowStatus, amount_usd: Number(escrow.amount_usd) } : null,
        customer: customer ?? { display_name: null, username: null },
        coder: coder ?? { display_name: null, username: null },
      });

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, body, is_system, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      setMessages((msgs as ChatMessage[]) ?? []);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const fireConfetti = () => {
    const end = Date.now() + 1200;
    const colors = ["#3b82f6", "#60a5fa", "#a78bfa", "#22d3ee"];
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors });
  };

  const handleReleasePayment = async () => {
    if (!workspace) return;
    setReleasing(true);
    const { data: ws } = await supabase.from("workspaces").select("project_id").eq("id", workspace.id).maybeSingle();
    if (!ws) {
      setReleasing(false);
      return;
    }
    const { error } = await supabase
      .from("escrow")
      .update({ status: "released" })
      .eq("project_id", ws.project_id);
    if (error) {
      toast.error("Could not release payment", { description: error.message });
      setReleasing(false);
      return;
    }
    await supabase.from("messages").insert({
      workspace_id: workspace.id,
      sender_id: null,
      is_system: true,
      body: `Payment of $${(workspace.escrow?.amount_usd ?? workspace.project.budget_usd).toLocaleString()} released.`,
    });
    setWorkspace({ ...workspace, escrow: { status: "released", amount_usd: workspace.escrow?.amount_usd ?? workspace.project.budget_usd } });
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, sender_id, body, is_system, created_at")
      .eq("workspace_id", workspace.id)
      .order("created_at", { ascending: true });
    setMessages((msgs as ChatMessage[]) ?? []);
    fireConfetti();
    toast.success("Payment released");
    setReleasing(false);
    setTimeout(() => setCommendOpen(true), 600);
  };

  const handleSend = async () => {
    if (!workspace || !user) return;
    const text = draft.trim();
    if (!text) return;
    if (text.length > 1000) {
      toast.error("Message too long", { description: "Keep it under 1000 characters." });
      return;
    }
    setSending(true);
    const { data: inserted, error } = await supabase
      .from("messages")
      .insert({ workspace_id: workspace.id, sender_id: user.id, body: text })
      .select("id, sender_id, body, is_system, created_at")
      .single();
    setSending(false);
    if (error || !inserted) {
      toast.error("Could not send message", { description: error?.message });
      return;
    }
    setMessages((prev) => [...prev, inserted as ChatMessage]);
    setDraft("");
  };

  const submitCommendation = ({ rating, note }: { rating: number; note: string }) => {
    setCommendOpen(false);
    const coderName = workspace?.coder?.display_name || workspace?.coder?.username || "the coder";
    toast.success("Commendation sent", { description: `${rating}★ for ${coderName}.${note ? " Thanks for the note!" : ""}` });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-6 py-32 text-center text-muted-foreground">Loading workspace…</div>
      </div>
    );
  }

  if (notFoundState || !workspace) {
    throw notFound();
  }

  const customerName = workspace.customer?.display_name || workspace.customer?.username || "Customer";
  const coderName = workspace.coder?.display_name || workspace.coder?.username || "Coder";
  const coderSlug = workspace.coder?.username || workspace.coder_id;
  const amount = workspace.escrow?.amount_usd ?? workspace.project.budget_usd;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <CommendationDialog
        open={commendOpen}
        coderName={coderName}
        onClose={() => setCommendOpen(false)}
        onSubmit={submitCommendation}
      />

      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link to="/coders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All coders
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-akda" />
              <p className="font-mono text-xs uppercase tracking-wider text-akda">Private Workspace · {workspace.id.slice(0, 8)}</p>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{workspace.project.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Between <span className="text-foreground">{customerName}</span> and{" "}
              <Link to="/coders/$coderId" params={{ coderId: coderSlug }} className="text-foreground hover:text-akda">{coderName}</Link>
              {" · "}due {workspace.project.deadline}
            </p>
          </div>
        </div>

        {/* Progress tracker */}
        <div className="mt-8">
          <ProgressTracker stage={stage} />
        </div>

        {/* Action bar */}
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-akda/10 text-akda">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Escrow · {workspace.escrow?.status ?? "pending"}</p>
              <p className="text-xl font-semibold">${Number(amount).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isCustomer && !released && (
              <button
                onClick={handleReleasePayment}
                disabled={workspace.escrow?.status !== "funded" || releasing}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-akda px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100"
                title={workspace.escrow?.status !== "funded" ? "Fund escrow first" : "Release escrowed funds"}
              >
                <Sparkles className="h-4 w-4" /> Release Payment
              </button>
            )}
            {released && (
              <span className="inline-flex items-center gap-2 rounded-xl border border-status-open/30 bg-status-open/10 px-4 py-2.5 text-sm font-medium text-status-open">
                <CheckCircle2 className="h-4 w-4" /> Payment released
              </span>
            )}
          </div>
        </div>

        {/* Body grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <p className="font-mono text-[10px] uppercase tracking-wider text-akda">Brief</p>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-foreground/90">{workspace.project.description}</p>
            </div>
          </section>

          {/* Chat */}
          <section className="flex h-[560px] flex-col rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-akda">
                <MessageSquare className="h-3 w-3" /> Workspace chat
              </p>
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-open opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-status-open" />
                </span>
                Live · encrypted
              </span>
            </div>

            {!bannerDismissed && (
              <div className="mx-3 mt-3 flex items-start gap-2.5 rounded-xl border border-status-working/30 bg-status-working/5 p-3">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-working" />
                <p className="flex-1 text-xs leading-relaxed text-foreground/85">
                  Keep payments and file transfers within Akda to stay protected by our Escrow guarantee.
                </p>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss safety banner"
                >
                  Got it
                </button>
              </div>
            )}

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-5">
              {messages.length === 0 && (
                <p className="text-center text-xs text-muted-foreground">No messages yet — say hello.</p>
              )}
              {messages.map((m) => {
                if (m.is_system) {
                  return (
                    <div key={m.id} className="flex items-center gap-2 text-center text-[11px] text-muted-foreground">
                      <span className="h-px flex-1 bg-border" />
                      <span className="font-mono">{m.body}</span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  );
                }
                const fromMe = !!user && m.sender_id === user.id;
                const authorName = m.sender_id === workspace.customer_id ? customerName : coderName;
                return (
                  <div key={m.id} className={`flex ${fromMe ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%]">
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${fromMe ? "bg-gradient-akda text-primary-foreground" : "bg-surface text-foreground"}`}>
                        {m.body}
                      </div>
                      <p className={`mt-1 px-1 font-mono text-[10px] text-muted-foreground ${fromMe ? "text-right" : "text-left"}`}>
                        {authorName} · {formatTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={user ? "Message…" : "Sign in to chat"}
                  disabled={!user || sending}
                  className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-akda focus:outline-none focus:ring-1 focus:ring-akda disabled:opacity-60"
                />
                <button
                  onClick={handleSend}
                  disabled={!user || sending}
                  className="rounded-xl bg-gradient-akda p-2.5 text-primary-foreground shadow-glow transition-transform hover:scale-[1.05] disabled:opacity-50"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>

        {!isCustomer && user && workspace.coder_id === user.id && (
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-surface/50 p-5">
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="h-4 w-4 text-akda" />
              <span>Track payouts and Akda's 10% commission on your earnings dashboard.</span>
            </div>
            <Link
              to="/earnings/$coderId"
              params={{ coderId: coderSlug }}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-akda/50"
            >
              Open earnings →
            </Link>
          </div>
        )}

        {/* Reference: stages used by tracker */}
        <p className="sr-only">Stages: {stageOrder.join(", ")}</p>
      </div>
    </div>
  );
}
