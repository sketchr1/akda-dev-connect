import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { CoderCard } from "@/components/CoderCard";
import { coders as placeholderCoders, type Coder, type CoderStatus, statusConfig } from "@/data/coders";
import { supabase } from "@/integrations/supabase/client";

const accents = [
  "from-blue-500 to-cyan-400",
  "from-indigo-500 to-blue-500",
  "from-violet-500 to-fuchsia-500",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-500",
  "from-sky-500 to-blue-600",
];

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "??"
  );
}

export const Route = createFileRoute("/coders/")({
  head: () => ({
    meta: [
      { title: "Browse Coders — Akda" },
      { name: "description", content: "Browse verified developers by language, fluency, and availability on Akda." },
      { property: "og:title", content: "Browse Coders — Akda" },
      { property: "og:description", content: "Find vetted developers ready to ship." },
    ],
  }),
  component: BrowseCoders,
});

function BrowseCoders() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CoderStatus | "all">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [coders, setCoders] = useState<Coder[]>(placeholderCoders);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: rows } = await supabase
        .from("coder_profiles")
        .select("profile_id, headline, bio, home_language, fluency, hourly_rate_usd, location, availability, commendation_count, profiles!inner(username, display_name)");
      if (cancelled) return;
      const real: Coder[] = (rows ?? []).map((r: any, i: number) => {
        const p = r.profiles;
        const name = p?.display_name || p?.username || "Coder";
        return {
          id: p?.username || r.profile_id,
          name,
          handle: p?.username ? `@${p.username}` : "",
          title: r.headline ?? "",
          bio: r.bio ?? "",
          homeLanguage: r.home_language ?? "",
          fluency: r.fluency ?? [],
          status: (r.availability ?? "open") as CoderStatus,
          commendations: Number(r.commendation_count ?? 0),
          hourlyRate: Number(r.hourly_rate_usd ?? 0),
          yearsExperience: 0,
          location: r.location ?? "",
          initials: initialsOf(name),
          accent: accents[i % accents.length],
          portfolio: [],
        };
      });
      setCoders(real.length >= 10 ? real : [...real, ...placeholderCoders]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const allTags = useMemo(
    () => Array.from(new Set(coders.flatMap((c) => c.fluency))).sort(),
    [coders],
  );

  const filtered = useMemo(() => {
    return coders.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (tagFilter && !c.fluency.includes(tagFilter)) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          c.name.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.fluency.some((t) => t.toLowerCase().includes(q)) ||
          c.homeLanguage.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [coders, query, statusFilter, tagFilter]);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-xs uppercase tracking-wider text-akda">Directory</p>
          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Find your coder.</h1>
          <p className="max-w-xl text-muted-foreground">{loading ? "Loading…" : `${coders.length} verified developers.`} Filter by fluency, availability, or home language.</p>
        </div>

        {/* Search */}
        <div className="mt-10 flex flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, language, or skill…"
              className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-sm placeholder:text-muted-foreground focus:border-akda focus:outline-none focus:ring-1 focus:ring-akda"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Status</span>
            {(["all", "open", "working", "busy"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  statusFilter === s
                    ? "border-akda bg-akda/10 text-akda"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "All" : statusConfig[s].label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Fluency</span>
            <button
              onClick={() => setTagFilter(null)}
              className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                tagFilter === null ? "border-akda bg-akda/10 text-akda" : "border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(t === tagFilter ? null : t)}
                className={`rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                  tagFilter === t ? "border-akda bg-akda/10 text-akda" : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-8 font-mono text-xs text-muted-foreground">{filtered.length} result{filtered.length === 1 ? "" : "s"}</p>

        <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => <CoderCard key={c.id} coder={c} />)}
        </div>

        {filtered.length === 0 && (
          <div className="mt-16 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">No coders match those filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
