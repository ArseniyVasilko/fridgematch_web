# FridgeMatch

*Good food. Less waste.* Find recipes for what's in your fridge.

CS-E4400 Design of WWW Services: group project by Isabel Yee, Boglár Tóth and Arseniy Vasilko.
Built from the design document (Phase: Design, Focus area: User Interface).

## What's built (round 1: must-haves)

| Feature (design doc) | Where | Status |
| --- | --- | --- |
| Ingredient input: type with autocomplete, or tap "Try these" chips | Home, Recipe results | Done |
| Recipe matching and ranking (section 5.1 algorithm) | `/recipes?i=eggs,rice` | Done |
| Recipe details with have / part / missing for each ingredient | `/recipes/[id]` | Done |
| Personal pantry tracker: quantity, unit, expiry date, highlighting of expiring items | `/pantry` | Done |
| Guest mode, login required for saved data, return to the previous page after login | `/login`, `/register` | Done |
| Browse and search all recipes (UC7) | `/recipes`, header search | Done |
| About / Help | `/about` | Done |
| Mobile-first responsive layout | everywhere | Done |

**Round 2 (should-haves):** shopping list is done: add missing ingredients from a recipe with +, view, tick off and edit the list on `/shopping-list`, and move bought items to the pantry. Saved recipes are done: the heart on recipe cards and recipe pages saves a recipe to My Saved Recipes at the bottom of `/pantry`. Not started: "mark as cooked" (subtracts ingredients from the pantry), PWA with push expiry reminders.
**Could-haves:** community recipes, dietary filters, group fridges.

## Getting started

Requires Node.js 20.9 or newer and a PostgreSQL database. We use Neon (free): each developer works on their own Neon branch of the project, so nobody needs Postgres installed.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # set DATABASE_URL (your Neon branch) and AUTH_SECRET (run: npx auth secret)
npm run db:push             # creates the tables
npm run sync:mealdb         # imports the TheMealDB catalogue (790 recipes, needs internet)
npm run sync:open-recipes   # adds 1,352 recipes from the Open Recipe Corpus (needs internet)
npm run dev                 # http://localhost:3000
```

No internet? Run `npm run db:seed` instead of the two sync scripts. It loads 18 sample recipes written for FridgeMatch, without photos. The next `sync:mealdb` replaces them.

To get a Neon branch: in the Neon console, open the FridgeMatch project, choose **Branches → New branch** (from `main`), and copy its connection string into `DATABASE_URL`. A new branch starts with a copy of production's recipes and tables, so you can skip `db:push` and the sync scripts.

**Migrating from SQLite:** the app used SQLite (`dev.db`) until week 12. `dev.db` is no longer used or committed; set `DATABASE_URL` as above and delete your local `dev.db`.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Unit tests (Vitest): matching, ingredient names, measures, expiry |
| `npm run lint` | ESLint |
| `npm run db:push` | Applies `prisma/schema.prisma` to the database |
| `npm run db:seed` | Loads the offline sample recipes |
| `npm run sync:mealdb` | Imports or updates the full TheMealDB catalogue (safe to re-run) |
| `npm run sync:open-recipes` | Imports or updates the Open Recipe Corpus recipes (safe to re-run; `-- ./dir` reads local `recipes.jsonl` and `en.jsonl`) |
| `npx tsx scripts/check-diets.ts` | Compares our diet filters with the Open Recipe Corpus's diet tags and allergens |

## Tech stack (design doc section 5.2)

- **Next.js 16** (App Router) with TypeScript. The backend is inside Next.js: server components, server actions for forms (with built-in CSRF protection), and an API route for autocomplete.
- **Prisma 7** ORM with **PostgreSQL** (Neon) through the `@prisma/adapter-pg` driver adapter.
- **Auth.js (NextAuth v5)** with email and password. Passwords are hashed with bcrypt and sessions are signed, http-only JWT cookies.
- **Tailwind CSS 4**, **lucide** icons, and the fonts **Chewy** and **Nunito Sans** (self-hosted through `@fontsource`, so no request goes to Google).
- **TheMealDB** for recipe data. It is only called by the sync script on the server, so no user data reaches it.
- **Open Recipe Corpus** ([rippy1911/open-recipe-corpus](https://github.com/rippy1911/open-recipe-corpus)) for more recipes: Wikibooks and public-domain cookbooks, machine-translated from Polish, CC BY-SA 4.0. Each recipe's credit line is stored in `Recipe.attribution` and shown on its page.

## Project structure

```
prisma/schema.prisma        database schema (User, Ingredient, PantryItem, ShoppingListItem, Recipe, RecipeIngredient, SavedRecipe)
prisma/seed.ts              offline sample data (prisma/fixtures/sample-meals.json)
scripts/sync-mealdb.ts      TheMealDB import
scripts/sync-open-recipes.ts  Open Recipe Corpus import (src/lib/open-recipes.ts converts it)
scripts/check-diets.ts      diet filter check against the corpus
src/auth.ts                 Auth.js config
src/lib/matching.ts         ranking algorithm (pure functions, unit tested)
src/lib/ingredients.ts      ingredient name normalisation ("Chopped Tomatoes" matches "tomato")
src/lib/measure.ts          parses TheMealDB measures ("1/2 cup", "200g") for partial amounts
src/lib/expiry.ts           expiry status and labels
src/lib/recipes.ts          recipe queries (catalogue cached in memory)
src/lib/pantry.ts           pantry queries
src/app/                    pages: / , /recipes, /recipes/[id], /pantry, /login, /register, /about
src/app/actions/            server actions (auth, pantry)
src/components/             UI components (RecipeCard, IngredientInput, MatchBar, illustrations...)
```

## Design decisions to review as a team

1. **Colours.** The three colours from the doc are the design tokens (`src/app/globals.css`): cream `#F8F3EC`, brown `#8B6A4E` and accent `#D9B38C`. #8B6A4E on cream has a contrast ratio of only 4.46:1, just under the WCAG AA minimum for normal text. So body text and headings use two darker browns (`ink #3D2A1D`, `brown-dark #5B3D28`), and `#8B6A4E` is used for buttons (white text on it is 4.9:1) and icons. The accent `#D9B38C` is a tan colour even though the doc calls it "tomato red / herb green", so expiry status uses separate colours: tomato `#B23F2A` and herb `#4A7336`. Every text pair passes AA, and axe-core reports no WCAG 2.1 AA violations on the main pages.
2. **Recipe data is synced, not fetched live.** TheMealDB's free key only filters by one ingredient at a time. Its catalogue is small, so `sync:mealdb` stores it in our database and the matching runs locally. This is faster, needs no £10 premium key, and can be unit tested.
3. **Matching** (`src/lib/matching.ts`) follows section 5.1. Score = (have + 0.5 × part) / all ingredients. "Part" only applies when the pantry quantity can be compared with the recipe measure in the same unit (e.g. 2 eggs in the pantry, recipe needs 3; spoons and cups count as ml). On the results, partial ingredients are the amber part of the match bar, and "Enough of everything" in the filters hides recipes with anything missing or partial. Free-text measures like "to taste" count as have. Ties are broken by fewer missing ingredients, then by more soon-to-expire pantry items used.
   - Ingredient names are compared by their *core*: "Basmati Rice" matches "rice", but "Rice Vinegar" does not, and "chicken" matches "Chicken Breast" but not "Chicken Stock". The rules and their tests are in `src/lib/ingredients.ts`.
   - **"I have the basics"** (on by default, can be switched off in the filters): salt, pepper, oil and water never count as missing.
   - Expired pantry items are not used for matching.
4. **No cooking time or servings** on the cards, because TheMealDB doesn't provide them. The cards show meal type and cuisine instead. If we want them later, community recipes could add them.
5. **Recently viewed recipes** (from the mobile wireframe) are stored in the browser's localStorage, so they also work for guests.
6. **"Popular recipes"** is a daily-rotating pick for now, because we have no usage data yet.
7. **Saved Recipes is a section of My Pantry, not its own page.** Sections 3.1 and 3.2 list Saved Recipes as a separate page, and 4.2 puts it in the desktop header. Instead, it's the last section of `/pantry` (`/pantry#saved-recipes`), reached from the home page's "Saved recipes" box, Help, or My Pantry, with no header link. Recipes opened from it get a "Back to My Saved Recipes" link. It shows 6 recipes, then "Show more".
8. **Home page shortcuts.** Section 4.1 lists recipe matching among the home page feature boxes. The "Ingredient matching" box was replaced by a "Saved recipes" box, and matching moved into the hero as a "Match with my ingredients" button under the search bar. It opens pantry results sorted by fewest missing; guests and empty pantries get a popup instead.

## Deploying to Vercel (production)

Production runs on Vercel with a Neon PostgreSQL database.

1. In the Vercel project, open **Storage → Create Database → Neon** (Marketplace) and connect it to the project. This sets `DATABASE_URL` (pooled, used by the app) and `DATABASE_URL_UNPOOLED` (direct, used by `db:push`).
2. In **Settings → Environment Variables**, add `AUTH_SECRET` (run `npx auth secret`).
3. Once, from your machine with those two Neon URLs in `.env` (`vercel env pull` or copy them from Neon): `npm run db:push`, `npm run sync:mealdb`, `npm run sync:open-recipes`.
4. Redeploy. Check sign-up, My Pantry, My Profile and the shopping list on the live site.

After a schema change, run `npm run db:push` against production before deploying the code that uses it.

## AI use

The first version of this code was generated with Claude (see the `Co-Authored-By` lines in the commits), following the design document. As agreed in the design doc (sections 5.4 and 5.5), each part should be reviewed in a pull request by the team member responsible for it before it counts as done:

- Matching, sync and auth: Arseniy
- Pages and UI: Boglár
- Pantry and account: Isabel

The PostgreSQL switch, partial-quantity results, Open Recipe Corpus import and diet check were added with Claude in week 12; the live TheMealDB and corpus syncs were run against a local PostgreSQL database (790 and 1,352 recipes).
