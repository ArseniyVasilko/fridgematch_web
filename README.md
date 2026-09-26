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

**Round 2 (should-haves, not started):** shopping list (the schema already has `ShoppingListItem`), saved recipes (heart icon), "mark as cooked" (subtracts ingredients from the pantry), PWA with push expiry reminders.
**Could-haves:** community recipes, dietary filters, group fridges.

## Getting started

Requires Node.js 20.9 or newer.

```bash
npm install                 # also runs `prisma generate`
cp .env.example .env        # then set AUTH_SECRET (run: npx auth secret)
npm run db:push             # creates the SQLite database (dev.db)
npm run sync:mealdb         # imports the TheMealDB catalogue (about 300 recipes, needs internet)
npm run dev                 # http://localhost:3000
```

No internet? Run `npm run db:seed` instead of `sync:mealdb`. It loads 18 sample recipes written for FridgeMatch, without photos. The next `sync:mealdb` replaces them.

### Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Unit tests (Vitest): matching, ingredient names, measures, expiry |
| `npm run lint` | ESLint |
| `npm run db:push` | Applies `prisma/schema.prisma` to the database |
| `npm run db:seed` | Loads the offline sample recipes |
| `npm run sync:mealdb` | Imports or updates the full TheMealDB catalogue (safe to re-run) |

## Tech stack (design doc section 5.2)

- **Next.js 16** (App Router) with TypeScript. The backend is inside Next.js: server components, server actions for forms (with built-in CSRF protection), and an API route for autocomplete.
- **Prisma 7** ORM. **SQLite** for development through the `better-sqlite3` driver adapter.
- **Auth.js (NextAuth v5)** with email and password. Passwords are hashed with bcrypt and sessions are signed, http-only JWT cookies.
- **Tailwind CSS 4**, **lucide** icons, and the fonts **Chewy** and **Nunito Sans** (self-hosted through `@fontsource`, so no request goes to Google).
- **TheMealDB** for recipe data. It is only called by the sync script on the server, so no user data reaches it.

## Project structure

```
prisma/schema.prisma        database schema (User, Ingredient, PantryItem, ShoppingListItem, Recipe, RecipeIngredient)
prisma/seed.ts              offline sample data (prisma/fixtures/sample-meals.json)
scripts/sync-mealdb.ts      TheMealDB import
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
3. **Matching** (`src/lib/matching.ts`) follows section 5.1. Score = (have + 0.5 × part) / all ingredients. "Part" only applies when the pantry quantity can be compared with the recipe measure in the same unit (e.g. 2 eggs in the pantry, recipe needs 3). Free-text measures like "to taste" count as have. Ties are broken by fewer missing ingredients, then by more soon-to-expire pantry items used.
   - Ingredient names are compared by their *core*: "Basmati Rice" matches "rice", but "Rice Vinegar" does not, and "chicken" matches "Chicken Breast" but not "Chicken Stock". The rules and their tests are in `src/lib/ingredients.ts`.
   - **"I have the basics"** (on by default, can be switched off in the filters): salt, pepper, oil and water never count as missing.
   - Expired pantry items are not used for matching.
4. **No cooking time or servings** on the cards, because TheMealDB doesn't provide them. The cards show meal type and cuisine instead. If we want them later, community recipes could add them.
5. **Recently viewed recipes** (from the mobile wireframe) are stored in the browser's localStorage, so they also work for guests.
6. **"Popular recipes"** is a daily-rotating pick for now, because we have no usage data yet.

## Deploying to Vercel (production)

SQLite does not work on Vercel, because the file system is temporary. For production, use PostgreSQL (for example Vercel Postgres or Neon, as planned in the doc):

1. `npm i @prisma/adapter-pg pg`
2. In `prisma/schema.prisma`, change `provider = "sqlite"` to `provider = "postgresql"`.
3. In `src/lib/create-prisma.ts`, replace the adapter with `new PrismaPg({ connectionString: process.env.DATABASE_URL })`, and remove `serverExternalPackages` from `next.config.ts`.
4. In Vercel, set `DATABASE_URL` and `AUTH_SECRET`, then run `npx prisma db push` and `npm run sync:mealdb` once against the production database.

## AI use

The first version of this code was generated with Claude (see the `Co-Authored-By` lines in the commits), following the design document. As agreed in the design doc (sections 5.4 and 5.5), each part should be reviewed in a pull request by the team member responsible for it before it counts as done:

- Matching, sync and auth: Arseniy
- Pages and UI: Boglár
- Pantry and account: Isabel

**Not verified yet:** the live TheMealDB sync. The build environment had no internet access, so it was tested only with the sample data. Run `npm run sync:mealdb` and check the results with real recipes.
