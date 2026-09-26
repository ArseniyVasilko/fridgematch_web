import "server-only";
import { prisma } from "./db";
import { expiryStatus } from "./expiry";
import type { UserIngredient } from "./matching";

export async function getPantry(userId: number) {
  const items = await prisma.pantryItem.findMany({
    where: { userId },
    include: { ingredient: { select: { name: true } } },
  });
  // soonest expiry first, items without a date last, then by name
  return items.sort((a, b) => {
    const at = a.expiryDate?.getTime() ?? Infinity;
    const bt = b.expiryDate?.getTime() ?? Infinity;
    return at - bt || a.ingredient.name.localeCompare(b.ingredient.name);
  });
}

export type PantryItemWithName = Awaited<ReturnType<typeof getPantry>>[number];

/** Pantry items in the shape the matcher expects (expired food is left out). */
export async function getPantryForMatching(userId: number): Promise<UserIngredient[]> {
  const items = await getPantry(userId);
  return items
    .filter((i) => expiryStatus(i.expiryDate) !== "expired")
    .map((i) => ({
      name: i.ingredient.name,
      quantity: i.quantity,
      unit: i.unit,
      expiryDate: i.expiryDate,
      fromPantry: true,
    }));
}
