"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { setRecipeSaved } from "@/app/actions/saved";
import { useNotice } from "./CenterNotice";
import { hoverHint } from "./ui";

/** Heart on recipe cards and the recipe page: saves the recipe to My Saved Recipes (in My Pantry). */
export function SaveRecipeButton({
  recipeId,
  recipeName,
  saved: initialSaved,
  loggedIn,
  size = "card",
}: {
  recipeId: number;
  recipeName: string;
  saved: boolean;
  loggedIn: boolean;
  size?: "card" | "page";
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();
  const showNotice = useNotice();
  const label = saved ? "Remove from saved recipes" : "Favourite this recipe";

  function toggle() {
    if (!loggedIn) {
      const here = window.location.pathname + window.location.search;
      showNotice({
        tone: "info",
        message: "Log in to save recipes",
        action: { href: `/login?callbackUrl=${encodeURIComponent(here)}`, label: "Log in" },
      });
      return;
    }
    const next = !saved;
    setSaved(next); // fill the heart straight away
    startTransition(async () => {
      const res = await setRecipeSaved(recipeId, next);
      if (res.error) {
        setSaved(!next);
        showNotice({ tone: "error", message: res.error });
      } else {
        showNotice({ tone: "success", message: next ? "Saved to My Saved Recipes" : "Removed from My Saved Recipes" });
      }
    });
  }

  return (
    <span className="group/hint relative inline-flex shrink-0">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={saved}
        aria-label={`${label}: ${recipeName}`}
        className={`flex items-center justify-center rounded-full border border-line bg-card text-tomato shadow-sm transition hover:bg-tomato-soft disabled:opacity-70 ${
          size === "page" ? "h-12 w-12" : "h-9 w-9"
        }`}
      >
        <Heart className={size === "page" ? "h-6 w-6" : "h-5 w-5"} fill={saved ? "currentColor" : "none"} aria-hidden />
      </button>
      <span aria-hidden className={`${hoverHint} bg-ink opacity-0`}>{label}</span>
    </span>
  );
}
