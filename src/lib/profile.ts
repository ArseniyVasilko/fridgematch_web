import "server-only";
import { z } from "zod";
import { prisma } from "./db";
import { DIETS } from "./recipe-filters";
import { parseIngredientList, parseList } from "./search-params";

/** Account field rules, shared by registration and the profile page. */
export const nameSchema = z.string().trim().max(60).optional();
export const emailSchema = z.string().trim().toLowerCase().email("Please enter a valid email address.");
export const passwordSchema = z.string().min(8, "Use at least 8 characters.").max(200);

/** A user's account details and dietary profile (diets, avoided ingredients, basics default). */
export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, diets: true, avoid: true, assumeBasics: true },
  });
  if (!user) return null;
  return {
    ...user,
    diets: parseList(user.diets, DIETS.map((d) => d.id)),
    avoid: parseIngredientList(user.avoid),
  };
}
