import type { Metadata } from "next";
import Link from "next/link";
import { card } from "@/components/ui";
import { VeggiesIllustration } from "@/components/illustrations";

export const metadata: Metadata = { title: "About / Help" };

const FAQ = [
  {
    q: "Do I need an account?",
    a: "No. You can enter ingredients, browse recipes and read full recipes as a guest. An account is only needed to save things, like your pantry.",
  },
  {
    q: "How are recipes ranked?",
    a: "Each recipe gets a score: the share of its ingredients you already have. If your pantry has only part of an amount (for example 1 of the 2 eggs a recipe needs), that ingredient counts as half. Recipes with the highest score come first; ties go to recipes with fewer missing ingredients and to recipes that use food expiring soon.",
  },
  {
    q: "What does “I have the basics” mean?",
    a: "Most kitchens have salt, pepper, cooking oil and water, so by default these never count as missing. Untick the option in the filters if you want them counted.",
  },
  {
    q: "How do expiry reminders work?",
    a: "Add an expiry date to items in My Pantry. Items expiring within 3 days are highlighted at the top, with a shortcut to recipes that use them. Expired items are not used for matching.",
  },
  {
    q: "Why don't recipes show cooking time or servings?",
    a: "Our recipe data comes from TheMealDB, which doesn't include these yet. We show the meal type and cuisine instead.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-5xl">About FridgeMatch</h1>
          <p className="mt-2 text-lg font-semibold text-muted">Good food. Less waste.</p>
        </div>
        <VeggiesIllustration className="hidden h-28 sm:block" />
      </div>

      <div className="mt-6 space-y-4 leading-relaxed">
        <p>
          FridgeMatch helps students and home cooks decide what to cook with the ingredients they already have. Instead of
          finding a recipe and hoping you have everything, you start from what&apos;s in your fridge and work backwards.
        </p>
        <p>Our three goals: reduce food waste, make meal planning less effort, and make leftovers useful.</p>
      </div>

      <h2 className="mt-10 text-3xl">How to use it</h2>
      <ol className="mt-3 list-decimal space-y-2 pl-6 marker:font-bold marker:text-brown-dark">
        <li>
          On the <Link href="/" className="font-bold text-brown-dark underline">home page</Link>, type the ingredients you have or tap the suggestions.
        </li>
        <li>Press <strong>Find Recipes</strong>. The best matches come first, with a bar showing how much you already have.</li>
        <li>Open a recipe to see what&apos;s missing and how to cook it.</li>
        <li>
          Create an account to save your <Link href="/pantry" className="font-bold text-brown-dark underline">pantry</Link> with
          expiry dates, then use <strong>Match with pantry</strong> so you don&apos;t have to type your ingredients every time.
        </li>
      </ol>

      <h2 className="mt-10 text-3xl">Questions</h2>
      <div className="mt-3 space-y-2">
        {FAQ.map((f) => (
          <details key={f.q} className={`${card} group p-4`}>
            <summary className="cursor-pointer font-extrabold text-ink marker:text-brown-dark">{f.q}</summary>
            <p className="mt-2 text-ink">{f.a}</p>
          </details>
        ))}
      </div>

      <h2 className="mt-10 text-3xl">The team</h2>
      <p className="mt-2">
        FridgeMatch is a student project for CS-E4400 Design of WWW Services at Aalto University, by Isabel Yee, Boglár Tóth
        and Arseniy Vasilko.
      </p>
      <p className="mt-4 text-sm text-muted">
        Recipe data and photos come from{" "}
        <a href="https://www.themealdb.com" className="underline" target="_blank" rel="noreferrer">TheMealDB</a>. Only ingredient
        and recipe searches are sent to it, never your account or pantry data. You can ask us to delete your account and data at any time.
      </p>
    </div>
  );
}
