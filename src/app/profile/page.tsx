import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, LogOut, X } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { removeAvoidedIngredient } from "@/app/actions/profile";
import {
  AccountForm,
  AddAvoidedIngredientForm,
  DeleteAccountButton,
  DietaryForm,
  PasswordForm,
} from "@/components/ProfileForms";
import { btn, card, chip } from "@/components/ui";
import { getProfile } from "@/lib/profile";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "My Profile" };

function Section({ id, title, intro, children }: {
  id: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={id} className={`${card} mt-5 p-4 sm:p-5`}>
      <h2 id={id} className="font-sans text-lg font-extrabold text-ink">{title}</h2>
      {intro && <p className="text-sm text-muted">{intro}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function ProfilePage() {
  const userId = await requireUserId("/profile");
  const profile = await getProfile(userId);
  if (!profile) redirect("/login"); // the account was deleted in another session

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl">My Profile</h1>
          <p className="mt-1 font-semibold text-muted">Signed in as {profile.email}</p>
        </div>
        <form action={logoutAction}>
          <button className={btn.outline}>
            <LogOut className="h-4 w-4" aria-hidden /> Log out
          </button>
        </form>
      </div>

      <Section
        id="diet-heading"
        title="Dietary restrictions"
        intro="These are ticked under Diet whenever you search for recipes. You can untick them for a single search."
      >
        <DietaryForm diets={profile.diets} assumeBasics={profile.assumeBasics} />

        <div className="mt-5 border-t border-line pt-4">
          <p className="text-sm font-bold text-brown-dark">Ingredients to avoid</p>
          {profile.avoid.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {profile.avoid.map((a) => (
                <li key={a}>
                  <form action={removeAvoidedIngredient}>
                    <input type="hidden" name="name" value={a} />
                    <button className={chip} aria-label={`Stop avoiding ${a}`}>
                      {a} <X className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-muted">None yet. Recipes that use an ingredient you add here will be left out.</p>
          )}
          <div className="mt-3">
            <AddAvoidedIngredientForm />
          </div>
        </div>

        <Link href="/recipes" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brown-dark underline">
          Find recipes that fit <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </Section>

      <Section id="account-heading" title="Account details">
        <AccountForm name={profile.name} email={profile.email} />
      </Section>

      <Section id="password-heading" title="Change password">
        <PasswordForm />
      </Section>

      <div className="mt-6 flex justify-end">
        <DeleteAccountButton />
      </div>
    </div>
  );
}
