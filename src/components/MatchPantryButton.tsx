"use client";

import Link from "next/link";
import { Refrigerator } from "lucide-react";
import { recipesUrl } from "@/lib/search-params";
import { useNotice } from "./CenterNotice";
import { btn } from "./ui";

/** Recipes ranked by the user's pantry, fewest missing ingredients first. */
const RESULTS = recipesUrl({ pantry: true, sort: "missing" });
const className = `${btn.outline} mt-3 text-sm`;

/** Home page hero: "Match with my ingredients". Guests and empty pantries get a popup instead. */
export function MatchPantryButton({ loggedIn, pantryCount }: { loggedIn: boolean; pantryCount: number }) {
  const showNotice = useNotice();
  const content = (
    <>
      <Refrigerator className="h-4 w-4" aria-hidden /> Match with my ingredients
    </>
  );

  if (loggedIn && pantryCount > 0) {
    return (
      <Link href={RESULTS} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() =>
        showNotice(
          loggedIn
            ? { tone: "error", message: "Your pantry is empty. Add some items first.", action: { href: "/pantry", label: "Go to My Pantry" } }
            : {
                tone: "info",
                message: "Log in to match recipes with your pantry",
                action: { href: `/login?callbackUrl=${encodeURIComponent(RESULTS)}`, label: "Log in" },
              },
        )
      }
    >
      {content}
    </button>
  );
}
