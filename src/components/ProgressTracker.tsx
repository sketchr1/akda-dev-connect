import { Check } from "lucide-react";
import { stageLabels, stageOrder, type WorkspaceStage } from "@/data/workspaces";

export function ProgressTracker({ stage }: { stage: WorkspaceStage }) {
  const currentIndex = stageOrder.indexOf(stage);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-wider text-akda">Escrow Progress</p>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Stage {currentIndex + 1} / {stageOrder.length}
        </p>
      </div>

      <div className="mt-6">
        {/* Desktop horizontal */}
        <div className="hidden md:block">
          <div className="relative flex items-center justify-between">
            <div className="absolute left-0 right-0 top-4 h-0.5 bg-border" />
            <div
              className="absolute left-0 top-4 h-0.5 bg-gradient-akda transition-all duration-500"
              style={{ width: `${(currentIndex / (stageOrder.length - 1)) * 100}%` }}
            />
            {stageOrder.map((s, i) => {
              const done = i < currentIndex;
              const active = i === currentIndex;
              return (
                <div key={s} className="relative z-10 flex w-32 flex-col items-center text-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all ${
                      done
                        ? "border-akda bg-akda text-primary-foreground"
                        : active
                          ? "border-akda bg-background text-akda shadow-glow"
                          : "border-border bg-surface text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="h-4 w-4" /> : <span className="font-mono text-xs">{i + 1}</span>}
                    {active && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-akda/30" />}
                  </div>
                  <p className={`mt-3 text-xs leading-tight ${active ? "text-foreground font-medium" : done ? "text-foreground/80" : "text-muted-foreground"}`}>
                    {stageLabels[s]}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile vertical */}
        <ol className="md:hidden">
          {stageOrder.map((s, i) => {
            const done = i < currentIndex;
            const active = i === currentIndex;
            return (
              <li key={s} className="relative flex gap-4 pb-5 last:pb-0">
                {i < stageOrder.length - 1 && (
                  <span className={`absolute left-[17px] top-9 h-full w-0.5 ${done ? "bg-akda" : "bg-border"}`} />
                )}
                <div
                  className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                    done
                      ? "border-akda bg-akda text-primary-foreground"
                      : active
                        ? "border-akda bg-background text-akda shadow-glow"
                        : "border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-4 w-4" /> : <span className="font-mono text-xs">{i + 1}</span>}
                </div>
                <div className="pt-1.5">
                  <p className={`text-sm ${active ? "font-medium text-foreground" : done ? "text-foreground/80" : "text-muted-foreground"}`}>
                    {stageLabels[s]}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
