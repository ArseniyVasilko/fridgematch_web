"use client";

import { useEffect } from "react";

/**
 * Submits a GET filter form as soon as an option changes, so results update
 * immediately (design doc 4.2). Typed text waits for Enter.
 */
export function AutoSubmit({ formId }: { formId: string }) {
  useEffect(() => {
    // listen on the document and find the form on each change: the form is
    // rebuilt when the URL changes, and the sort menu sits outside it (form="...")
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement | HTMLSelectElement;
      if (t.form?.id !== formId) return;
      if (t instanceof HTMLInputElement && (t.type === "text" || t.type === "search")) return;
      t.form.requestSubmit();
    };
    document.addEventListener("change", onChange);
    return () => document.removeEventListener("change", onChange);
  }, [formId]);
  return null;
}
