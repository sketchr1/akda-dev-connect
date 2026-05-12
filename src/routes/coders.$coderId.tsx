import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Award, CheckCircle2, Clock, MapPin, MessageSquare } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { getCoder, statusConfig } from "@/data/coders";

export const Route = createFileRoute("/coders/$coderId")({
  loader: ({ params }) => {
    const coder = getCoder(params.coderId);
    if (!coder) throw notFound();
    return { coder };
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
  const { coder } = Route.useLoaderData();
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
          <div>
            <h2 className="font-mono text-xs uppercase tracking-wider text-akda">Fluency</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {coder.fluency.map((t) => (
                <span key={t} className="rounded-md border border-border bg-surface-elevated px-2.5 py-1 font-mono text-xs">{t}</span>
              ))}
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
