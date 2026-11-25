"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Check, ListPlus, Loader2, Plus } from "lucide-react";
import type { ShoppingFormState } from "@/app/actions/shopping";
import { btn, hoverHint as hint } from "./ui";

/** addToShoppingList with the recipe and its items bound (see the recipe page). */
type AddAction = (prev: ShoppingFormState, formData: FormData) => Promise<ShoppingFormState>;

const plus =
  "flex h-7 w-7 items-center justify-center rounded-full border-2 border-brown/70 bg-card text-brown-dark transition hover:bg-sand disabled:opacity-60";
const addAllLabel = (count: number) => `Add all missing to shopping list (${count})`;

/** + on a missing ingredient, or a tick once it's on the list. */
export function AddIngredientButton({ action, name, onList }: { action: AddAction; name: string; onList: boolean }) {
  const [state, formAction, pending] = useActionState(action, {});
  if (onList) {
    return (
      <span title="On your shopping list" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-herb-soft text-herb">
        <Check className="h-4 w-4" aria-hidden />
        <span className="sr-only">{name} is on your shopping list</span>
      </span>
    );
  }
  return (
    <form action={formAction} className="group/hint relative shrink-0">
      <button disabled={pending} aria-label={`Add ${name} to shopping list`} className={plus}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
      </button>
      {/* also shows the error if adding failed (e.g. the list is full) */}
      <span
        role={state.error ? "alert" : undefined}
        aria-hidden={!state.error}
        className={`${hint} ${state.error ? "bg-tomato opacity-100" : "bg-ink opacity-0"}`}
      >
        {state.error ?? "Add to shopping list"}
      </span>
    </form>
  );
}

export function AddAllMissingButton({ action, count }: { action: AddAction; count: number }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <button disabled={pending} className={`${btn.outline} text-sm`}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <ListPlus className="h-4 w-4" aria-hidden />}
        {addAllLabel(count)}
      </button>
      {state.error && <p role="alert" className="text-sm font-semibold text-tomato">{state.error}</p>}
    </form>
  );
}

/** Guests: the same + leads to Log in, then back to the recipe (design document, UC2). */
export function LoginToAddLink({ href, name }: { href: string; name: string }) {
  return (
    <span className="group/hint relative shrink-0">
      <Link href={href} aria-label={`Log in to add ${name} to your shopping list`} className={plus}>
        <Plus className="h-4 w-4" aria-hidden />
      </Link>
      <span aria-hidden className={`${hint} bg-ink opacity-0`}>Log in to add to shopping list</span>
    </span>
  );
}

export function LoginToAddAllLink({ href, count }: { href: string; count: number }) {
  return (
    <Link href={href} className={`${btn.outline} text-sm`}>
      <ListPlus className="h-4 w-4" aria-hidden /> {addAllLabel(count)}
    </Link>
  );
}
