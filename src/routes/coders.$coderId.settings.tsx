import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, BadgeCheck, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteHeader } from "@/components/SiteHeader";
import { getCoder, type Coder } from "@/data/coders";

export const Route = createFileRoute("/coders/$coderId/settings")({
  loader: ({ params }): { coder: Coder } => {
    const coder = getCoder(params.coderId);
    if (!coder) throw notFound();
    return { coder };
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `Settings · ${loaderData.coder.name} — Akda` }] : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="text-3xl font-semibold">Coder not found</h1>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-32 text-center text-muted-foreground">{error.message}</div>
    </div>
  ),
  component: SettingsPage,
});

const discordSchema = z
  .string()
  .trim()
  .min(2, "Too short")
  .max(40, "Too long")
  .regex(/^[a-zA-Z0-9._#]+$/, "Use letters, numbers, . _ # only");

function SettingsPage() {
  const { coder } = Route.useLoaderData() as { coder: Coder };
  const [handle, setHandle] = useState(coder.discord?.handle ?? "");
  const [verified, setVerified] = useState(coder.discord?.verified ?? false);
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const save = () => {
    const result = discordSchema.safeParse(handle);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setError(null);
    setVerified(false);
    toast.success("Discord handle saved", { description: "Click Verify to add the verified badge." });
  };

  const verify = () => {
    const result = discordSchema.safeParse(handle);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setVerified(true);
      toast.success("Discord verified", { description: "Your verified badge is now live." });
    }, 1100);
  };

  const unlink = () => {
    setHandle("");
    setVerified(false);
    setError(null);
    toast("Discord unlinked", { description: "Removed from your public profile." });
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link to="/coders/$coderId" params={{ coderId: coder.id }} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to profile
        </Link>

        <div className="mt-6">
          <p className="font-mono text-xs uppercase tracking-wider text-akda">Settings · {coder.name}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">External chat</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Link a Discord handle for casual conversations. All paid work, files, and payments must stay on Akda to keep escrow protection.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2]/15 text-[#7c8aff]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.078.037c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.66 12.66 0 0 0-.617-1.25.077.077 0 0 0-.078-.036c-1.714.296-3.354.815-4.885 1.515a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.027c.461-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.105 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.04.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.673-3.549-13.66a.06.06 0 0 0-.031-.028zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.418 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.417-2.157 2.417zm7.974 0c-1.182 0-2.157-1.085-2.157-2.418 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.417-2.157 2.417z" />
              </svg>
            </div>
            <div>
              <p className="font-medium">Discord</p>
              <p className="text-xs text-muted-foreground">Public · shows on your profile when set.</p>
            </div>
            {verified && (
              <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-akda/30 bg-akda/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-akda">
                <BadgeCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>

          <div className="mt-5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Discord handle</label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="yourhandle"
              maxLength={40}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:border-akda focus:outline-none focus:ring-1 focus:ring-akda"
            />
            {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
            <p className="mt-2 text-xs text-muted-foreground">2–40 chars. Letters, numbers, . _ # only.</p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button onClick={save} className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-elevated">
              Save
            </button>
            <button
              onClick={verify}
              disabled={verifying || !handle}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-akda px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BadgeCheck className="h-4 w-4" />
              {verifying ? "Verifying…" : verified ? "Re-verify" : "Verify link"}
            </button>
            {handle && (
              <button
                onClick={unlink}
                className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Unlink
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex gap-3 rounded-2xl border border-status-working/30 bg-status-working/5 p-4 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-status-working" />
          <p className="text-muted-foreground">
            <span className="text-foreground">Stay protected.</span> Casual chats are fine off-platform, but project files and payments must stay inside Akda — anything else voids escrow protection.
          </p>
        </div>
      </div>
    </div>
  );
}
