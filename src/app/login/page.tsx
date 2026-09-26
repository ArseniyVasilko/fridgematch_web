import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loginAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { first, type SearchParams } from "@/lib/search-params";
import { getUserId, safeReturnTo } from "@/lib/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = (await searchParams) as SearchParams;
  const callbackUrl = safeReturnTo(first(sp.callbackUrl));
  if (await getUserId()) redirect(callbackUrl);
  return (
    <AuthShell title="Welcome back" intro="Log in to see your pantry and what's about to expire." returning={callbackUrl !== "/"}>
      <AuthForm mode="login" action={loginAction} callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
