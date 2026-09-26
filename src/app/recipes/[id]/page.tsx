import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, CircleDashed, ExternalLink, Globe2, Leaf, PlayCircle, Refrigerator, UtensilsCrossed, X } from "lucide-react";
import { MatchBar } from "@/components/MatchBar";
import { RecipeImage } from "@/components/RecipeImage";
import { TrackRecentlyViewed } from "@/components/RecentlyViewed";
import { btn, card } from "@/components/ui";
import type { IngredientMatch, UserIngredient } from "@/lib/matching";
import { getPantryForMatching } from "@/lib/pantry";
import { evaluateForDetails, getRecipe } from "@/lib/recipes";
import { first, parseIngredientList, recipesUrl, type SearchParams } from "@/lib/search-params";
import { getUserId } from "@/lib/session";

export async function generateMetadata({ params }: PageProps<"/recipes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipe(Number(id));
  return { title: recipe?.name ?? "Recipe not found" };
}

/** Split TheMealDB instructions into steps and drop "STEP 1" style labels. */
function toSteps(text: string): string[] {
  const lines = text
    .split(/\r?\n+/)
    .map((l) => l.replace(/^\s*(step\s*\d+[:.)]?|\d+[.)])\s*/i, "").trim())
    .filter((l) => l.length > 1);
  if (lines.length > 1) return lines;
  // one long paragraph: split into sentences, grouped in pairs
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g)?.map((s) => s.trim()) ?? [text];
  const steps: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) steps.push(sentences.slice(i, i + 2).join(" "));
  return steps;
}

const STATUS: Record<IngredientMatch["status"], { label: string; icon: React.ReactNode; className: string }> = {
  have: { label: "You have this", icon: <Check className="h-4 w-4" aria-hidden />, className: "bg-herb-soft text-herb" },
  staple: { label: "Kitchen basic", icon: <Check className="h-4 w-4" aria-hidden />, className: "bg-sand-deep text-muted" },
  partial: { label: "Only part of the amount", icon: <CircleDashed className="h-4 w-4" aria-hidden />, className: "bg-amber-soft text-amber" },
  missing: { label: "Missing", icon: <X className="h-4 w-4" aria-hidden />, className: "bg-tomato-soft text-tomato" },
};

export default async function RecipeDetailsPage({ params, searchParams }: PageProps<"/recipes/[id]">) {
  const { id } = await params;
  const sp = (await searchParams) as SearchParams;
  const recipe = await getRecipe(Number(id));
  if (!recipe) notFound();

  const ingredients = parseIngredientList(sp.i);
  const usePantry = first(sp.pantry) === "1";
  const basics = first(sp.basics) !== "0";
  const userId = await getUserId();

  const selfQuery = new URLSearchParams();
  if (ingredients.length) selfQuery.set("i", ingredients.join(","));
  if (usePantry) selfQuery.set("pantry", "1");
  if (!basics) selfQuery.set("basics", "0");
  const selfUrl = `/recipes/${recipe.id}${selfQuery.size ? `?${selfQuery}` : ""}`;

  if (usePantry && !userId) redirect(`/login?callbackUrl=${encodeURIComponent(selfUrl)}`);

  const pantry: UserIngredient[] = usePantry && userId ? await getPantryForMatching(userId) : [];
  const user: UserIngredient[] = [...ingredients.map((name) => ({ name })), ...pantry];
  const hasInput = user.length > 0;
  const match = evaluateForDetails(recipe, user, { assumeStaples: basics });

  const withPantryUrl = (() => {
    const q = new URLSearchParams(selfQuery);
    q.set("pantry", "1");
    return `/recipes/${recipe.id}?${q}`;
  })();
  const backUrl = hasInput || usePantry
    ? recipesUrl({ i: ingredients, pantry: usePantry, basics: basics ? null : "0" })
    : "/recipes";
  const steps = toSteps(recipe.instructions);
  const tags = recipe.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5">
      <TrackRecentlyViewed
        recipe={{ id: recipe.id, name: recipe.name, category: recipe.category, area: recipe.area, imageUrl: recipe.imageUrl }}
      />
      <Link href={backUrl} className={`${btn.ghost} -ml-3`}>
        <ArrowLeft className="h-4 w-4" aria-hidden /> {hasInput ? "Back to results" : "All recipes"}
      </Link>

      <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="overflow-hidden rounded-3xl border border-line bg-card p-2 shadow-[var(--shadow-card)] lg:sticky lg:top-4 lg:self-start">
          <div className="aspect-square overflow-hidden rounded-2xl sm:aspect-[4/3] lg:aspect-square">
            <RecipeImage src={recipe.imageUrl} alt={recipe.name} id={recipe.id} size="large" />
          </div>
        </div>

        <div>
          <h1 className="text-4xl leading-tight sm:text-5xl">{recipe.name}</h1>
          <p className="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-muted">
            {recipe.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-3 py-1">
                <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden /> {recipe.category}
              </span>
            )}
            {recipe.area && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sand px-3 py-1">
                <Globe2 className="h-3.5 w-3.5" aria-hidden /> {recipe.area}
              </span>
            )}
            {tags.map((t) => (
              <span key={t} className="rounded-full bg-sand px-3 py-1">{t}</span>
            ))}
          </p>

          {/* Match summary */}
          <div className={`${card} mt-5 p-4`}>
            {hasInput ? (
              <>
                <p className="flex items-baseline justify-between gap-2 font-extrabold text-ink">
                  <span>
                    You have {match.haveCount}/{match.total} ingredients
                  </span>
                  <span className="text-sm font-bold text-muted">{Math.round(match.score * 100)}% match</span>
                </p>
                <MatchBar score={match.score} className="mt-2" />
                <p className="mt-2 text-sm text-muted">
                  {match.missingCount === 0
                    ? "You have everything you need. Time to cook!"
                    : `${match.missingCount} ${match.missingCount === 1 ? "ingredient is" : "ingredients are"} missing.`}
                  {match.usesExpiring > 0 && (
                    <span className="ml-1 inline-flex items-center gap-1 font-bold text-herb">
                      <Leaf className="h-3.5 w-3.5" aria-hidden /> Uses {match.usesExpiring} pantry {match.usesExpiring === 1 ? "item" : "items"} that expire soon.
                    </span>
                  )}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">
                <Link href="/" className="font-bold text-brown-dark underline">Enter your ingredients</Link> to see which of these you already have.
              </p>
            )}
            {!usePantry && (
              <div className="mt-3 border-t border-line pt-3">
                {userId ? (
                  <Link href={withPantryUrl} className={`${btn.outline} text-sm`}>
                    <Refrigerator className="h-4 w-4" aria-hidden /> Compare with My Pantry
                  </Link>
                ) : (
                  <p className="text-sm text-muted">
                    <Link href={`/login?callbackUrl=${encodeURIComponent(withPantryUrl)}`} className="font-bold text-brown-dark underline">
                      Log in
                    </Link>{" "}
                    to compare this recipe with your pantry.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Ingredients */}
          <section aria-labelledby="ingredients-heading" className="mt-6">
            <h2 id="ingredients-heading" className="text-3xl">Ingredients</h2>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
              {match.ingredients.map((ing, i) => {
                const s = hasInput ? STATUS[ing.status] : null;
                return (
                  <li key={`${ing.name}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                    {s ? (
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${s.className}`} title={s.label}>
                        {s.icon}
                      </span>
                    ) : (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-accent" aria-hidden />
                    )}
                    <span className="flex-1">
                      <span className="font-bold text-ink">{ing.name}</span>
                      {ing.expiringSoon && (
                        <span className="ml-2 rounded-full bg-herb-soft px-2 py-0.5 text-xs font-bold text-herb">Use soon</span>
                      )}
                      {s && <span className="sr-only">: {s.label}</span>}
                    </span>
                    <span className="text-right text-sm text-muted">{ing.measure}</span>
                  </li>
                );
              })}
            </ul>
            {hasInput && (
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-muted">
                {(["have", "partial", "missing", "staple"] as const).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1">
                    <span className={`flex h-4 w-4 items-center justify-center rounded-full ${STATUS[k].className}`}>{STATUS[k].icon}</span>
                    {STATUS[k].label}
                  </span>
                ))}
              </p>
            )}
          </section>

          {/* Method */}
          <section aria-labelledby="method-heading" className="mt-8">
            <h2 id="method-heading" className="text-3xl">Method</h2>
            <ol className="mt-3 space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-extrabold text-ink">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {(recipe.youtubeUrl || recipe.sourceUrl) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {recipe.youtubeUrl && (
                <a href={recipe.youtubeUrl} target="_blank" rel="noreferrer" className={btn.outline}>
                  <PlayCircle className="h-4 w-4" aria-hidden /> Watch video
                </a>
              )}
              {recipe.sourceUrl && (
                <a href={recipe.sourceUrl} target="_blank" rel="noreferrer" className={btn.ghost}>
                  <ExternalLink className="h-4 w-4" aria-hidden /> Original source
                </a>
              )}
            </div>
          )}
          {recipe.source === "themealdb" && (
            <p className="mt-6 text-xs text-muted">
              Recipe and photo from{" "}
              <a className="underline" href={`https://www.themealdb.com/meal/${recipe.externalId}`} target="_blank" rel="noreferrer">
                TheMealDB
              </a>
              .
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
