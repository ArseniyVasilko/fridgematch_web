import Link from "next/link";
import { ArrowRight, Heart, ListChecks, Refrigerator, Search, Users } from "lucide-react";
import { IngredientInput } from "@/components/IngredientInput";
import { FridgeIllustration, JarIcon, MotionDashes, VeggiesIllustration, BowlArt } from "@/components/illustrations";
import { MatchPantryButton } from "@/components/MatchPantryButton";
import { RecipeCard } from "@/components/RecipeCard";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { btn, card } from "@/components/ui";
import { LIMITS } from "@/lib/constants";
import { getPantryForMatching } from "@/lib/pantry";
import { getFeaturedRecipes } from "@/lib/recipes";
import { getSavedRecipeIds } from "@/lib/saved";
import { getUserId } from "@/lib/session";

const TRY_THESE = ["chicken", "eggs", "rice", "tomato", "onion"];

const FEATURES = [
  { icon: Refrigerator, title: "Pantry tracker", text: "Keep track of your ingredients and expiry dates.", href: "/pantry" },
  { icon: ListChecks, title: "Shopping list", text: "Add missing ingredients with one click.", href: "/shopping-list" },
  { icon: Heart, title: "Saved recipes", text: "Keep the recipes you love in one place.", href: "/pantry#saved-recipes" },
  { icon: Users, title: "Community recipes", text: "Discover and share recipes with fellow food lovers.", soon: true },
];

export default async function HomePage() {
  const [featured, userId] = await Promise.all([getFeaturedRecipes(LIMITS.featuredRecipes), getUserId()]);
  // expired items don't count: they aren't used for matching, so a pantry of only expired food is "empty"
  const [pantryCount, savedIds] = userId
    ? await Promise.all([getPantryForMatching(userId).then((p) => p.length), getSavedRecipeIds(userId)])
    : [0, new Set<number>()];

  return (
    <>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-4 sm:pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-line bg-sand px-5 py-7 sm:px-10 sm:py-10">
          <div className="relative z-10 max-w-xl">
            <h1 className="text-[2.35rem] leading-tight sm:text-6xl">What&apos;s in your fridge?</h1>
            <p className="mt-2 max-w-md text-base font-semibold text-muted sm:text-lg">
              Turn your ingredients into delicious meals and reduce food waste.
            </p>
            <div className="mt-5">
              <IngredientInput tryThese={TRY_THESE} />
            </div>
            <MatchPantryButton loggedIn={!!userId} pantryCount={pantryCount} />
          </div>
          <MotionDashes className="absolute right-[34%] top-10 hidden h-12 w-12 lg:block" />
          <FridgeIllustration className="absolute bottom-0 right-8 hidden h-[94%] max-h-96 lg:block" />
          <VeggiesIllustration className="pointer-events-none absolute -right-4 -top-2 h-28 opacity-90 sm:hidden" />
          <VeggiesIllustration className="absolute bottom-4 right-6 hidden h-40 sm:block lg:hidden" />
        </div>
      </section>

      {/* Features */}
      <section aria-label="What FridgeMatch does" className="mx-auto mt-6 grid max-w-6xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
        {FEATURES.map((f) => {
          const content = (
            <>
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sand-deep text-brown-dark">
                <f.icon className="h-6 w-6" aria-hidden />
              </span>
              <h2 className="mt-3 font-sans text-base font-extrabold text-ink">{f.title}</h2>
              <p className="mt-1 text-sm text-muted">{f.text}</p>
              {f.soon && (
                <span className="mt-2 inline-block rounded-full bg-sand-deep px-2 py-0.5 text-xs font-bold text-muted">Coming soon</span>
              )}
            </>
          );
          return f.href ? (
            <Link key={f.title} href={f.href} className={`${card} p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md`}>
              {content}
            </Link>
          ) : (
            <div key={f.title} className={`${card} p-4 text-center`}>
              {content}
            </div>
          );
        })}
      </section>

      <RecentlyViewed />

      {/* Popular recipes */}
      {featured.length > 0 && (
        <section aria-labelledby="popular-heading" className="mx-auto mt-10 max-w-6xl px-4">
          <div className="rounded-3xl border border-line bg-sand/70 p-4 sm:p-6">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id="popular-heading" className="text-2xl sm:text-3xl">Popular recipes</h2>
                <p className="text-sm font-semibold text-muted">Easy, delicious meals to get you started</p>
              </div>
              <Link href="/recipes" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-brown-dark hover:underline">
                View all recipes <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {featured.map((r) => (
                <RecipeCard key={r.id} recipe={r} href={`/recipes/${r.id}`} save={{ saved: savedIds.has(r.id), loggedIn: !!userId }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guest sign-up prompt */}
      {!userId && (
        <section className="mx-auto mt-8 max-w-6xl px-4">
          <div className={`${card} flex flex-col items-start gap-4 bg-sand p-5 sm:flex-row sm:items-center`}>
            <JarIcon className="h-14 w-12 shrink-0" />
            <div className="flex-1">
              <h2 className="font-sans text-lg font-extrabold text-ink">Save your ingredients</h2>
              <p className="text-sm text-muted">
                Create a free account to keep track of your pantry and save recipes.
              </p>
            </div>
            <Link href="/register" className={btn.primary}>Sign up</Link>
          </div>
        </section>
      )}

      {/* How it works */}
      <section aria-labelledby="how-heading" className="mx-auto mt-10 max-w-6xl px-4">
        <h2 id="how-heading" className="text-2xl sm:text-3xl">How it works</h2>
        <ol className="mt-4 grid grid-cols-3 gap-3">
          {[
            { n: 1, icon: <Refrigerator className="h-8 w-8" aria-hidden />, text: "Add the ingredients you have" },
            { n: 2, icon: <Search className="h-8 w-8" aria-hidden />, text: "Get matching recipes" },
            { n: 3, icon: <BowlArt className="h-14 w-16" />, text: "Cook and enjoy!" },
          ].map((s) => (
            <li key={s.n} className="flex flex-col items-center text-center">
              <span className="relative flex h-16 w-16 items-center justify-center text-brown-dark">
                <span className="absolute -left-1 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-extrabold text-ink">
                  {s.n}
                </span>
                {s.icon}
              </span>
              <span className="mt-1 text-sm font-semibold text-ink">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
