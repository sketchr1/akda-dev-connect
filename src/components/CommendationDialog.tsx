import { useState } from "react";
import { Award, Star, X } from "lucide-react";

export function CommendationDialog({
  open,
  coderName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  coderName: string;
  onClose: () => void;
  onSubmit: (data: { rating: number; note: string }) => void;
}) {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-card">
        <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-akda/30 blur-3xl" />

        <div className="relative">
          <button onClick={onClose} className="absolute right-0 top-0 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-akda shadow-glow">
            <Award className="h-6 w-6 text-primary-foreground" />
          </div>

          <h3 className="mt-4 text-xl font-semibold tracking-tight">Leave a commendation</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Funds released to <span className="text-foreground">{coderName}</span>. Help future clients by sharing how it went.
          </p>

          <div className="mt-6">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Rating</p>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="rounded-md p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={`h-7 w-7 ${n <= rating ? "fill-akda text-akda" : "text-muted-foreground/40"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <label className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Note (optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Shipped clean code, communicative, would hire again…"
              className="mt-2 w-full resize-none rounded-xl border border-border bg-surface p-3 text-sm placeholder:text-muted-foreground focus:border-akda focus:outline-none focus:ring-1 focus:ring-akda"
            />
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Skip
            </button>
            <button
              onClick={() => onSubmit({ rating, note })}
              className="rounded-lg bg-gradient-akda px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
            >
              Submit commendation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
