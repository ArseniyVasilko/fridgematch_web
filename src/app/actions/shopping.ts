"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { LIMITS } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { ensureIngredient } from "@/lib/import-meals";
import { toPantryAmount } from "@/lib/measure";
import { requireUserId } from "@/lib/session";
import { getShoppingIngredientIds } from "@/lib/shopping";

export interface ShoppingFormState {
  ok?: boolean;
  message?: string;
  error?: string;
  /** increments on success so the client can reset the form */
  n?: number;
}

const measureSchema = z.string().trim().max(LIMITS.shoppingMeasureLength, "That amount is too long.");

const itemSchema = z.object({
  name: z.string().trim().min(1, "Enter an ingredient.").max(LIMITS.ingredientNameLength, "That name is too long."),
  measure: measureSchema,
});

const recipeItemsSchema = z
  .array(z.object({ ingredientId: z.number().int().positive(), measure: measureSchema }))
  .max(LIMITS.ingredientsPerList);

const LIST_FULL = `Your shopping list can hold up to ${LIMITS.shoppingListItems} items. Remove some to add more.`;

async function roomLeft(userId: number) {
  return LIMITS.shoppingListItems - (await prisma.shoppingListItem.count({ where: { userId } }));
}

function readItem(formData: FormData) {
  return itemSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    measure: String(formData.get("measure") ?? ""),
  });
}

/**
 * Adds missing ingredients from a recipe (one + button, or "Add all missing").
 * Bound on the recipe page: addToShoppingList.bind(null, recipeId, items).
 * Ingredients already on the list for this recipe are skipped.
 */
export async function addToShoppingList(
  recipeId: number,
  items: { ingredientId: number; measure: string }[],
): Promise<ShoppingFormState> {
  const userId = await requireUserId(`/recipes/${recipeId}`);
  const parsed = recipeItemsSchema.safeParse(items);
  if (!Number.isInteger(recipeId) || !parsed.success) return { error: "Those ingredients can't be added." };

  const [recipeIngredients, onList, room] = await Promise.all([
    prisma.recipeIngredient.findMany({ where: { recipeId }, select: { ingredientId: true } }),
    getShoppingIngredientIds(userId, recipeId),
    roomLeft(userId),
  ]);
  const inRecipe = new Set(recipeIngredients.map((r) => r.ingredientId));
  const toAdd = new Map<number, string>();
  for (const { ingredientId, measure } of parsed.data) {
    if (inRecipe.has(ingredientId) && !onList.has(ingredientId) && !toAdd.has(ingredientId)) toAdd.set(ingredientId, measure);
  }
  if (toAdd.size === 0) return { ok: true, message: "Already on your shopping list." };
  if (toAdd.size > room) return { error: LIST_FULL };

  await prisma.shoppingListItem.createMany({
    data: [...toAdd].map(([ingredientId, measure]) => ({ userId, recipeId, ingredientId, measure })),
  });
  revalidatePath(`/recipes/${recipeId}`);
  revalidatePath("/shopping-list");
  return { ok: true, message: toAdd.size === 1 ? "Added to your shopping list." : `Added ${toAdd.size} items to your shopping list.` };
}

/** Item typed in on the profile page ("Other items"). */
export async function addShoppingItem(prev: ShoppingFormState, formData: FormData): Promise<ShoppingFormState> {
  const userId = await requireUserId("/shopping-list");
  const parsed = readItem(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message, n: prev.n };
  if ((await roomLeft(userId)) < 1) return { error: LIST_FULL, n: prev.n };
  const { name, measure } = parsed.data;
  await prisma.shoppingListItem.create({
    data: { userId, ingredientId: await ensureIngredient(prisma, name), measure },
  });
  revalidatePath("/shopping-list");
  return { ok: true, message: `Added ${name} to your shopping list.`, n: (prev.n ?? 0) + 1 };
}

export async function updateShoppingItem(_prev: ShoppingFormState, formData: FormData): Promise<ShoppingFormState> {
  const userId = await requireUserId("/shopping-list");
  const id = Number(formData.get("id"));
  const parsed = readItem(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, measure } = parsed.data;
  // updateMany with userId in the filter: users can only change their own items
  const res = await prisma.shoppingListItem.updateMany({
    where: { id, userId },
    data: { ingredientId: await ensureIngredient(prisma, name), measure },
  });
  if (res.count === 0) return { error: "That item no longer exists." };
  revalidatePath("/shopping-list");
  return { ok: true, message: `Saved ${name}.` };
}

/** Ticks or unticks an item. The form sends the new state as checked=1 or 0. */
export async function toggleShoppingItem(formData: FormData) {
  const userId = await requireUserId("/shopping-list");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await prisma.shoppingListItem.updateMany({ where: { id, userId }, data: { checked: formData.get("checked") === "1" } });
  revalidatePath("/shopping-list");
}

export async function deleteShoppingItem(formData: FormData) {
  const userId = await requireUserId("/shopping-list");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await prisma.shoppingListItem.deleteMany({ where: { id, userId } });
  revalidatePath("/shopping-list");
}

/** Bought: adds every ticked item to My Pantry and takes it off the list. */
export async function moveCheckedToPantry() {
  const userId = await requireUserId("/shopping-list");
  const items = await prisma.shoppingListItem.findMany({
    where: { userId, checked: true },
    select: { id: true, ingredientId: true, measure: true },
  });
  if (items.length === 0) return;
  await prisma.$transaction([
    prisma.pantryItem.createMany({
      data: items.map((i) => ({ userId, ingredientId: i.ingredientId, ...toPantryAmount(i.measure) })),
    }),
    prisma.shoppingListItem.deleteMany({ where: { userId, id: { in: items.map((i) => i.id) } } }),
  ]);
  revalidatePath("/shopping-list");
  revalidatePath("/pantry");
}
