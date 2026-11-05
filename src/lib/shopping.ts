import "server-only";
import { prisma } from "./db";

export interface ShoppingListGroup {
  /** null for items the user added by hand ("Other items"). */
  recipe: { id: number; name: string } | null;
  items: { id: number; name: string; measure: string; checked: boolean }[];
}

/** The user's shopping list grouped by recipe (A-Z), hand-added items last, ticked items at the bottom of each group. */
export async function getShoppingList(userId: number): Promise<ShoppingListGroup[]> {
  const items = await prisma.shoppingListItem.findMany({
    where: { userId },
    orderBy: { id: "asc" },
    include: { ingredient: { select: { name: true } }, recipe: { select: { id: true, name: true } } },
  });
  const groups = new Map<number | null, ShoppingListGroup>();
  for (const i of items) {
    const key = i.recipe?.id ?? null;
    const group = groups.get(key) ?? { recipe: i.recipe, items: [] };
    group.items.push({ id: i.id, name: i.ingredient.name, measure: i.measure, checked: i.checked });
    groups.set(key, group);
  }
  for (const g of groups.values()) g.items.sort((a, b) => Number(a.checked) - Number(b.checked));
  return [...groups.values()].sort((a, b) => {
    if (!a.recipe || !b.recipe) return a.recipe ? -1 : b.recipe ? 1 : 0;
    return a.recipe.name.localeCompare(b.recipe.name);
  });
}

/** Ingredient ids already on the user's list for this recipe. */
export async function getShoppingIngredientIds(userId: number, recipeId: number): Promise<Set<number>> {
  const items = await prisma.shoppingListItem.findMany({ where: { userId, recipeId }, select: { ingredientId: true } });
  return new Set(items.map((i) => i.ingredientId));
}
