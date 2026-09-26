"use client";

import { useEffect } from "react";

/**
 * Submits a GET filter form as soon as an option changes, so results update
 * immediately (design doc 4.2). Without JavaScript the "Apply filters"
 * button still works.
 */
export function AutoSubmit({ formId }: { formId: string }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const onChange = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t instanceof HTMLInputElement && (t.type === "text" || t.type === "search")) return;
      form.requestSubmit();
    };
    form.addEventListener("change", onChange);
    // also listen for controls outside the form that use form="..."
    const outside = document.querySelectorAll(`[form="${formId}"]`);
    outside.forEach((el) => el.addEventListener("change", onChange));
    return () => {
      form.removeEventListener("change", onChange);
      outside.forEach((el) => el.removeEventListener("change", onChange));
    };
  }, [formId]);
  return null;
}
