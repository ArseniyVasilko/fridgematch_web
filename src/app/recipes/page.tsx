import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CircleHelp } from "lucide-react";
import { FilterPanel } from "@/components/FilterPanel";
import { AutoSubmit } from "@/components/AutoSubmit";
import { IngredientInput } from "@/components/IngredientInput";
import { VeggiesIllustration } from "@/components/illustrations";
import { RecipeCard } from "@/components/RecipeCard";
import { btn, card, input } from "@/components/ui";
import type { UserIngredient } from "@/lib/matching";
import { getPantryForMatching } from "@/lib/pantry";
import { browseRecipes, getCategories, matchRecipes } from "@/lib/recipes";
import { first, parseIngredientList, recipesUrl, type SearchParams } from "@/lib/search-params";
import { getUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Recipes" };

const PAGE = 48;
const MISSING_OPTIONS = ["any", "0", "1", "2", "3"] as const;

function parseBasics(v: string | string[] | undefined): boolean {
  if (v == null) return true; // default: assume salt, pepper, oil and water
  const values = Array.isArray(v) ? v : [v];
  return values.includes("1");
}

export default async function RecipesPage({ searchParams }: PageProps<"/recipes">) {
  const sp = (await searchParams) as SearchParams;
  const ingredients = parseIngredientList(sp.i);
  const usePantry = first(sp.pantry) === "1";
  const basics = parseBasics(sp.basics);
  const missingParam = MISSING_OPTIONS.includes(first(sp.missing) as never) ? first(sp.missing)! : "any";
  const maxMissing = missingParam === "any" ? null : Number(missingParam);
  const category = first(sp.cat) || null;
  const sort = first(sp.sort) ?? "best";
  const q = first(sp.q)?.trim() || null;
  const limit = Math.min(Math.max(Number(first(sp.limit)) || PAGE, PAGE), 500);

  const userId = await getUserId();
  const currentUrl = recipesUrl({ i: ingredients, pantry: usePantry, q, cat: category, missing: missingParam === "any" ? null : missingParam, sort: sort === "best" ? null : sort, basics: basics ? null : "0" });
  if (usePantry && !userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
  }

  const pantryItems: UserIngredient[] = usePantry && userId ? await getPantryForMatching(userId) : [];
  const userIngredients: UserIngredient[] = [...ingredients.map((name) => ({ name })), ...pantryItems];
  const matchMode = ingredients.length > 0 || usePantry;

  const categories = await getCategories();
  const activeFilters =
    (usePantry ? 1 : 0) + (missingParam !== "any" ? 1 : 0) + (category ? 1 : 0) + (basics ? 0 : 1);
  const keep = {
    pantry: usePantry ? "1" : undefined,
    basics: basics ? undefined : "0",
    missing: missingParam === "any" ? undefined : missingParam,
    cat: category ?? undefined,
  };
  // links to details carry the ingredients so the details page can show have / missing
  const detailQuery = new URLSearchParams();
  if (ingredients.length) detailQuery.set("i", ingredients.join(","));
  if (usePantry) detailQuery.set("pantry", "1");
  if (!basics) detailQuery.set("basics", "0");
  const detailSuffix = detailQuery.toString() ? `?${detailQuery}` : "";

  let cards: React.ReactNode[] = [];
  let total = 0;
  if (matchMode) {
    let results = await matchRecipes(userIngredients, { assumeStaples: basics, maxMissing, category });
    if (sort === "missing") results = [...results].sort((a, b) => a.missingCount - b.missingCount || b.score - a.score);
    if (sort === "name") results = [...results].sort((a, b) => a.recipe.name.localeCompare(b.recipe.name));
    total = results.length;
    cards = results.slice(0, limit).map((m) => (
      <RecipeCard key={m.recipe.id} recipe={m.recipe} match={m} href={`/recipes/${m.recipe.id}${detailSuffix}`} />
    ));
  } else {
    const results = await browseRecipes({ q, category });
    total = results.length;
    cards = results.slice(0, limit).map((r) => <RecipeCard key={r.id} recipe={r} href={`/recipes/${r.id}`} />);
  }

  const title = matchMode ? "Recipe results" : q ? `Recipes for “${q}”` : "All recipes";
  const subtitle = matchMode
    ? usePantry
      ? "Recipes ranked by what's in your pantry and the ingredients you added."
      : "Delicious recipes based on the ingredients in your fridge."
    : "Browse the whole collection, or add ingredients to rank recipes by what you have.";

  return (
    <div className="mx-auto max-w-6xl px-4 pt-5">
      {/* ingredient chips / add more */}
      <div id="search" className="scroll-mt-4">
        <IngredientInput
          key={ingredients.join(",")}
          initial={ingredients}
          keep={keep}
          variant="compact"
          submitLabel={matchMode ? "Update results" : "Find Recipes"}
        />
      </div>

      <div className="mt-5 flex flex-col gap-6 lg:flex-row">
        {/* Filters */}
        <aside className="lg:w-64 lg:shrink-0" aria-label="Filter recipes">
          <FilterPanel activeCount={activeFilters}>
            <form id="filters" action="/recipes" className="mt-4 space-y-5">
              {ingredients.length > 0 && <input type="hidden" name="i" value={ingredients.join(",")} />}
              {!matchMode && (
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-brown-dark">Recipe name or ingredient</span>
                  <input name="q" type="search" defaultValue={q ?? ""} className={input} placeholder="e.g. pasta" />
                </label>
              )}

              <fieldset>
                <legend className="text-sm font-bold text-brown-dark">Match with pantry</legend>
                {userId ? (
                  <label className="mt-1 flex items-start justify-between gap-3 text-sm text-muted">
                    <span>Show recipes that use ingredients I already have</span>
                    <input type="checkbox" name="pantry" value="1" defaultChecked={usePantry} className="peer sr-only" />
                    <span aria-hidden className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-sand-deep transition peer-checked:bg-brown peer-focus-visible:ring-2 peer-focus-visible:ring-brown after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
                  </label>
                ) : (
                  <p className="mt-1 text-sm text-muted">
                    <Link className="font-bold text-brown-dark underline" href={`/login?callbackUrl=${encodeURIComponent(recipesUrl({ ...keep, i: ingredients, pantry: true }))}`}>
                      Log in
                    </Link>{" "}
                    to match recipes with your saved pantry.
                  </p>
                )}
              </fieldset>

              {matchMode && (
                <>
                  <fieldset>
                    <legend className="flex items-center gap-1 text-sm font-bold text-brown-dark">
                      Up to missing ingredients
                      <span title="Hide recipes that need more ingredients than this" className="text-muted">
                        <CircleHelp className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {MISSING_OPTIONS.map((m) => (
                        <label key={m} className="cursor-pointer">
                          <input type="radio" name="missing" value={m} defaultChecked={missingParam === m} className="peer sr-only" />
                          <span className="inline-flex min-w-10 items-center justify-center rounded-full border border-line bg-card px-3 py-1 text-sm font-bold text-brown-dark peer-checked:border-brown peer-checked:bg-brown peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brown">
                            {m === "any" ? "Any" : m === "3" ? "3" : m}
                          </span>
                        </label>
                      ))}
                    </div>
                  </fieldset>

                  <label className="flex items-start gap-2 text-sm">
                    <input type="hidden" name="basics" value="0" />
                    <input type="checkbox" name="basics" value="1" defaultChecked={basics} className="mt-0.5 h-4 w-4 accent-brown" />
                    <span>
                      <span className="font-bold text-brown-dark">I have the basics</span>
                      <span className="block text-muted">Salt, pepper, oil and water</span>
                    </span>
                  </label>
                </>
              )}

              <fieldset>
                <legend className="text-sm font-bold text-brown-dark">Meal type</legend>
                <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-1 lg:grid-cols-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="cat" value="" defaultChecked={!category} className="h-4 w-4 accent-brown" /> All
                  </label>
                  {categories.map((c) => (
                    <label key={c} className="flex items-center gap-2 text-sm">
                      <input type="radio" name="cat" value={c} defaultChecked={category === c} className="h-4 w-4 accent-brown" /> {c}
                    </label>
                  ))}
                </div>
              </fieldset>

              <button className={`${btn.primary} w-full`}>Apply filters</button>
            </form>
            <AutoSubmit formId="filters" />
          </FilterPanel>
        </aside>

        {/* Results */}
        <section className="min-w-0 flex-1" aria-labelledby="results-heading">
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <h1 id="results-heading" className="text-4xl sm:text-5xl">{title}</h1>
              <p className="mt-1 font-semibold text-muted">{subtitle}</p>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <VeggiesIllustration className="h-24" />
              <p className="max-w-40 -rotate-2 rounded-xl border border-line bg-card px-3 py-2 font-display text-lg leading-tight text-brown-dark shadow-sm">
                Your next meal may already be hiding in your fridge.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <p className="font-extrabold text-ink" aria-live="polite">
              {total} {total === 1 ? "recipe" : "recipes"} found
            </p>
            {matchMode && (
              <label className="flex items-center gap-2 text-sm font-semibold text-muted">
                Sort by
                <select name="sort" form="filters" defaultValue={sort} className="rounded-lg border border-line bg-card px-2 py-1.5 font-semibold text-ink">
                  <option value="best">Best match</option>
                  <option value="missing">Fewest missing</option>
                  <option value="name">Name (A–Z)</option>
                </select>
              </label>
            )}
          </div>

          {usePantry && pantryItems.length === 0 && (
            <div className={`${card} mt-4 bg-amber-soft p-4 text-sm`}>
              Your pantry is empty (or everything in it has expired).{" "}
              <Link href="/pantry" className="font-bold text-brown-dark underline">Add some items</Link> to match recipes with it.
            </div>
          )}

          {cards.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">{cards}</div>
          ) : (
            <div className={`${card} mt-4 flex flex-col items-center gap-3 p-8 text-center`}>
              <p className="font-display text-2xl text-brown-dark">No recipes found</p>
              <p className="max-w-md text-muted">
                {matchMode
                  ? "Try allowing more missing ingredients, choosing another meal type, or adding a few more ingredients."
                  : "Try another search word or meal type."}
              </p>
              <Link href="/recipes" className={btn.outline}>Clear filters</Link>
            </div>
          )}

          {total > limit && (
            <div className="mt-6 flex justify-center">
              <Link
                scroll={false}
                href={`${currentUrl}${currentUrl.includes("?") ? "&" : "?"}limit=${limit + PAGE}`}
                className={btn.outline}
              >
                Show more recipes <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
