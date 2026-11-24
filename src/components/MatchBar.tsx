/**
 * "You have 5/7 ingredients" progress bar used on recipe cards and details.
 * The darker part is ingredients the user has enough of; the amber part is
 * ingredients they only have part of the amount of.
 */
export function MatchBar({
  haveCount,
  partialCount,
  total,
  className = "",
}: {
  haveCount: number;
  partialCount: number;
  total: number;
  className?: string;
}) {
  const share = (n: number) => (total > 0 ? Math.max(0, Math.min(1, n / total)) * 100 : 0);
  const full = share(haveCount - partialCount);
  const partial = share(partialCount);
  const label =
    `You have ${haveCount} of ${total} ingredients` + (partialCount > 0 ? `, ${partialCount} only partly` : "");
  return (
    <div
      className={`flex h-2 w-full overflow-hidden rounded-full bg-sand-deep ${className}`}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={haveCount}
      aria-label={label}
    >
      <div
        className="h-full bg-gradient-to-r from-accent to-brown"
        style={{ width: `${full > 0 ? Math.max(full, 4) : 0}%` }}
      />
      {partial > 0 && <div className="h-full bg-amber/70" style={{ width: `${partial}%` }} />}
    </div>
  );
}
