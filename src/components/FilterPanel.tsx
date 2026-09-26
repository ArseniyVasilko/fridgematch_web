"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

/** Filter sidebar: always open on desktop, collapsible on phones. */
export function FilterPanel({ children, activeCount }: { children: React.ReactNode; activeCount: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 className="font-sans text-base font-extrabold text-ink">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className="flex w-full items-center justify-between lg:pointer-events-none"
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4" aria-hidden /> Filter recipes
            {activeCount > 0 && (
              <span className="rounded-full bg-brown px-2 text-xs font-bold text-white">{activeCount}</span>
            )}
          </span>
          <ChevronDown className={`h-5 w-5 transition lg:hidden ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </h2>
      <div id="filter-panel" className={`${open ? "block" : "hidden"} lg:block`}>
        {children}
      </div>
    </div>
  );
}
