import Link from "next/link";
import { ChevronRight, Globe2, Leaf, UtensilsCrossed } from "lucide-react";
import { MatchBar } from "./MatchBar";
import { RecipeImage } from "./RecipeImage";
import { card } from "./ui";

export interface RecipeCardData {
  id: number;
  name: string;
  category: string | null;
  area: string | null;
  imageUrl: string | null;
}

export interface RecipeCardMatch {
  score: number;
  haveCount: number;
  total: number;
  missingCount: number;
  usesExpiring: number;
}

export function RecipeCard({
  recipe,
  match,
  href,
  compact = false,
}: {
  recipe: RecipeCardData;
  match?: RecipeCardMatch;
  href: string;
  compact?: boolean;
}) {
  return (
    <article className={`${card} group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-md`}>
      <Link href={href} className="flex flex-1 flex-col focus-visible:outline-offset-[-3px]">
        <div className={`relative m-2 mb-0 overflow-hidden rounded-xl ${compact ? "aspect-[4/3]" : "aspect-[4/3]"}`}>
          <RecipeImage src={recipe.imageUrl} alt={recipe.name} id={recipe.id} />
          {match && match.usesExpiring > 0 && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-herb px-2 py-0.5 text-xs font-bold text-white shadow">
              <Leaf className="h-3 w-3" aria-hidden /> Uses expiring food
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2.5 sm:p-3">
          <h3 className={`font-sans font-extrabold leading-snug text-ink ${compact ? "text-sm" : "text-sm sm:text-base"}`}>
            {recipe.name}
          </h3>
          {(recipe.category || recipe.area) && (
            <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold text-muted">
              {recipe.category && (
                <span className="inline-flex items-center gap-1">
                  <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden /> {recipe.category}
                </span>
              )}
              {recipe.area && (
                <span className="inline-flex items-center gap-1">
                  <Globe2 className="h-3.5 w-3.5" aria-hidden /> {recipe.area}
                </span>
              )}
            </p>
          )}
          {match ? (
            <div className="mt-auto pt-1">
              <MatchBar score={match.score} />
              <p className="mt-2 flex items-center justify-between gap-1 text-xs font-semibold text-ink sm:text-sm">
                <span>
                  You have {match.haveCount}/{match.total} ingredients
                  {match.missingCount > 0 && (
                    <span className="sr-only">, {match.missingCount} missing</span>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 text-brown transition group-hover:translate-x-0.5" aria-hidden />
              </p>
            </div>
          ) : (
            !compact && (
              <span className="mt-auto inline-flex items-center justify-center rounded-xl border-2 border-brown/70 py-1.5 text-sm font-bold text-brown-dark transition group-hover:bg-sand">
                View Recipe
              </span>
            )
          )}
        </div>
      </Link>
    </article>
  );
}
