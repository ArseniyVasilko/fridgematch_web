/**
 * App-wide limits and durations. Kept free of "server-only" so client
 * components (form maxLength, local storage) and the server use the same values.
 */

export const LIMITS = {
  /** Ingredients kept from one list, e.g. the search URL or a pasted list. */
  ingredientsPerList: 30,
  /** Ingredients a user can save to avoid in their dietary profile. */
  avoidedIngredients: 30,
  ingredientNameLength: 60,
  userNameLength: 60,
  passwordMinLength: 8,
  passwordMaxLength: 200,
  /** bcrypt cost factor; the login check's dummy hash must use the same value. */
  passwordHashRounds: 10,
  pantryQuantityMax: 100_000,
  /** Recipes per "Show more" step on /recipes, and the most one page can show. */
  recipesPerPage: 48,
  recipesPerPageMax: 500,
  featuredRecipes: 4,
  recentlyViewedStored: 8,
  recentlyViewedShown: 4,
  /** Autocomplete: suggestions shown, and rows read from the database to rank them. */
  ingredientSuggestions: 8,
  ingredientSuggestionPool: 200,
} as const;

export const DURATIONS = {
  /** Pantry items expiring within this many days are highlighted. */
  expiringSoonDays: 3,
  sessionMaxAgeSeconds: 30 * 24 * 60 * 60,
  recipeCatalogueCacheMs: 5 * 60 * 1000,
  ingredientSuggestionsCacheSeconds: 300,
} as const;
