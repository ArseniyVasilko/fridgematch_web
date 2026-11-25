import "server-only";
import type { RecipeCardData } from "@/components/RecipeCard";
import { prisma } from "./db";

/** Ids of the recipes the user saved, for filling in the hearts on recipe cards. */
export async function getSavedRecipeIds(userId: number): Promise<Set<number>> {
  const rows = await prisma.savedRecipe.findMany({ where: { userId }, select: { recipeId: true } });
  return new Set(rows.map((r) => r.recipeId));
}

export async function isRecipeSaved(userId: number, recipeId: number): Promise<boolean> {
  return (await prisma.savedRecipe.count({ where: { userId, recipeId } })) > 0;
}

/** The user's first `take` saved recipes, most recently saved first, and how many they saved in total. */
export async function getSavedRecipes(userId: number, take: number): Promise<{ recipes: RecipeCardData[]; total: number }> {
  const [rows, total] = await Promise.all([
    prisma.savedRecipe.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
      select: { recipe: { select: { id: true, name: true, category: true, area: true, imageUrl: true } } },
    }),
    prisma.savedRecipe.count({ where: { userId } }),
  ]);
  return { recipes: rows.map((r) => r.recipe), total };
}
