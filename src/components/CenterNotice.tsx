"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, X } from "lucide-react";
import { DURATIONS } from "@/lib/constants";
import { btn, card } from "./ui";

export interface Notice {
  message: string;
  /** success: hides by itself. error / info: stay until closed (they have a button to act on). */
  tone: "success" | "error" | "info";
  action?: { href: string; label: string };
}

const ShowNotice = createContext<(notice: Notice) => void>(() => {});

/** Shows a popup in the middle of the screen, e.g. "Saved to My Saved Recipes". */
export const useNotice = () => useContext(ShowNotice);

/**
 * One popup for the whole app (in the root layout), so it stays up when the
 * button that opened it goes away, e.g. a card removed from My Saved Recipes.
 */
export function NoticeProvider({ children }: { children: React.ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const actionRef = useRef<HTMLAnchorElement>(null);
  /** Where keyboard focus was when a popup with a button opened, to go back to on close. */
  const returnFocus = useRef<HTMLElement | null>(null);

  const show = useCallback((n: Notice) => {
    if (n.action && !returnFocus.current && document.activeElement instanceof HTMLElement) {
      returnFocus.current = document.activeElement;
    }
    setNotice(n);
  }, []);
  const close = useCallback(() => {
    setNotice(null);
    if (returnFocus.current?.isConnected) returnFocus.current.focus();
    returnFocus.current = null;
  }, []);

  // keyboard users land on "Log in" / "Go to My Pantry" instead of tabbing through the page to reach it
  useEffect(() => {
    if (notice?.action) actionRef.current?.focus();
  }, [notice]);

  useEffect(() => {
    if (!notice) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    const timer = notice.tone === "success" ? setTimeout(close, DURATIONS.noticeShownMs) : undefined;
    return () => {
      window.removeEventListener("keydown", onKey);
      clearTimeout(timer);
    };
  }, [notice, close]);

  const Icon = notice?.tone === "success" ? CircleCheck : CircleAlert;
  return (
    <ShowNotice.Provider value={show}>
      {children}
      {/* always on the page: screen readers only announce text that changes inside an existing live region */}
      <p role="status" className="sr-only">
        {notice?.message ?? ""}
      </p>
      {notice && (
        <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className={`${card} pointer-events-auto relative flex max-w-sm flex-col items-center gap-3 px-6 py-5 text-center shadow-xl`}>
            <button type="button" onClick={close} aria-label="Close" className="absolute right-2 top-2 rounded-full p-1 text-muted hover:bg-sand">
              <X className="h-4 w-4" aria-hidden />
            </button>
            <Icon
              className={`h-8 w-8 ${notice.tone === "error" ? "text-tomato" : notice.tone === "success" ? "text-herb" : "text-brown"}`}
              aria-hidden
            />
            <p className="font-extrabold text-ink">{notice.message}</p>
            {notice.action && (
              <Link
                ref={actionRef}
                href={notice.action.href}
                onClick={() => {
                  returnFocus.current = null; // going to another page
                  setNotice(null);
                }}
                className={`${btn.primary} text-sm`}
              >
                {notice.action.label}
              </Link>
            )}
          </div>
        </div>
      )}
    </ShowNotice.Provider>
  );
}
