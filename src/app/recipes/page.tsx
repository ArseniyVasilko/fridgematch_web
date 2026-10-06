import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CircleHelp } from "lucide-react";
import { ActiveFilters } from "@/components/ActiveFilters";
import { FilterPanel } from "@/components/FilterPanel";
import { AutoSubmit } from "@/components/AutoSubmit";
import { IngredientInput } from "@/components/IngredientInput";
import { VeggiesIllustration } from "@/components/illustrations";
import { RecipeCard } from "@/components/RecipeCard";
import { ToggleChip } from "@/components/ToggleChip";
import { btn, card, input } from "@/components/ui";
import type { UserIngredient } from "@/lib/matching";
import { getPantryForMatching } from "@/lib/pantry";
import { getProfile } from "@/lib/profile";
import { applyFilters, DIETS, MEAL_TYPES, type OptionCounts } from "@/lib/recipe-filters";
import { browseRecipes, getCuisines, getRecipeFacets, matchRecipes } from "@/lib/recipes";
import { first, parseIngredientList, parseList, recipesUrl, type SearchParams } from "@/lib/search-params";
import { getUserId } from "@/lib/session";

export const metadata: Metadata = { title: "Recipes" };

const PAGE = 48;
const MISSING_OPTIONS = ["0", "1", "2", "3", "any"] as const;
const missingLabel = (m: string) => (m === "any" ? "Any" : m === "0" ? "None" : `Up to ${m}`);
/** URL value for "turned off for this search" when the profile has saved values. */
const NONE = "none";

function parseBasics(v: string | string[] | undefined, fallback: boolean): boolean {
  if (v == null) return fallback; // default: the profile's choice, or assume salt, pepper, oil and water
  const values = Array.isArray(v) ? v : [v];
  return values.includes("1");
}

export default async function RecipesPage({ searchParams }: PageProps<"/recipes">) {
  const sp = (await searchParams) as SearchParams;
  const ingredients = parseIngredientList(sp.i);
  const usePantry = first(sp.pantry) === "1";
  const userId = await getUserId();
  // a logged-in user's saved restrictions apply whenever the URL doesn't set that filter
  const profile = userId ? await getProfile(userId) : null;
  const saved = { diets: profile?.diets ?? [], avoid: profile?.avoid ?? [], basics: profile?.assumeBasics ?? true };
  const basics = parseBasics(sp.basics, saved.basics);
  const missingParam = MISSING_OPTIONS.includes(first(sp.missing) as never) ? first(sp.missing)! : "any";
  const maxMissing = missingParam === "any" ? null : Number(missingParam);
  const types = parseList(sp.type, MEAL_TYPES.map((t) => t.id));
  const diets = sp.diet == null ? saved.diets : parseList(sp.diet, DIETS.map((d) => d.id));
  const avoid = sp.avoid == null ? saved.avoid : parseIngredientList(sp.avoid).filter((a) => a !== NONE);
  const avoidOptions = parseIngredientList([...saved.avoid, ...avoid]); // saved ones stay listed when unticked
  const cuisines = await getCuisines();
  const cuisine = cuisines.find((c) => c === first(sp.cuisine)) ?? null;
  const sort = first(sp.sort) ?? "best";
  const q = first(sp.q)?.trim() || null;
  const limit = Math.min(Math.max(Number(first(sp.limit)) || PAGE, PAGE), 500);

  // left out of the URL when it matches the saved profile; an empty list the profile would fill is NONE
  const listParam = (list: string[], savedList: string[]) => list.join(",") || (savedList.length ? NONE : undefined);
  const basicsParam = (on: boolean) => (on === saved.basics ? undefined : on ? "1" : "0");

  // every filter in the URL; also kept when the ingredients change
  const filterParams = {
    pantry: usePantry ? "1" : undefined,
    basics: basicsParam(basics),
    missing: missingParam === "any" ? undefined : missingParam,
    type: types.join(",") || undefined,
    diet: listParam(diets, saved.diets),
    avoid: listParam(avoid, saved.avoid),
    cuisine: cuisine ?? undefined,
  };
  const urlWith = (changes: Partial<typeof filterParams>) =>
    recipesUrl({ i: ingredients, q, ...filterParams, ...changes, sort: sort === "best" ? null : sort });
  const currentUrl = urlWith({});

  if (usePantry && !userId) {
    redirect(`/login?callbackUrl=${encodeURIComponent(currentUrl)}`);
  }

  const pantryItems: UserIngredient[] = usePantry && userId ? await getPantryForMatching(userId) : [];
  const userIngredients: UserIngredient[] = [...ingredients.map((name) => ({ name })), ...pantryItems];
  const matchMode = ingredients.length > 0 || usePantry;

  const without = <T extends string>(list: T[], value: T, savedList: string[] = []) =>
    listParam(list.filter((v) => v !== value), savedList);
  // pantry matching is a mode switched at the top of the panel, not a filter, so clearing keeps it
  const activeChips = [
    ...MEAL_TYPES.filter((t) => types.includes(t.id)).map((t) => ({ label: t.label, href: urlWith({ type: without(types, t.id) }) })),
    ...DIETS.filter((d) => diets.includes(d.id)).map((d) => ({ label: d.label, href: urlWith({ diet: without(diets, d.id, saved.diets) }) })),
    ...avoid.map((a) => ({ label: `Avoid: ${a}`, href: urlWith({ avoid: without(avoid, a, saved.avoid) }) })),
    ...(cuisine ? [{ label: cuisine, href: urlWith({ cuisine: undefined }) }] : []),
    // missing / basics only change anything when matching ingredients
    ...(matchMode && missingParam !== "any" ? [{ label: `Missing: ${missingLabel(missingParam)}`, href: urlWith({ missing: undefined }) }] : []),
    ...(matchMode && !basics ? [{ label: "Without basics", href: urlWith({ basics: basicsParam(true) }) }] : []),
  ];
  // clearing also turns off the saved profile for this search; opening /recipes again brings it back
  const clearHref = recipesUrl({
    i: ingredients,
    q,
    pantry: usePantry,
    basics: basicsParam(true),
    diet: listParam([], saved.diets),
    avoid: listParam([], saved.avoid),
    sort: sort === "best" ? null : sort,
  });
  // links to details carry the ingredients so the details page can show have / missing
  const detailQuery = new URLSearchParams();
  if (ingredients.length) detailQuery.set("i", ingredients.join(","));
  if (usePantry) detailQuery.set("pantry", "1");
  if (!basics) detailQuery.set("basics", "0");
  const detailSuffix = detailQuery.toString() ? `?${detailQuery}` : "";

  const facets = await getRecipeFacets();
  const filters = { types, diets, cuisine, avoid };
  let cards: React.ReactNode[] = [];
  let total = 0;
  let counts: OptionCounts;
  if (matchMode) {
    const filtered = applyFilters(
      await matchRecipes(userIngredients, { assumeStaples: basics, maxMissing }),
      (m) => facets.get(m.recipe.id)!,
      filters,
    );
    counts = filtered.counts;
    let results = filtered.items;
    if (sort === "missing") results = [...results].sort((a, b) => a.missingCount - b.missingCount || b.score - a.score);
    if (sort === "name") results = [...results].sort((a, b) => a.recipe.name.localeCompare(b.recipe.name));
    total = results.length;
    cards = results.slice(0, limit).map((m) => (
      <RecipeCard key={m.recipe.id} recipe={m.recipe} match={m} href={`/recipes/${m.recipe.id}${detailSuffix}`} />
    ));
  } else {
    const filtered = applyFilters(await browseRecipes({ q }), (r) => facets.get(r.id)!, filters);
    counts = filtered.counts;
    total = filtered.items.length;
    cards = filtered.items.slice(0, limit).map((r) => <RecipeCard key={r.id} recipe={r} href={`/recipes/${r.id}`} />);
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
          keep={filterParams}
          variant="compact"
          submitLabel={matchMode ? "Update results" : "Find Recipes"}
        />
      </div>

      <div className="mt-5 flex flex-col gap-6 lg:flex-row">
        {/* Filters */}
        <aside className="lg:w-64 lg:shrink-0" aria-label="Filter recipes">
          <FilterPanel activeCount={activeChips.length}>
            {/* key: the options are uncontrolled, so rebuild them when a chip link changes the URL */}
            <form key={currentUrl} id="filters" action="/recipes" className="mt-4 space-y-5">
              {ingredients.length > 0 && <input type="hidden" name="i" value={ingredients.join(",")} />}
              {!matchMode && (
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-brown-dark">Recipe name or ingredient</span>
                  <input name="q" type="search" defaultValue={q ?? ""} className={input} placeholder="e.g. pasta" />
                </label>
              )}

              <fieldset className="group">
                <legend className="text-sm font-bold text-brown-dark">Match with pantry</legend>
                {userId ? (
                  <label className="mt-1 flex items-start justify-between gap-3 text-sm text-muted">
                    <span>Show recipes that use ingredients I already have</span>
                    <input type="checkbox" name="pantry" value="1" defaultChecked={usePantry} className="peer sr-only" />
                    <span aria-hidden className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-sand-deep transition peer-checked:bg-brown peer-focus-visible:ring-2 peer-focus-visible:ring-brown after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
                  </label>
                ) : (
                  <p className="mt-1 text-sm text-muted">
                    <Link className="font-bold text-brown-dark underline" href={`/login?callbackUrl=${encodeURIComponent(urlWith({ pantry: "1" }))}`}>
                      Log in
                    </Link>{" "}
                    to match recipes with your saved pantry.
                  </p>
                )}

                {/* only used when matching; greyed out (live, via the pantry checkbox) when there is nothing to match */}
                <div className={`mt-4 space-y-4 ${ingredients.length ? "" : "opacity-50 group-has-[[name=pantry]:checked]:opacity-100"}`}>
                  <fieldset>
                    <legend className="flex items-center gap-1 text-sm font-bold text-brown-dark">
                      Missing ingredients
                      <span title="Hide recipes that need more ingredients than this" className="text-muted">
                        <CircleHelp className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {MISSING_OPTIONS.map((m) => (
                        <ToggleChip key={m} type="radio" name="missing" value={m} checked={missingParam === m}>
                          {missingLabel(m)}
                        </ToggleChip>
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
                </div>
                {!ingredients.length && (
                  <p className="mt-2 text-xs text-muted group-has-[[name=pantry]:checked]:hidden">
                    Turn on your pantry or add ingredients above to use these.
                  </p>
                )}
              </fieldset>

              <fieldset>
                <legend className="text-sm font-bold text-brown-dark">Meal type</legend>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {MEAL_TYPES.map((t) => (
                    <ToggleChip key={t.id} type="checkbox" name="type" value={t.id} checked={types.includes(t.id)} count={counts.types[t.id]}>
                      {t.label}
                    </ToggleChip>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="text-sm font-bold text-brown-dark">Diet</legend>
                {/* sent with every apply so unticking all saved options keeps them off instead of restoring the profile */}
                {saved.diets.length > 0 && <input type="hidden" name="diet" value={NONE} />}
                {saved.avoid.length > 0 && <input type="hidden" name="avoid" value={NONE} />}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {DIETS.map((d) => (
                    <ToggleChip key={d.id} type="checkbox" name="diet" value={d.id} checked={diets.includes(d.id)} count={counts.diets[d.id]}>
                      {d.label}
                    </ToggleChip>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted">Always check labels if you have an allergy.</p>
                {avoidOptions.length > 0 && (
                  <>
                    <p className="mt-3 text-xs font-bold text-brown-dark">Avoid</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {avoidOptions.map((a) => (
                        <ToggleChip key={a} type="checkbox" name="avoid" value={a} checked={avoid.includes(a)}>
                          {a}
                        </ToggleChip>
                      ))}
                    </div>
                  </>
                )}
                {userId && (
                  <p className="mt-1 text-xs text-muted">
                    Your saved restrictions are ticked by default.{" "}
                    <Link href="/profile" className="font-bold text-brown-dark underline">Edit them in your profile</Link>
                  </p>
                )}
              </fieldset>

              <label className="block">
                <span className="mb-1 block text-sm font-bold text-brown-dark">Cuisine</span>
                <select name="cuisine" defaultValue={cuisine ?? ""} className={input}>
                  <option value="">Any cuisine</option>
                  {cuisines.map((c) => (
                    <option key={c} value={c}>
                      {c} ({counts.cuisines[c] ?? 0})
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <button className={`${btn.primary} w-full`}>Apply filters</button>
                {/* a full page load (like "Apply") so options ticked but not yet applied are reset too */}
                <a href={clearHref} className={`${btn.outline} w-full`}>Clear filters</a>
              </div>
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
          <ActiveFilters chips={activeChips} clearHref={clearHref} />

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
              <Link href={activeChips.length ? clearHref : "/recipes"} className={btn.outline}>Clear filters</Link>
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
