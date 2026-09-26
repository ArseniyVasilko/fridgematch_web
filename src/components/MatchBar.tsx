/** "You have 5/7 ingredients" progress bar used on recipe cards and details. */
export function MatchBar({ score, className = "" }: { score: number; className?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);
  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-sand-deep ${className}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-label={`${pct}% ingredient match`}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent to-brown"
        style={{ width: `${Math.max(pct, 4)}%` }}
      />
    </div>
  );
}
