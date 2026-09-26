"use client";
import { useEffect, useState } from "react";

/** Debounced ingredient autocomplete from /api/ingredients. */
export function useIngredientSuggestions(query: string, exclude: string[] = []) {
  const q = query.trim();
  const [result, setResult] = useState<{ q: string; list: string[] }>({ q: "", list: [] });

  useEffect(() => {
    if (!q) return;
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ingredients?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const data = (await res.json()) as { suggestions: string[] };
        setResult({ q, list: data.suggestions });
      } catch {
        /* aborted or offline: keep the old list */
      }
    }, 150);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  if (!q || !result.q) return [];
  const skip = new Set(exclude.map((e) => e.toLowerCase()));
  let list = result.list;
  if (result.q !== q) {
    // still loading: narrow the previous list instead of flashing an empty one
    if (!q.toLowerCase().startsWith(result.q.toLowerCase())) return [];
    list = list.filter((s) => s.toLowerCase().includes(q.toLowerCase()));
  }
  return list.filter((s) => !skip.has(s.toLowerCase()));
}
