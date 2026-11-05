"use client";

import { useActionState, useOptimistic, useState, startTransition } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import {
  addShoppingItem,
  deleteShoppingItem,
  toggleShoppingItem,
  updateShoppingItem,
  type ShoppingFormState,
} from "@/app/actions/shopping";
import { LIMITS } from "@/lib/constants";
import type { ShoppingListGroup } from "@/lib/shopping";
import { IngredientField } from "./IngredientField";
import { SubmitButton, SubmitRow } from "./PantryForms";
import { btn, input, label } from "./ui";

function Fields({ prefix, defaults }: { prefix: string; defaults?: { name: string; measure: string } }) {
  return (
    <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
      <div>
        <label htmlFor={`${prefix}-name`} className={label}>Ingredient</label>
        <IngredientField id={`${prefix}-name`} defaultValue={defaults?.name} />
      </div>
      <div>
        <label htmlFor={`${prefix}-measure`} className={label}>Amount</label>
        <input
          id={`${prefix}-measure`}
          name="measure"
          maxLength={LIMITS.shoppingMeasureLength}
          placeholder="e.g. 2 cloves"
          defaultValue={defaults?.measure ?? ""}
          className={input}
        />
      </div>
    </div>
  );
}

export function AddShoppingItemForm() {
  const [state, action] = useActionState<ShoppingFormState, FormData>(addShoppingItem, { n: 0 });
  return (
    <form action={action} className="space-y-3">
      {/* key resets the fields after each successful add */}
      <Fields key={state.n} prefix="shop-add" />
      <SubmitRow state={state}>
        <Plus className="h-4 w-4" aria-hidden /> Add to list
      </SubmitRow>
    </form>
  );
}

/** One shopping list row: tick box, name, amount, edit and delete. */
export function ShoppingItemRow({ item }: { item: ShoppingListGroup["items"][number] }) {
  const [editing, setEditing] = useState(false);
  // tick shows straight away, before the server answers
  const [checked, setChecked] = useOptimistic(item.checked);
  const [state, action] = useActionState<ShoppingFormState, FormData>(async (prev, fd) => {
    const res = await updateShoppingItem(prev, fd);
    if (res.ok) setEditing(false);
    return res;
  }, {});

  if (editing) {
    return (
      <form action={action} className="w-full space-y-3 rounded-xl bg-sand/60 p-3">
        <input type="hidden" name="id" value={item.id} />
        <Fields prefix={`shop-edit-${item.id}`} defaults={{ name: item.name, measure: item.measure }} />
        {state.error && <p className="text-sm font-semibold text-tomato">{state.error}</p>}
        <div className="flex gap-2">
          <SubmitButton>Save</SubmitButton>
          <button type="button" className={btn.ghost} onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={`Bought ${item.name}`}
        onClick={() => {
          const fd = new FormData();
          fd.set("id", String(item.id));
          fd.set("checked", checked ? "0" : "1");
          startTransition(async () => {
            setChecked(!checked);
            await toggleShoppingItem(fd);
          });
        }}
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
          checked ? "border-herb bg-herb text-white" : "border-brown/60 bg-card hover:bg-sand"
        }`}
      >
        {checked && <Check className="h-4 w-4" aria-hidden />}
      </button>
      <span className={`flex-1 font-bold ${checked ? "text-muted line-through" : "text-ink"}`}>{item.name}</span>
      <span className={`text-right text-sm text-muted ${checked ? "line-through" : ""}`}>{item.measure}</span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setEditing(true)} className={`${btn.ghost} px-2`} aria-label={`Edit ${item.name}`}>
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <form action={deleteShoppingItem}>
          <input type="hidden" name="id" value={item.id} />
          <SubmitButton className={`${btn.danger} px-2`}>
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className="sr-only">Remove {item.name}</span>
          </SubmitButton>
        </form>
      </div>
    </>
  );
}
