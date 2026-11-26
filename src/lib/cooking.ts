import { expiryStatus } from "./expiry";
import { formatAmount, parseMeasure, toBaseAmount } from "./measure";
import type { PantryItemWithName } from "./pantry";

type RecipeIngredient = {
  ingredientId: number;
  measure: string;
};

export function planPantryDeductions(
  ingredients: RecipeIngredient[],
  pantry: PantryItemWithName[],
  now = new Date(),
) {
  const batches = pantry.flatMap((item) => {
    if (item.quantity == null || expiryStatus(item.expiryDate, now) === "expired") {
      return [];
    }

    const amount = toBaseAmount(item.quantity, item.unit);
    return amount ? [{ item, amount, remaining: amount.value }] : [];
  });

  // getPantry returns batches in expiry order. Break ties by ID so the
  // preview and confirmation calculate the same plan.
  batches.sort((a, b) => {
    const aExpiry = a.item.expiryDate?.getTime() ?? Infinity;
    const bExpiry = b.item.expiryDate?.getTime() ?? Infinity;
    return aExpiry - bExpiry || a.item.id - b.item.id;
  });

  for (const ingredient of ingredients) {
    const needed = parseMeasure(ingredient.measure);
    if (!needed) continue;

    let remaining = needed.value;
    for (const batch of batches) {
      if (remaining <= 0) break;
      if (
        batch.item.ingredientId !== ingredient.ingredientId ||
        batch.amount.unit !== needed.unit
      ) {
        continue;
      }

      const used = Math.min(remaining, batch.remaining);
      batch.remaining -= used;
      remaining -= used;
    }
  }

  return batches.flatMap(({ item, amount, remaining }) => {
    const used = amount.value - remaining;
    if (used <= 0) return [];

    return [{
      id: item.id,
      ingredientId: item.ingredientId,
      name: item.ingredient.name,
      quantityBefore: item.quantity!,
      quantityAfter: item.quantity! * (remaining / amount.value),
      unit: item.unit,
      expiryDate: item.expiryDate?.toISOString() ?? null,
      usedLabel: formatAmount({ value: used, unit: amount.unit }),
    }];
  });
}