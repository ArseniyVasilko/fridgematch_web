"use client";

import { useEffect } from "react";

/**
 * Submits a GET filter form as soon as a control outside it that uses
 * form="..." changes (e.g. the sort menu above the results). Options inside
 * the form wait for its "Apply filters" button.
 */
export function AutoSubmit({ formId }: { formId: string }) {
  useEffect(() => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return;
    const onChange = () => form.requestSubmit();
    const outside = document.querySelectorAll(`[form="${formId}"]`);
    outside.forEach((el) => el.addEventListener("change", onChange));
    return () => outside.forEach((el) => el.removeEventListener("change", onChange));
  }, [formId]);
  return null;
}
