/** Shared class names for the small FridgeMatch component set (style guide). */

export const btn = {
  primary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-brown px-5 py-2.5 font-bold text-white shadow-sm transition hover:bg-brown-hover disabled:opacity-60",
  outline:
    "inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brown/70 bg-card px-4 py-2 font-bold text-brown-dark transition hover:bg-sand",
  ghost:
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-semibold text-brown-dark transition hover:bg-sand",
  danger:
    "inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 font-semibold text-tomato transition hover:bg-tomato-soft",
};

export const chip =
  "inline-flex items-center gap-1 rounded-full border border-line bg-accent-soft px-3 py-1 text-sm font-semibold text-brown-dark transition hover:bg-accent/60";

export const card = "rounded-[var(--radius-card)] border border-line bg-card shadow-[var(--shadow-card)]";

export const input =
  "w-full rounded-xl border border-line bg-card px-3 py-2.5 text-ink placeholder:text-muted/80 focus:border-brown focus:outline-none focus:ring-2 focus:ring-brown/30";

export const label = "mb-1 block text-sm font-bold text-brown-dark";
