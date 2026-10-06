"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signOut, updateSession } from "@/auth";
import { prisma } from "@/lib/db";
import { emailSchema, getProfile, nameSchema, passwordSchema } from "@/lib/profile";
import { DIETS } from "@/lib/recipe-filters";
import { parseIngredientList, parseList } from "@/lib/search-params";
import { requireUserId } from "@/lib/session";

export interface ProfileFormState {
  ok?: boolean;
  message?: string;
  error?: string;
  /** increments on success so the client can reset the form */
  n?: number;
}

async function passwordMatches(userId: number, password: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
  return !!user && (await bcrypt.compare(password, user.passwordHash));
}

const accountSchema = z.object({ name: nameSchema, email: emailSchema });

export async function updateAccount(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const userId = await requireUserId("/profile");
  const parsed = accountSchema.safeParse({
    name: String(formData.get("name") ?? "") || undefined,
    email: String(formData.get("email") ?? ""),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const name = parsed.data.name || null;
  const { email } = parsed.data;
  const profile = await getProfile(userId);
  if (email !== profile?.email) {
    if (!(await passwordMatches(userId, String(formData.get("password") ?? "")))) {
      return { error: "Enter your current password to change your email." };
    }
    const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (taken) return { error: "An account with this email already exists." };
  }
  await prisma.user.update({ where: { id: userId }, data: { name, email } });
  await updateSession({ user: { name, email } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Saved your details." };
}

export async function updateDietary(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const userId = await requireUserId("/profile");
  const diets = parseList(formData.getAll("diet").map(String), DIETS.map((d) => d.id));
  await prisma.user.update({
    where: { id: userId },
    data: { diets: diets.join(","), assumeBasics: formData.get("basics") === "1" },
  });
  revalidatePath("/profile");
  return { ok: true, message: "Saved. Recipe searches now use these by default." };
}

export async function addAvoidedIngredient(prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const userId = await requireUserId("/profile");
  const [name] = parseIngredientList(String(formData.get("name") ?? ""));
  if (!name) return { error: "Enter an ingredient.", n: prev.n };
  const avoid = (await getProfile(userId))?.avoid ?? [];
  // parseIngredientList drops duplicates and keeps at most 30
  await prisma.user.update({ where: { id: userId }, data: { avoid: parseIngredientList([...avoid, name]).join(",") } });
  revalidatePath("/profile");
  return { ok: true, message: `Recipes with ${name} will be left out.`, n: (prev.n ?? 0) + 1 };
}

export async function removeAvoidedIngredient(formData: FormData) {
  const userId = await requireUserId("/profile");
  const name = String(formData.get("name") ?? "");
  const avoid = (await getProfile(userId))?.avoid ?? [];
  await prisma.user.update({ where: { id: userId }, data: { avoid: avoid.filter((a) => a !== name).join(",") } });
  revalidatePath("/profile");
}

export async function changePassword(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const userId = await requireUserId("/profile");
  const parsed = passwordSchema.safeParse(String(formData.get("newPassword") ?? ""));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (parsed.data !== formData.get("confirm")) return { error: "The new passwords don't match." };
  if (!(await passwordMatches(userId, String(formData.get("password") ?? "")))) {
    return { error: "Your current password is not right." };
  }
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(parsed.data, 10) } });
  return { ok: true, message: "Password changed." };
}

/** Deletes the account and, through cascades, its pantry and shopping list. */
export async function deleteAccount(_prev: ProfileFormState, formData: FormData): Promise<ProfileFormState> {
  const userId = await requireUserId("/profile");
  if (!(await passwordMatches(userId, String(formData.get("password") ?? "")))) {
    return { error: "That password is not right." };
  }
  await prisma.user.delete({ where: { id: userId } });
  await signOut({ redirectTo: "/" });
  return {};
}
