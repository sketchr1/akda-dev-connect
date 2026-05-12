import { Link } from "@tanstack/react-router";
import { Award, MapPin } from "lucide-react";
import { type Coder, statusConfig } from "@/data/coders";

export function CoderCard({ coder }: { coder: Coder }) {
  const status = statusConfig[coder.status];
  return (
    <Link
      to="/coders/$coderId"
      params={{ coderId: coder.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:border-akda/50 hover:shadow-glow"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-akda/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${coder.accent} font-mono text-sm font-bold text-white`}>
            {coder.initials}
          </div>
          <div>
            <h3 className="font-semibold leading-tight">{coder.name}</h3>
            <p className="font-mono text-xs text-muted-foreground">{coder.handle}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${status.bg}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.dot} ${coder.status === "open" ? "animate-pulse" : ""}`} />
          <span className={`text-[10px] font-medium uppercase tracking-wider ${status.text}`}>{status.label}</span>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">{coder.title}</p>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {coder.fluency.map((tag) => (
          <span key={tag} className="rounded-md border border-border bg-surface-elevated px-2 py-1 font-mono text-[11px] text-foreground/80">
            {tag}
          </span>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-akda/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-akda">{coder.homeLanguage}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{coder.location}</span>
          <span className="flex items-center gap-1 text-foreground"><Award className="h-3 w-3 text-akda" />{coder.commendations}</span>
        </div>
      </div>
    </Link>
  );
}
