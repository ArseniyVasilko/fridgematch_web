"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
}

export function MobileMenu({ links, children }: { links: NavLink[]; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // close the menu after navigating (adjusting state during render, not in an effect)
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl p-2 text-brown-dark hover:bg-sand"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
      </button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="absolute inset-x-0 top-full z-[60] border-b border-line bg-cream px-4 pb-4 pt-2 shadow-lg"
        >
          <ul className="flex flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={pathname === l.href ? "page" : undefined}
                  className="block rounded-xl px-3 py-3 text-lg font-bold text-brown-dark hover:bg-sand aria-[current=page]:bg-sand"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-line pt-3">{children}</div>
        </nav>
      )}
    </div>
  );
}
