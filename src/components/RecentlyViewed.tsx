"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { RecipeCard, type RecipeCardData } from "./RecipeCard";

const KEY = "fm:recently-viewed";
const MAX = 8;

/** Recently viewed recipes are kept only in this browser (no account needed). */
function read(): RecipeCardData[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let snapshot: string | null = null;
function getSnapshot() {
  try {
    snapshot = localStorage.getItem(KEY) ?? "[]";
  } catch {
    snapshot = "[]";
  }
  return snapshot;
}
function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
}

export function TrackRecentlyViewed({ recipe }: { recipe: RecipeCardData }) {
  useEffect(() => {
    try {
      const list = read().filter((r) => r.id !== recipe.id);
      list.unshift(recipe);
      localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
    } catch {
      /* storage unavailable (private mode) – not important */
    }
  }, [recipe]);
  return null;
}

export function RecentlyViewed() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  let recipes: RecipeCardData[] = [];
  try {
    recipes = (JSON.parse(raw) as RecipeCardData[]).slice(0, 4);
  } catch {
    recipes = [];
  }
  if (!recipes.length) return null;
  return (
    <section aria-labelledby="recent-heading" className="mx-auto mt-10 max-w-6xl px-4">
      <div className="mb-3 flex items-end justify-between">
        <h2 id="recent-heading" className="text-2xl sm:text-3xl">Recently viewed recipes</h2>
        <Link href="/recipes" className="inline-flex items-center gap-1 text-sm font-bold text-brown-dark hover:underline">
          See all <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {recipes.map((r) => (
          <RecipeCard key={r.id} recipe={r} href={`/recipes/${r.id}`} compact />
        ))}
      </div>
    </section>
  );
}
