"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { cleanQuery } from "@/lib/search-params";

/**
 * Submits a GET filter form as soon as an option changes, so results update
 * immediately (design doc 4.2). Typed text waits for Enter. Submitting
 * navigates to a tidy URL (see cleanQuery); without JavaScript the form still
 * works as a plain GET form.
 */
export function AutoSubmit({ formId }: { formId: string }) {
  const router = useRouter();
  useEffect(() => {
    // listen on the document and find the form on each change: the form is
    // rebuilt when the URL changes, and the sort menu sits outside it (form="...")
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement | HTMLSelectElement;
      if (t.form?.id !== formId) return;
      if (t instanceof HTMLInputElement && (t.type === "text" || t.type === "search")) return;
      t.form.requestSubmit();
    };
    const onSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      if (form.id !== formId) return;
      e.preventDefault();
      const query = cleanQuery(new FormData(form, e.submitter)).toString();
      const path = new URL(form.action).pathname;
      router.push(query ? `${path}?${query}` : path, { scroll: false });
    };
    document.addEventListener("change", onChange);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("change", onChange);
      document.removeEventListener("submit", onSubmit);
    };
  }, [formId, router]);
  return null;
}
