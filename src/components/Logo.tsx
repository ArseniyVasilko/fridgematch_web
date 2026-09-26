import Link from "next/link";
import { LogoDashes } from "./illustrations";

export function Logo({ tagline = true }: { tagline?: boolean }) {
  return (
    <Link href="/" className="group inline-flex flex-col leading-none" aria-label="FridgeMatch home">
      <span className="flex items-center gap-1">
        <span className="font-display text-[1.9rem] text-brown-dark sm:text-[2.1rem]">FridgeMatch</span>
        <LogoDashes className="h-5 w-5 -translate-y-1" />
      </span>
      {tagline && <span className="mt-0.5 text-xs font-semibold text-muted">Good food. Less waste.</span>}
    </Link>
  );
}
