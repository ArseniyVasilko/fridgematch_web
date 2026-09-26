import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Logged-in user id, or null for guests. */
export async function getUserId(): Promise<number | null> {
  const session = await auth();
  const id = Number(session?.user?.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * For pages and actions that need an account. Guests are sent to the login
 * page and returned to `returnTo` afterwards (design document, 5.1).
 */
export async function requireUserId(returnTo: string): Promise<number> {
  const id = await getUserId();
  if (!id) redirect(`/login?callbackUrl=${encodeURIComponent(safeReturnTo(returnTo))}`);
  return id;
}

/** Only allow same-site relative paths as redirect targets. */
export function safeReturnTo(value: unknown, fallback = "/"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
