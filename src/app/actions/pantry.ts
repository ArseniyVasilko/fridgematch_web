"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/expiry";
import { ensureIngredients } from "@/lib/import-meals";
import { slugifyIngredient, titleCase } from "@/lib/ingredients";
import { PANTRY_UNITS } from "@/lib/measure";
import { requireUserId } from "@/lib/session";

export interface PantryFormState {
  ok?: boolean;
  message?: string;
  error?: string;
  /** increments on success so the client can reset the form */
  n?: number;
}

const itemSchema = z.object({
  name: z.string().trim().min(1, "Enter an ingredient.").max(60, "That name is too long."),
  quantity: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : Number(v.replace(",", "."))))
    .refine((v) => v === null || (Number.isFinite(v) && v > 0 && v <= 100000), "Quantity must be a positive number."),
  unit: z.enum(["", ...PANTRY_UNITS]),
  expiry: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (!v) return null;
      const d = parseDateInput(v);
      if (!d) {
        ctx.addIssue({ code: "custom", message: "Pick a valid date." });
        return z.NEVER;
      }
      return d;
    }),
});

function readItem(formData: FormData) {
  return itemSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
    unit: String(formData.get("unit") ?? ""),
    expiry: String(formData.get("expiry") ?? ""),
  });
}

async function ingredientIdFor(name: string) {
  const ids = await ensureIngredients(prisma, [titleCase(name)]);
  return ids.get(slugifyIngredient(name))!;
}

export async function addPantryItem(prev: PantryFormState, formData: FormData): Promise<PantryFormState> {
  const userId = await requireUserId("/pantry");
  const parsed = readItem(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message, n: prev.n };
  const { name, quantity, unit, expiry } = parsed.data;
  await prisma.pantryItem.create({
    data: {
      userId,
      ingredientId: await ingredientIdFor(name),
      quantity,
      unit: quantity == null ? null : unit || "pcs",
      expiryDate: expiry,
    },
  });
  revalidatePath("/pantry");
  return { ok: true, message: `Added ${name} to your pantry.`, n: (prev.n ?? 0) + 1 };
}

export async function updatePantryItem(_prev: PantryFormState, formData: FormData): Promise<PantryFormState> {
  const userId = await requireUserId("/pantry");
  const id = Number(formData.get("id"));
  const parsed = readItem(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, quantity, unit, expiry } = parsed.data;
  // updateMany with userId in the filter: users can only change their own items
  const res = await prisma.pantryItem.updateMany({
    where: { id, userId },
    data: {
      ingredientId: await ingredientIdFor(name),
      quantity,
      unit: quantity == null ? null : unit || "pcs",
      expiryDate: expiry,
    },
  });
  if (res.count === 0) return { error: "That item no longer exists." };
  revalidatePath("/pantry");
  return { ok: true, message: `Saved ${name}.` };
}

export async function deletePantryItem(formData: FormData) {
  const userId = await requireUserId("/pantry");
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  await prisma.pantryItem.deleteMany({ where: { id, userId } });
  revalidatePath("/pantry");
}

export async function clearExpiredItems() {
  const userId = await requireUserId("/pantry");
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  await prisma.pantryItem.deleteMany({ where: { userId, expiryDate: { lt: startOfToday } } });
  revalidatePath("/pantry");
}
