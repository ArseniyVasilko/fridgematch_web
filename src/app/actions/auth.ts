"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { emailSchema, nameSchema, passwordSchema } from "@/lib/profile";
import { safeReturnTo } from "@/lib/session";

export interface AuthFormState {
  error?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string>>;
  email?: string;
  name?: string;
}

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeReturnTo(formData.get("callbackUrl"));
  if (!email || !password) return { error: "Please enter your email and password.", email };
  try {
    await signIn("credentials", { email, password, redirectTo });
    return {};
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "That email and password don't match an account.", email };
    }
    throw error; // lets the successful-login redirect through
  }
}

const registerSchema = z.object({ name: nameSchema, email: emailSchema, password: passwordSchema });

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    name: String(formData.get("name") ?? "") || undefined,
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  };
  const redirectTo = safeReturnTo(formData.get("callbackUrl"));
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: AuthFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as "name" | "email" | "password";
      fieldErrors[key] ??= issue.message;
    }
    return { fieldErrors, email: raw.email, name: raw.name };
  }
  const { name, email, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) {
    return { fieldErrors: { email: "An account with this email already exists. Try logging in." }, email, name };
  }
  await prisma.user.create({
    data: { email, name: name || null, passwordHash: await bcrypt.hash(password, 10) },
  });
  try {
    await signIn("credentials", { email, password, redirectTo });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: "Account created, but logging in failed. Please log in." };
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
