import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, ChefHat, Trash2 } from "lucide-react";
import { clearExpiredItems } from "@/app/actions/pantry";
import { JarIcon } from "@/components/illustrations";
import { AddPantryItemForm, PantryItemActions } from "@/components/PantryForms";
import { btn, card } from "@/components/ui";
import { expiryLabel, expiryStatus, EXPIRING_SOON_DAYS, type ExpiryStatus } from "@/lib/expiry";
import { getPantry, type PantryItemWithName } from "@/lib/pantry";
import { recipesUrl } from "@/lib/search-params";
import { requireUserId } from "@/lib/session";

export const metadata: Metadata = { title: "My Pantry" };

const BADGE: Record<ExpiryStatus, string> = {
  expired: "bg-tomato text-white",
  today: "bg-tomato-soft text-tomato",
  soon: "bg-amber-soft text-amber",
  fresh: "bg-herb-soft text-herb",
  none: "bg-sand-deep text-muted",
};

function formatQty(item: PantryItemWithName) {
  if (item.quantity == null) return null;
  const q = Number.isInteger(item.quantity) ? item.quantity : Number(item.quantity.toFixed(2));
  return item.unit && item.unit !== "pcs" ? `${q} ${item.unit}` : `${q}`;
}

function ItemRow({ item }: { item: PantryItemWithName }) {
  const status = expiryStatus(item.expiryDate);
  const qty = formatQty(item);
  const urgent = status === "expired" || status === "today" || status === "soon";
  return (
    <li className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 ${urgent ? "bg-tomato-soft/35" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className="font-extrabold text-ink">
          {item.ingredient.name}
          {qty && <span className="ml-2 font-semibold text-muted">× {qty}</span>}
        </p>
        {item.expiryDate && (
          <p className="text-xs text-muted">
            Best before {item.expiryDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </p>
        )}
      </div>
      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${BADGE[status]}`}>{expiryLabel(item.expiryDate)}</span>
      <PantryItemActions
        item={{ id: item.id, name: item.ingredient.name, quantity: item.quantity, unit: item.unit, expiryDate: item.expiryDate }}
      />
    </li>
  );
}

function Group({ title, items, hint }: { title: string; items: PantryItemWithName[]; hint?: string }) {
  if (!items.length) return null;
  return (
    <section aria-label={title} className="mt-6">
      <h2 className="text-2xl">
        {title} <span className="font-sans text-base font-bold text-muted">({items.length})</span>
      </h2>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
        {items.map((i) => (
          <ItemRow key={i.id} item={i} />
        ))}
      </ul>
    </section>
  );
}

export default async function PantryPage() {
  const userId = await requireUserId("/pantry");
  const items = await getPantry(userId);

  const expired = items.filter((i) => expiryStatus(i.expiryDate) === "expired");
  const useSoon = items.filter((i) => ["today", "soon"].includes(expiryStatus(i.expiryDate)));
  const fresh = items.filter((i) => expiryStatus(i.expiryDate) === "fresh");
  const noDate = items.filter((i) => expiryStatus(i.expiryDate) === "none");
  const useSoonNames = [...new Set(useSoon.map((i) => i.ingredient.name))];

  return (
    <div className="mx-auto max-w-4xl px-4 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-5xl">My Pantry</h1>
          <p className="mt-1 font-semibold text-muted">
            What you have at home. Items expiring within {EXPIRING_SOON_DAYS} days are highlighted.
          </p>
        </div>
        {items.length > 0 && (
          <Link href="/recipes?pantry=1" className={btn.primary}>
            <ChefHat className="h-4 w-4" aria-hidden /> Cook with my pantry
          </Link>
        )}
      </div>

      {useSoon.length > 0 && (
        <div role="status" className={`${card} mt-5 flex flex-col gap-3 border-tomato/40 bg-tomato-soft p-4 sm:flex-row sm:items-center`}>
          <CalendarClock className="h-8 w-8 shrink-0 text-tomato" aria-hidden />
          <div className="flex-1">
            <p className="font-extrabold text-ink">
              {useSoon.length === 1 ? "1 item needs" : `${useSoon.length} items need`} using soon
            </p>
            <p className="text-sm text-ink">{useSoonNames.join(", ")}</p>
          </div>
          <Link href={recipesUrl({ i: useSoonNames, pantry: true })} className={btn.primary}>
            Find recipes that use them <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      )}

      <section aria-labelledby="add-heading" className={`${card} mt-5 p-4 sm:p-5`}>
        <h2 id="add-heading" className="mb-3 font-sans text-lg font-extrabold text-ink">Add an ingredient</h2>
        <AddPantryItemForm />
      </section>

      {items.length === 0 ? (
        <div className={`${card} mt-6 flex flex-col items-center gap-3 p-8 text-center`}>
          <JarIcon className="h-16 w-14" />
          <p className="font-display text-2xl text-brown-dark">Your pantry is empty</p>
          <p className="max-w-sm text-muted">
            Add what&apos;s in your fridge and cupboards. We&apos;ll remind you what to use first and find recipes for it.
          </p>
        </div>
      ) : (
        <>
          <Group title="Use soon" items={useSoon} />
          <Group title="Fresh" items={fresh} />
          <Group title="No expiry date" items={noDate} hint="Add a date to get reminders." />
          {expired.length > 0 && (
            <section aria-label="Expired" className="mt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-2xl">
                  <AlertTriangle className="h-5 w-5 text-tomato" aria-hidden /> Expired
                  <span className="font-sans text-base font-bold text-muted">({expired.length})</span>
                </h2>
                <form action={clearExpiredItems}>
                  <button className={btn.danger}>
                    <Trash2 className="h-4 w-4" aria-hidden /> Remove all expired
                  </button>
                </form>
              </div>
              <p className="text-sm text-muted">Expired items are not used for recipe matching.</p>
              <ul className="mt-2 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {expired.map((i) => (
                  <ItemRow key={i.id} item={i} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
