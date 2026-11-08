import { CheckCircle2, Sparkles } from "lucide-react";

export function ScanConfirmation({
  pointsAwarded,
  totalPoints,
}: {
  pointsAwarded: number;
  totalPoints: number;
}) {
  return (
    <section
      aria-live="polite"
      className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
          aria-hidden="true"
        />
        <div>
          <p className="font-semibold text-foreground">
            Scan complete · +{pointsAwarded} SpreadTheLoaf Points
          </p>
          <p className="text-sm text-muted-foreground">
            Saved to Auth0 · Balance: {totalPoints}
          </p>
        </div>
      </div>
      <span className="inline-flex items-center gap-2 text-sm font-medium text-primary">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        SpreadTheLoaf Points
      </span>
    </section>
  );
}
