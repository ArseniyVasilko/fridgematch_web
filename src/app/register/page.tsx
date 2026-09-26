import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { registerAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/AuthForm";
import { AuthShell } from "@/components/AuthShell";
import { first, type SearchParams } from "@/lib/search-params";
import { getUserId, safeReturnTo } from "@/lib/session";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const sp = (await searchParams) as SearchParams;
  const callbackUrl = safeReturnTo(first(sp.callbackUrl));
  if (await getUserId()) redirect(callbackUrl);
  return (
    <AuthShell
      title="Create your account"
      intro="Free, and only needed to save things. Searching recipes works without an account."
      returning={callbackUrl !== "/"}
    >
      <AuthForm mode="register" action={registerAction} callbackUrl={callbackUrl} />
    </AuthShell>
  );
}
