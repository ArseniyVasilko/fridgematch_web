import type { Metadata } from "next";
import Link from "next/link";
import { Refrigerator } from "lucide-react";
import { moveCheckedToPantry } from "@/app/actions/shopping";
import { SubmitButton } from "@/components/PantryForms";
import { AddShoppingItemForm, ShoppingItemRow } from "@/components/ShoppingListForms";
import { btn, card } from "@/components/ui";
import { requireUserId } from "@/lib/session";
import { getShoppingList } from "@/lib/shopping";

export const metadata: Metadata = { title: "Shopping List" };

export default async function ShoppingListPage() {
  const userId = await requireUserId("/shopping-list");
  const groups = await getShoppingList(userId);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <h1 className="text-5xl">Shopping List</h1>
      <p className="mt-1 font-semibold text-muted">
        Missing ingredients you add from a recipe show up here. Tick them off as you shop.
      </p>

      {groups.length > 0 ? (
        <div className="mt-5 space-y-5">
          {groups.map((g) => (
            <section key={g.recipe?.id ?? "other"} aria-label={g.recipe?.name ?? "Other items"}>
              <h2 className="font-sans text-lg font-extrabold text-ink">
                {g.recipe ? (
                  <Link href={`/recipes/${g.recipe.id}`} className="hover:underline">{g.recipe.name}</Link>
                ) : (
                  "Other items"
                )}
              </h2>
              <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-card">
                {g.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <ShoppingItemRow item={item} />
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {groups.some((g) => g.items.some((i) => i.checked)) && (
            <form action={moveCheckedToPantry}>
              <SubmitButton className={btn.outline}>
                <Refrigerator className="h-4 w-4" aria-hidden /> Move ticked to pantry
              </SubmitButton>
            </form>
          )}
        </div>
      ) : (
        <p className={`${card} mt-5 p-5 text-muted`}>
          Your list is empty. Open a{" "}
          <Link href="/recipes" className="font-bold text-brown-dark underline">recipe</Link> and tap + next to a missing
          ingredient to add it here.
        </p>
      )}

      <section aria-labelledby="add-heading" className={`${card} mt-6 p-4 sm:p-5`}>
        <h2 id="add-heading" className="mb-3 font-sans text-lg font-extrabold text-ink">Add an item</h2>
        <AddShoppingItemForm />
      </section>
    </div>
  );
}
