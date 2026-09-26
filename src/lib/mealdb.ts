/**
 * TheMealDB client (https://www.themealdb.com/api.php).
 *
 * Only ever called from the server (sync script / API routes), never from
 * the browser, so no user data or IP addresses reach the third party
 * (design document, 5.6). The free test key "1" is used unless
 * MEALDB_API_KEY is set.
 */

export interface MealDbMeal {
  idMeal: string;
  strMeal: string;
  strCategory: string | null;
  strArea: string | null;
  strInstructions: string | null;
  strMealThumb: string | null;
  strTags: string | null;
  strYoutube: string | null;
  strSource?: string | null;
  [key: string]: string | null | undefined;
}

export interface NormalisedMeal {
  externalId: string;
  name: string;
  category: string | null;
  area: string | null;
  instructions: string;
  imageUrl: string | null;
  youtubeUrl: string | null;
  sourceUrl: string | null;
  tags: string | null;
  ingredients: { name: string; measure: string }[];
}

function baseUrl() {
  const key = process.env.MEALDB_API_KEY || "1";
  return `https://www.themealdb.com/api/json/v1/${key}`;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}/${path}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`TheMealDB ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

const clean = (v: string | null | undefined) => {
  const t = (v ?? "").trim();
  return t.length ? t : null;
};

/** Convert TheMealDB's strIngredient1..20 / strMeasure1..20 into a list. */
export function normaliseMeal(meal: MealDbMeal): NormalisedMeal {
  const ingredients: { name: string; measure: string }[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = clean(meal[`strIngredient${i}`]);
    if (!name) continue;
    ingredients.push({ name, measure: clean(meal[`strMeasure${i}`]) ?? "" });
  }
  return {
    externalId: meal.idMeal,
    name: meal.strMeal.trim(),
    category: clean(meal.strCategory),
    area: clean(meal.strArea),
    instructions: (meal.strInstructions ?? "").trim(),
    imageUrl: clean(meal.strMealThumb),
    youtubeUrl: clean(meal.strYoutube),
    sourceUrl: clean(meal.strSource),
    tags: clean(meal.strTags),
    ingredients,
  };
}

/** All meals whose name starts with the given letter. */
export async function mealsByFirstLetter(letter: string): Promise<MealDbMeal[]> {
  const data = await getJson<{ meals: MealDbMeal[] | null }>(`search.php?f=${encodeURIComponent(letter)}`);
  return data.meals ?? [];
}

/** The whole catalogue (a few hundred meals) via 26 small requests. */
export async function fetchAllMeals(onProgress?: (letter: string, count: number) => void) {
  const all: MealDbMeal[] = [];
  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    const meals = await mealsByFirstLetter(letter);
    all.push(...meals);
    onProgress?.(letter, meals.length);
    await new Promise((r) => setTimeout(r, 150)); // be polite to the free API
  }
  return all;
}

/** TheMealDB's ingredient list, used for autocomplete. */
export async function fetchIngredientList(): Promise<string[]> {
  const data = await getJson<{ meals: { strIngredient: string }[] | null }>("list.php?i=list");
  return (data.meals ?? []).map((m) => m.strIngredient.trim()).filter(Boolean);
}
