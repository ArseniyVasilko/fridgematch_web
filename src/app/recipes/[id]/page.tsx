import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Check, CircleDashed, ExternalLink, Globe2, Leaf, ListChecks, PlayCircle, Refrigerator, UtensilsCrossed, X } from "lucide-react";
import { addToShoppingList } from "@/app/actions/shopping";
import { MatchBar } from "@/components/MatchBar";
import { RecipeImage } from "@/components/RecipeImage";
import { TrackRecentlyViewed } from "@/components/RecentlyViewed";
import { SaveRecipeButton } from "@/components/SaveRecipeButton";
import { AddAllMissingButton, AddIngredientButton, LoginToAddAllLink, LoginToAddLink } from "@/components/ShoppingButtons";
import { btn, card } from "@/components/ui";
import type { IngredientMatch, UserIngredient } from "@/lib/matching";
import { getPantryForMatching } from "@/lib/pantry";
import { combineMeasures } from "@/lib/measure";
import { evaluateForDetails, getRecipe } from "@/lib/recipes";
import { isRecipeSaved } from "@/lib/saved";
import { first, parseIngredientList, recipesUrl, type SearchParams } from "@/lib/search-params";
import { getUserId } from "@/lib/session";
import { getShoppingIngredientIds } from "@/lib/shopping";

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
  const pantryParam = first(sp.pantry) === "1";
  const basics = first(sp.basics) !== "0";
  const userId = await getUserId();
  // logged-in users opening a recipe without a search are compared with their pantry
  const usePantry = pantryParam || (!!userId && ingredients.length === 0);
  const fromSearch = ingredients.length > 0 || pantryParam;
  // opened from My Saved Recipes in My Pantry; `saved` is how many it showed (after "Show more")
  const fromSaved = first(sp.from) === "saved";
  const savedShown = fromSaved && /^\d+$/.test(first(sp.saved) ?? "") ? first(sp.saved)! : null;

  const selfQuery = new URLSearchParams();
  if (ingredients.length) selfQuery.set("i", ingredients.join(","));
  if (pantryParam) selfQuery.set("pantry", "1");
  if (!basics) selfQuery.set("basics", "0");
  if (fromSaved) selfQuery.set("from", "saved");
  if (savedShown) selfQuery.set("saved", savedShown);
  const selfUrl = `/recipes/${recipe.id}${selfQuery.size ? `?${selfQuery}` : ""}`;
  const loginUrl = `/login?callbackUrl=${encodeURIComponent(selfUrl)}`;

  if (pantryParam && !userId) redirect(loginUrl);

  const [pantry, saved]: [UserIngredient[], boolean] = await Promise.all([
    usePantry && userId ? getPantryForMatching(userId) : [],
    userId ? isRecipeSaved(userId, recipe.id) : false,
  ]);
  const user: UserIngredient[] = [...ingredients.map((name) => ({ name })), ...pantry];
  const comparing = user.length > 0 || usePantry;
  const match = evaluateForDetails(recipe, user, { assumeStaples: basics });

  // Shopping list: missing and partial ingredients (partial ones only need what's still short).
  // Recipes can list an ingredient twice ("1 clove", "2 cloves"): that becomes one item.
  // Guests see the same buttons; they lead to Log in and back here.
  const amounts = new Map<number, string[]>();
  if (comparing) {
    match.ingredients.forEach((ing, i) => {
      if (ing.status !== "missing" && ing.status !== "partial") return;
      const id = recipe.ingredients[i].ingredientId;
      amounts.set(id, [...(amounts.get(id) ?? []), ing.stillNeeded ?? ing.measure]);
    });
  }
  const toBuy = new Map([...amounts].map(([ingredientId, a]) => [ingredientId, { ingredientId, measure: combineMeasures(a) }]));
  const onList = userId && toBuy.size > 0 ? await getShoppingIngredientIds(userId, recipe.id) : new Set<number>();
  const notOnList = [...toBuy.values()].filter((b) => !onList.has(b.ingredientId));

  const withPantryUrl = (() => {
    const q = new URLSearchParams(selfQuery);
    q.set("pantry", "1");
    return `/recipes/${recipe.id}?${q}`;
  })();
  const back = fromSaved
    ? { href: `/pantry${savedShown ? `?saved=${savedShown}` : ""}#saved-recipes`, label: "Back to My Saved Recipes" }
    : fromSearch
      ? { href: recipesUrl({ i: ingredients, pantry: pantryParam, basics: basics ? null : "0" }), label: "Back to results" }
      : { href: "/recipes", label: "All recipes" };
  const steps = toSteps(recipe.instructions);
  const shown = new Set([recipe.category, recipe.area].filter(Boolean).map((t) => t!.toLowerCase()));
  const tags = [...new Set(recipe.tags?.split(",").map((t) => t.trim()).filter(Boolean) ?? [])].filter(
    (t) => !shown.has(t.toLowerCase()),
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5">
      <TrackRecentlyViewed
        recipe={{ id: recipe.id, name: recipe.name, category: recipe.category, area: recipe.area, imageUrl: recipe.imageUrl }}
      />
      <Link href={back.href} className={`${btn.ghost} -ml-3`}>
        <ArrowLeft className="h-4 w-4" aria-hidden /> {back.label}
      </Link>

      <div className="mt-2 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="overflow-hidden rounded-3xl border border-line bg-card p-2 shadow-[var(--shadow-card)] lg:sticky lg:top-4 lg:self-start">
          <div className="aspect-square overflow-hidden rounded-2xl sm:aspect-[4/3] lg:aspect-square">
            <RecipeImage src={recipe.imageUrl} alt={recipe.name} id={recipe.id} size="large" />
          </div>
        </div>

        <div>
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-4xl leading-tight sm:text-5xl">{recipe.name}</h1>
            <SaveRecipeButton recipeId={recipe.id} recipeName={recipe.name} saved={saved} loggedIn={!!userId} size="page" />
          </div>
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
            {comparing ? (
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
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="ingredients-heading" className="text-3xl">Ingredients</h2>
              {notOnList.length > 0 && !userId ? (
                <LoginToAddAllLink href={loginUrl} count={notOnList.length} />
              ) : notOnList.length > 0 ? (
                <AddAllMissingButton action={addToShoppingList.bind(null, recipe.id, notOnList)} count={notOnList.length} />
              ) : toBuy.size > 0 ? (
                <Link href="/shopping-list" className="inline-flex items-center gap-1 text-sm font-bold text-brown-dark underline">
                  <ListChecks className="h-4 w-4" aria-hidden /> View shopping list
                </Link>
              ) : null}
            </div>
            <ul className="mt-3 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
              {match.ingredients.map((ing, i) => {
                const s = comparing ? STATUS[ing.status] : null;
                const buy = toBuy.get(recipe.ingredients[i].ingredientId);
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
                    {buy && !userId && <LoginToAddLink href={loginUrl} name={ing.name} />}
                    {buy && userId && (
                      <AddIngredientButton
                        action={addToShoppingList.bind(null, recipe.id, [buy])}
                        name={ing.name}
                        onList={onList.has(buy.ingredientId)}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
            {comparing && (
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
