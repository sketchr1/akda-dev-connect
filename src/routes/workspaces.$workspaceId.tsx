import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  DollarSign,
  FileUp,
  Lock,
  MessageSquare,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { ProgressTracker } from "@/components/ProgressTracker";
import { CommendationDialog } from "@/components/CommendationDialog";
import { getWorkspace, stageOrder, type Workspace, type WorkspaceStage } from "@/data/workspaces";
import { getCoder, type Coder } from "@/data/coders";

export const Route = createFileRoute("/workspaces/$workspaceId")({
  loader: ({ params }): { workspace: Workspace; coder: Coder } => {
    const workspace = getWorkspace(params.workspaceId);
    const coder = workspace ? getCoder(workspace.coderId) : undefined;
    if (!workspace || !coder) throw notFound();
    return { workspace, coder };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [{ title: `${loaderData.workspace.projectName} — Workspace · Akda` }]
      : [],
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

type Role = "customer" | "coder";

function WorkspacePage() {
  const data = Route.useLoaderData() as { workspace: Workspace; coder: Coder };
  const { coder } = data;

  const [stage, setStage] = useState<WorkspaceStage>(data.workspace.stage);
  const [messages, setMessages] = useState(data.workspace.messages);
  const [deliveries, setDeliveries] = useState(data.workspace.deliveries);
  const [draft, setDraft] = useState("");
  const [role, setRole] = useState<Role>("customer");
  const [commendOpen, setCommendOpen] = useState(false);
  const [typing, setTyping] = useState<Role | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const stageIndex = stageOrder.indexOf(stage);
  const released = stage === "released";

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

  const handleReleasePayment = () => {
    setStage("released");
    setMessages((m) => [
      ...m,
      { from: "system", author: "Akda", body: `Payment of $${data.workspace.amount.toLocaleString()} released to ${coder.name}.`, timestamp: "just now" },
    ]);
    fireConfetti();
    toast.success("Payment released", { description: `Funds sent to ${coder.name}.` });
    setTimeout(() => setCommendOpen(true), 600);
  };

  const handleRequestRevision = () => {
    setStage("development");
    setMessages((m) => [
      ...m,
      { from: "customer", author: data.workspace.customerName, body: "Requested revisions. Notes coming in chat.", timestamp: "just now" },
    ]);
    toast("Revision requested", { description: "Workspace moved back to Development." });
  };

  const handleUploadDelivery = () => {
    const next = {
      title: `v${deliveries.length + 1} — Delivery`,
      note: "Latest build attached. Awaiting client review.",
      timestamp: "just now",
      files: ["delivery.zip", "CHANGELOG.md"],
    };
    setDeliveries((d) => [...d, next]);
    setStage("review");
    setMessages((m) => [
      ...m,
      { from: "coder", author: coder.name, body: `Uploaded ${next.title}. Ready for review.`, timestamp: "just now" },
    ]);
    toast.success("Delivery uploaded", { description: "Customer notified for review." });
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    if (text.length > 1000) {
      toast.error("Message too long", { description: "Keep it under 1000 characters." });
      return;
    }
    // Naive off-platform payment detection — show inline coaching
    const offPlatform = /\b(paypal|venmo|gcash|zelle|bank transfer|wire|wechat|cashapp)\b/i;
    if (offPlatform.test(text)) {
      toast.warning("Off-platform payment detected", { description: "Keep payments inside Akda to stay covered." });
    }

    setMessages((m) => [
      ...m,
      {
        from: role,
        author: role === "customer" ? data.workspace.customerName : coder.name,
        body: text,
        timestamp: "just now",
      },
    ]);
    setDraft("");

    // Simulate live reply from the other side
    const other: Role = role === "customer" ? "coder" : "customer";
    setTyping(other);
    setTimeout(() => {
      setTyping(null);
      setMessages((m) => [
        ...m,
        {
          from: other,
          author: other === "customer" ? data.workspace.customerName : coder.name,
          body: other === "coder" ? "Got it — looking now." : "Thanks, will review shortly.",
          timestamp: "just now",
        },
      ]);
    }, 1400);
  };

  const submitCommendation = ({ rating, note }: { rating: number; note: string }) => {
    setCommendOpen(false);
    toast.success("Commendation sent", { description: `${rating}★ for ${coder.name}.${note ? " Thanks for the note!" : ""}` });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <CommendationDialog
        open={commendOpen}
        coderName={coder.name}
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
              <p className="font-mono text-xs uppercase tracking-wider text-akda">Private Workspace · {data.workspace.id}</p>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{data.workspace.projectName}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Between <span className="text-foreground">{data.workspace.customerName}</span> and{" "}
              <Link to="/coders/$coderId" params={{ coderId: coder.id }} className="text-foreground hover:text-akda">{coder.name}</Link>
              {" · "}due {data.workspace.deadline}
            </p>
          </div>

          {/* Role switch (demo) */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1 text-xs">
            <span className="px-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">View as</span>
            {(["customer", "coder"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`rounded-lg px-3 py-1.5 capitalize transition-colors ${
                  role === r ? "bg-gradient-akda text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
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
              <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Escrow balance</p>
              <p className="text-xl font-semibold">${data.workspace.amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {role === "coder" && !released && (
              <button
                onClick={handleUploadDelivery}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-elevated"
              >
                <FileUp className="h-4 w-4" /> Upload Delivery
              </button>
            )}
            {role === "customer" && stageIndex >= 2 && !released && (
              <button
                onClick={handleRequestRevision}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-elevated"
              >
                <RefreshCw className="h-4 w-4" /> Request Revision
              </button>
            )}
            {role === "customer" && !released && (
              <button
                onClick={handleReleasePayment}
                disabled={stage !== "review"}
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-akda px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:hover:scale-100"
                title={stage !== "review" ? "Wait until delivery is uploaded for review" : "Release escrowed funds"}
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
          {/* Brief + Deliveries */}
          <section className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <p className="font-mono text-[10px] uppercase tracking-wider text-akda">Brief</p>
              <p className="mt-3 leading-relaxed text-foreground/90">{data.workspace.brief}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] uppercase tracking-wider text-akda">Deliveries</p>
                <span className="font-mono text-[10px] text-muted-foreground">{deliveries.length} uploaded</span>
              </div>

              {deliveries.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No deliveries yet. The coder will upload builds here for review.
                </div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {deliveries.map((d, i) => (
                    <li key={i} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{d.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{d.note}</p>
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{d.timestamp}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {d.files.map((f) => (
                          <span key={f} className="rounded-md border border-border bg-background px-2 py-1 font-mono text-[11px] text-foreground/80">
                            {f}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
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

            {/* Safety warning banner */}
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
              {messages.map((m, i) => {
                if (m.from === "system") {
                  return (
                    <div key={i} className="flex items-center gap-2 text-center text-[11px] text-muted-foreground">
                      <span className="h-px flex-1 bg-border" />
                      <span className="font-mono">{m.body}</span>
                      <span className="h-px flex-1 bg-border" />
                    </div>
                  );
                }
                const isCoder = m.from === "coder";
                return (
                  <div key={i} className={`flex ${isCoder ? "justify-start" : "justify-end"}`}>
                    <div className="max-w-[85%]">
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${isCoder ? "bg-surface text-foreground" : "bg-gradient-akda text-primary-foreground"}`}>
                        {m.body}
                      </div>
                      <p className={`mt-1 px-1 font-mono text-[10px] text-muted-foreground ${isCoder ? "text-left" : "text-right"}`}>
                        {m.author} · {m.timestamp}
                      </p>
                    </div>
                  </div>
                );
              })}

              {typing && (
                <div className={`flex ${typing === "coder" ? "justify-start" : "justify-end"}`}>
                  <div className="flex items-center gap-1.5 rounded-2xl bg-surface px-3 py-2.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border p-3">
              <div className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder={`Message as ${role}…`}
                  className="flex-1 rounded-xl border border-border bg-surface px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-akda focus:outline-none focus:ring-1 focus:ring-akda"
                />
                <button
                  onClick={handleSend}
                  className="rounded-xl bg-gradient-akda p-2.5 text-primary-foreground shadow-glow transition-transform hover:scale-[1.05]"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Earnings shortcut for coder */}
        {role === "coder" && (
          <div className="mt-8 flex items-center justify-between rounded-2xl border border-border bg-surface/50 p-5">
            <div className="flex items-center gap-3 text-sm">
              <DollarSign className="h-4 w-4 text-akda" />
              <span>Track payouts and Akda's 10% commission on your earnings dashboard.</span>
            </div>
            <Link
              to="/earnings/$coderId"
              params={{ coderId: coder.id }}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-akda/50"
            >
              Open earnings →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
