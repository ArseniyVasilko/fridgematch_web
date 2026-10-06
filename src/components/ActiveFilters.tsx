import Link from "next/link";
import { X } from "lucide-react";
import { chip } from "./ui";

/** The filters that are on, each removable with one tap, plus "Clear filters". */
export function ActiveFilters({ chips, clearHref }: { chips: { label: string; href: string }[]; clearHref: string }) {
  if (chips.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link key={c.label} href={c.href} scroll={false} className={chip} aria-label={`Remove ${c.label} filter`}>
          {c.label} <X className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ))}
      <Link href={clearHref} scroll={false} className="text-sm font-bold text-brown-dark underline">
        Clear filters
      </Link>
    </div>
  );
}
