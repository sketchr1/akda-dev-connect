import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Award, BadgeCheck, CheckCircle2, Clock, MapPin, MessageSquare, Settings } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SendBriefDialog } from "@/components/SendBriefDialog";
import { getCoder, statusConfig, type Coder } from "@/data/coders";
import { supabase } from "@/integrations/supabase/client";

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "??";
}

async function loadCoderFromDb(usernameOrId: string): Promise<{ coder: Coder; coderUserId: string } | null> {
  const { data: byUsername } = await supabase
    .from("profiles")
    .select("id, username, display_name, role")
    .eq("username", usernameOrId)
    .maybeSingle();

  let profile = byUsername;
  if (!profile) {
    const { data: byId } = await supabase
      .from("profiles")
      .select("id, username, display_name, role")
      .eq("id", usernameOrId)
      .maybeSingle();
    profile = byId;
  }
  if (!profile || profile.role !== "coder") return null;

  const { data: cp } = await supabase
    .from("coder_profiles")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle();

  if (!cp) {
    throw redirect({ to: "/onboarding/coder" });
  }

  const name = profile.display_name || profile.username || "Coder";
  return {
    coderUserId: profile.id,
    coder: {
      id: profile.username || profile.id,
      name,
      handle: `@${profile.username ?? ""}`,
      title: cp.headline ?? "",
      bio: cp.bio ?? "",
      homeLanguage: cp.home_language ?? "",
      fluency: cp.fluency ?? [],
      status: "open",
      commendations: 0,
      hourlyRate: Number(cp.hourly_rate_usd ?? 0),
      yearsExperience: 0,
      location: cp.location ?? "",
      initials: initialsOf(name),
      accent: "from-blue-500 to-cyan-400",
      portfolio: (cp.portfolio_urls ?? []).map((url: string) => ({
        title: url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
        description: url,
        image: "",
        client: "",
      })),
    },
  };
}

export const Route = createFileRoute("/coders/$coderId")({
  loader: async ({ params }): Promise<{ coder: Coder; coderUserId: string | null }> => {
    const mock = getCoder(params.coderId);
    if (mock) return { coder: mock, coderUserId: null };
    const dbCoder = await loadCoderFromDb(params.coderId);
    if (!dbCoder) throw notFound();
    return dbCoder;
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.coder.name} — Akda` },
          { name: "description", content: loaderData.coder.bio },
          { property: "og:title", content: `${loaderData.coder.name} on Akda` },
          { property: "og:description", content: loaderData.coder.title },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <h1 className="text-3xl font-semibold">Coder not found</h1>
        <Link to="/coders" className="mt-6 inline-block text-akda hover:underline">Back to directory</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <p className="text-muted-foreground">{error.message}</p>
      </div>
    </div>
  ),
  component: CoderProfile,
});

function CoderProfile() {
  const { coder } = Route.useLoaderData() as { coder: Coder };
  const status = statusConfig[coder.status];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/coders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> All coders
        </Link>

        {/* Header card */}
        <div className="relative mt-6 overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-card md:p-10">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-akda/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-5">
              <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${coder.accent} font-mono text-2xl font-bold text-white shadow-glow`}>
                {coder.initials}
              </div>
              <div>
                <div className={`mb-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${status.bg}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${coder.status === "open" ? "animate-pulse" : ""}`} />
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${status.text}`}>{status.label}</span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{coder.name}</h1>
                <p className="font-mono text-sm text-muted-foreground">{coder.handle}</p>
                <p className="mt-3 max-w-lg text-muted-foreground">{coder.title}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 md:items-end">
              <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-akda px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]">
                <MessageSquare className="h-4 w-4" /> Send a brief
              </button>
              <p className="font-mono text-xs text-muted-foreground">${coder.hourlyRate}/hr · responds in ~3h</p>
              <div className="mt-2 flex gap-2 text-xs">
                <Link to="/workspaces/$workspaceId" params={{ workspaceId: "ws-001" }} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-muted-foreground transition-colors hover:border-akda/50 hover:text-foreground">
                  Demo workspace
                </Link>
                <Link to="/earnings/$coderId" params={{ coderId: coder.id }} className="rounded-lg border border-border bg-surface px-3 py-1.5 text-muted-foreground transition-colors hover:border-akda/50 hover:text-foreground">
                  Earnings
                </Link>
              </div>
            </div>
          </div>

          <div className="relative mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4">
            {[
              { icon: Award, label: "Commendations", value: coder.commendations },
              { icon: Clock, label: "Years", value: coder.yearsExperience },
              { icon: MapPin, label: "Location", value: coder.location },
              { icon: CheckCircle2, label: "Home Language", value: coder.homeLanguage },
            ].map((s) => (
              <div key={s.label} className="bg-card p-4">
                <s.icon className="h-4 w-4 text-akda" />
                <p className="mt-2 text-lg font-semibold">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* About + Fluency */}
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="font-mono text-xs uppercase tracking-wider text-akda">About</h2>
            <p className="mt-3 text-lg leading-relaxed text-foreground/90">{coder.bio}</p>
          </div>
          <div className="space-y-6">
            <div>
              <h2 className="font-mono text-xs uppercase tracking-wider text-akda">Fluency</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {coder.fluency.map((t) => (
                  <span key={t} className="rounded-md border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs">{t}</span>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-mono text-xs uppercase tracking-wider text-akda">Casual chat</h2>
                <Link
                  to="/coders/$coderId/settings"
                  params={{ coderId: coder.id }}
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Edit settings"
                >
                  <Settings className="h-3.5 w-3.5" />
                </Link>
              </div>
              {coder.discord ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5865F2]/15 text-[#7c8aff]">
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                      <path d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.078.037c-.21.375-.444.864-.608 1.249a18.27 18.27 0 0 0-5.487 0 12.66 12.66 0 0 0-.617-1.25.077.077 0 0 0-.078-.036c-1.714.296-3.354.815-4.885 1.515a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.027c.461-.63.873-1.295 1.226-1.994a.076.076 0 0 0-.041-.105 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.927 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.04.106c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.673-3.549-13.66a.06.06 0 0 0-.031-.028zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.418 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.956 2.417-2.157 2.417zm7.974 0c-1.182 0-2.157-1.085-2.157-2.418 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.332-.946 2.417-2.157 2.417z" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-mono text-sm">{coder.discord.handle}</p>
                      {coder.discord.verified && (
                        <span title="Verified link" className="inline-flex items-center gap-0.5 rounded-full border border-akda/30 bg-akda/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-akda">
                          <BadgeCheck className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {coder.discord.verified ? "Casual chat — payments must stay on Akda." : "Self-reported, not verified by Akda."}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-muted-foreground">No external chat linked.</p>
              )}
            </div>
          </div>
        </div>

        {/* Portfolio */}
        <div className="mt-16">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-mono text-xs uppercase tracking-wider text-akda">Portfolio</h2>
              <p className="mt-2 text-2xl font-semibold tracking-tight">Verified completed projects</p>
            </div>
            <span className="hidden items-center gap-1.5 text-xs text-muted-foreground md:inline-flex">
              <CheckCircle2 className="h-3.5 w-3.5 text-status-open" /> Each project confirmed by the client
            </span>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {coder.portfolio.map((p) => (
              <article key={p.title} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all hover:border-akda/50">
                <div className="relative aspect-[16/10] overflow-hidden bg-surface">
                  <img src={p.image} alt={p.title} loading="lazy" width={1024} height={640} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full border border-status-open/30 bg-background/80 px-2 py-1 text-[10px] uppercase tracking-wider text-status-open backdrop-blur">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </div>
                </div>
                <div className="p-5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{p.client}</p>
                  <h3 className="mt-1 text-lg font-semibold">{p.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
