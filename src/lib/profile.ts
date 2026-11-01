import "server-only";
import { z } from "zod";
import { LIMITS } from "./constants";
import { prisma } from "./db";
import { DIETS } from "./recipe-filters";
import { parseIngredientList, parseList } from "./search-params";

/** Account field rules, shared by registration and the profile page. */
export const nameSchema = z.string().trim().max(LIMITS.userNameLength).optional();
export const emailSchema = z.string().trim().toLowerCase().email("Please enter a valid email address.");
export const passwordSchema = z
  .string()
  .min(LIMITS.passwordMinLength, `Use at least ${LIMITS.passwordMinLength} characters.`)
  .max(LIMITS.passwordMaxLength);

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
    avoid: parseIngredientList(user.avoid, LIMITS.avoidedIngredients),
  };
}
