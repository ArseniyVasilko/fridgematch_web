"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUserId } from "@/lib/session";

export interface SaveRecipeResult {
  saved?: boolean;
  error?: string;
}

/** Heart button: saves (saved = true) or unsaves a recipe for the logged-in user. */
export async function setRecipeSaved(recipeId: number, saved: boolean): Promise<SaveRecipeResult> {
  const userId = await requireUserId(`/recipes/${recipeId}`);
  if (!Number.isInteger(recipeId) || typeof saved !== "boolean") return { error: "That recipe can't be saved." };

  if (saved) {
    const exists = await prisma.recipe.count({ where: { id: recipeId } });
    if (!exists) return { error: "That recipe no longer exists." };
    await prisma.savedRecipe.upsert({
      where: { userId_recipeId: { userId, recipeId } },
      create: { userId, recipeId },
      update: {},
    });
  } else {
    await prisma.savedRecipe.deleteMany({ where: { userId, recipeId } });
  }
  revalidatePath("/pantry");
  return { saved };
}
