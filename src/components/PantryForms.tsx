"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { addPantryItem, deletePantryItem, updatePantryItem, type PantryFormState } from "@/app/actions/pantry";
import { toDateInput } from "@/lib/expiry";
import { PANTRY_UNITS } from "@/lib/measure";
import { IngredientField } from "./IngredientField";
import { btn, input, label } from "./ui";

export function SubmitButton({ children, className = btn.primary }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Submit button with the action's success or error message beside it (pantry and profile forms). */
export function SubmitRow({
  state,
  className,
  children,
}: {
  state: { ok?: boolean; message?: string; error?: string };
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <SubmitButton className={className}>{children}</SubmitButton>
      <p aria-live="polite" className={`text-sm font-semibold ${state.error ? "text-tomato" : "text-herb"}`}>
        {state.error ?? (state.ok ? <><Check className="mr-1 inline h-4 w-4" aria-hidden />{state.message}</> : null)}
      </p>
    </div>
  );
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateInput(d);
}

function Fields({
  prefix,
  defaults,
}: {
  prefix: string;
  defaults?: { name: string; quantity: number | null; unit: string | null; expiry: string };
}) {
  const expiryRef = useRef<HTMLInputElement>(null);
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-[2fr_1fr_1fr_1.6fr]">
      <div className="col-span-2 sm:col-span-1">
        <label htmlFor={`${prefix}-name`} className={label}>Ingredient</label>
        <IngredientField id={`${prefix}-name`} defaultValue={defaults?.name} />
      </div>
      <div>
        <label htmlFor={`${prefix}-qty`} className={label}>Quantity</label>
        <input id={`${prefix}-qty`} name="quantity" inputMode="decimal" placeholder="optional" defaultValue={defaults?.quantity ?? ""} className={input} />
      </div>
      <div>
        <label htmlFor={`${prefix}-unit`} className={label}>Unit</label>
        <select id={`${prefix}-unit`} name="unit" defaultValue={defaults?.unit ?? "pcs"} className={input}>
          {PANTRY_UNITS.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="col-span-2 sm:col-span-1">
        <label htmlFor={`${prefix}-expiry`} className={label}>Expiry date</label>
        <input ref={expiryRef} id={`${prefix}-expiry`} name="expiry" type="date" defaultValue={defaults?.expiry ?? ""} className={input} />
        <div className="mt-1.5 flex flex-wrap gap-1">
          {[
            ["Tomorrow", 1],
            ["3 days", 3],
            ["1 week", 7],
            ["2 weeks", 14],
          ].map(([text, days]) => (
            <button
              key={text}
              type="button"
              onClick={() => {
                if (expiryRef.current) expiryRef.current.value = daysFromNow(days as number);
              }}
              className="rounded-full border border-line bg-cream px-2 py-0.5 text-xs font-semibold text-brown-dark hover:bg-sand"
            >
              {text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AddPantryItemForm() {
  const [state, action] = useActionState<PantryFormState, FormData>(addPantryItem, { n: 0 });
  return (
    <form action={action} className="space-y-3">
      {/* key resets the fields after each successful add */}
      <Fields key={state.n} prefix="add" />
      <SubmitRow state={state}>
        <Plus className="h-4 w-4" aria-hidden /> Add to pantry
      </SubmitRow>
    </form>
  );
}

export function PantryItemActions({
  item,
}: {
  item: { id: number; name: string; quantity: number | null; unit: string | null; expiryDate: Date | null };
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState<PantryFormState, FormData>(async (prev, fd) => {
    const res = await updatePantryItem(prev, fd);
    if (res.ok) setEditing(false);
    return res;
  }, {});

  if (editing) {
    return (
      <form action={action} className="mt-1 w-full basis-full space-y-3 rounded-xl bg-sand/60 p-3">
        <input type="hidden" name="id" value={item.id} />
        <Fields
          prefix={`edit-${item.id}`}
          defaults={{ name: item.name, quantity: item.quantity, unit: item.unit, expiry: toDateInput(item.expiryDate) }}
        />
        {state.error && <p className="text-sm font-semibold text-tomato">{state.error}</p>}
        <div className="flex gap-2">
          <SubmitButton>Save</SubmitButton>
          <button type="button" className={btn.ghost} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => setEditing(true)} className={`${btn.ghost} px-2`} aria-label={`Edit ${item.name}`}>
        <Pencil className="h-4 w-4" aria-hidden />
      </button>
      <form action={deletePantryItem}>
        <input type="hidden" name="id" value={item.id} />
        <SubmitButton className={`${btn.danger} px-2`}>
          <Trash2 className="h-4 w-4" aria-hidden />
          <span className="sr-only">Remove {item.name}</span>
        </SubmitButton>
      </form>
    </div>
  );
}
