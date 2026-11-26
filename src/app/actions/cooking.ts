"use server";

import { revalidatePath } from "next/cache";
import { planPantryDeductions } from "@/lib/cooking";
import { prisma } from "@/lib/db";
import { getPantry } from "@/lib/pantry";
import { getRecipe } from "@/lib/recipes";
import { requireUserId } from "@/lib/session";

export type CookState = {
  message?: string;
  error?: string;
};

class PantryChanged extends Error {}

export async function markAsCooked(
  recipeId: number,
  expectedPlan: string,
  _previousState: CookState,
  _formData: FormData,
): Promise<CookState> {
  const recipePath = `/recipes/${recipeId}`;
  const userId = await requireUserId(recipePath);

  try {
    const recipe = await getRecipe(recipeId);
    if (!recipe) return { error: "This recipe is no longer available." };

    await prisma.$transaction(async (tx) => {
      const pantry = await getPantry(userId, tx);
      const deductions = planPantryDeductions(recipe.ingredients, pantry);

      if (!deductions.length || JSON.stringify(deductions) !== expectedPlan) {
        throw new PantryChanged();
      }

      for (const deduction of deductions) {
        const where = {
          id: deduction.id,
          userId,
          ingredientId: deduction.ingredientId,
          quantity: deduction.quantityBefore,
          unit: deduction.unit,
          expiryDate: deduction.expiryDate ? new Date(deduction.expiryDate) : null,
        };

        const result = deduction.quantityAfter === 0
          ? await tx.pantryItem.deleteMany({ where })
          : await tx.pantryItem.updateMany({
              where,
              data: { quantity: deduction.quantityAfter },
            });

        if (result.count !== 1) throw new PantryChanged();
      }
    });
  } catch (error) {
    if (error instanceof PantryChanged) {
      revalidatePath(recipePath);
      return { error: "Your pantry changed. Review the updated amounts and try again." };
    }

    console.error("Could not update pantry after cooking", error);
    return { error: "Could not update your pantry. Please try again." };
  }

  revalidatePath(recipePath);
  revalidatePath("/pantry");
  revalidatePath("/recipes");

  return { message: "Marked as cooked. Your pantry was updated." };
}