import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Code2, ShieldCheck, Sparkles } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { CoderCard } from "@/components/CoderCard";
import { coders } from "@/data/coders";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Akda — Hire vetted developers, the right way" },
      { name: "description", content: "Akda is a curated freelance marketplace for developers. Browse coders by language fluency, status, and verified portfolios." },
      { property: "og:title", content: "Akda — Hire vetted developers" },
      { property: "og:description", content: "Curated freelance marketplace for developers. Verified portfolios, real commendations." },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = coders.slice(0, 3);
  const navigate = useNavigate();
  const { user, role, username, hasCoderProfile, loading } = useProfile();

  function handleCoderJoin() {
    if (loading) return;
    if (!user) {
      navigate({ to: "/signup", search: { role: "coder" } as never });
      return;
    }
    if (role === "coder") {
      if (hasCoderProfile && username) {
        navigate({ to: "/coders/$coderId", params: { coderId: username } });
      } else {
        navigate({ to: "/onboarding/coder" });
      }
    } else {
      navigate({ to: "/signup", search: { role: "coder" } as never });
    }
  }
  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img src={heroBg} alt="" width={1920} height={1088} className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 md:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <Sparkles className="h-3 w-3 text-akda" />
              <span>Now onboarding the first 500 coders</span>
            </div>
            <h1 className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              Hire developers who <span className="text-gradient-akda">actually ship</span>.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
              Akda is a curated marketplace where every coder is verified, every portfolio is real, and every project earns a commendation.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link to="/coders" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-akda px-6 py-3 font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02]">
                Browse coders <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button onClick={handleCoderJoin} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface/60 px-6 py-3 font-medium text-foreground backdrop-blur transition-colors hover:bg-surface-elevated">
                I'm a coder · join
              </button>
            </div>
            <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-border pt-8 text-left">
              {[
                { v: "1,200+", l: "Verified coders" },
                { v: "98%", l: "Project completion" },
                { v: "$3.2M", l: "Paid out in 2024" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="font-mono text-2xl font-semibold text-foreground">{s.v}</dt>
                  <dd className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="how" className="border-y border-border bg-surface/40">
        <div className="mx-auto grid max-w-7xl gap-px bg-border md:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Verified portfolios", body: "Every project is reviewed and confirmed by the client before it appears." },
            { icon: Code2, title: "Fluency tags", body: "See exactly which languages a coder ships in production — not just on a resume." },
            { icon: Sparkles, title: "Real commendations", body: "No 5-star inflation. Commendations are earned per completed milestone." },
          ].map((f) => (
            <div key={f.title} className="bg-background p-8">
              <f.icon className="h-5 w-5 text-akda" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured coders */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-akda">Featured</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Coders open for work</h2>
          </div>
          <Link to="/coders" className="hidden items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground md:inline-flex">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => <CoderCard key={c.id} coder={c} />)}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-muted-foreground md:flex-row">
          <p>© 2026 Akda. Built for coders who care.</p>
          <p className="font-mono">crafted in Manila · Seoul · Mexico City</p>
        </div>
      </footer>
    </div>
  );
}
