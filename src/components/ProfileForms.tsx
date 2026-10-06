"use client";

import { useActionState, useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  addAvoidedIngredient,
  changePassword,
  deleteAccount,
  updateAccount,
  updateDietary,
  type ProfileFormState,
} from "@/app/actions/profile";
import { DIETS, type DietId } from "@/lib/recipe-filters";
import { IngredientField } from "./IngredientField";
import { SubmitButton, SubmitRow } from "./PantryForms";
import { ToggleChip } from "./ToggleChip";
import { btn, input, label } from "./ui";

export function AccountForm({ name, email }: { name: string | null; email: string }) {
  const [state, action] = useActionState<ProfileFormState, FormData>(updateAccount, {});
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>Name</label>
          <input id="name" name="name" autoComplete="given-name" maxLength={60} defaultValue={name ?? ""} className={input} />
        </div>
        <div>
          <label htmlFor="email" className={label}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required defaultValue={email} className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="account-password" className={label}>
          Current password <span className="font-semibold text-muted">(only needed to change your email)</span>
        </label>
        <input id="account-password" name="password" type="password" autoComplete="current-password" className={input} />
      </div>
      <SubmitRow state={state}>Save details</SubmitRow>
    </form>
  );
}

export function DietaryForm({ diets, assumeBasics }: { diets: DietId[]; assumeBasics: boolean }) {
  const [state, action] = useActionState<ProfileFormState, FormData>(updateDietary, {});
  return (
    <form action={action} className="space-y-4">
      <fieldset>
        <legend className={label}>Diet</legend>
        <div className="flex flex-wrap gap-1.5">
          {DIETS.map((d) => (
            <ToggleChip key={d.id} type="checkbox" name="diet" value={d.id} checked={diets.includes(d.id)}>
              {d.label}
            </ToggleChip>
          ))}
        </div>
      </fieldset>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="basics" value="1" defaultChecked={assumeBasics} className="mt-0.5 h-4 w-4 accent-brown" />
        <span>
          <span className="font-bold text-brown-dark">I usually have the basics</span>
          <span className="block text-muted">Salt, pepper, oil and water won&apos;t count as missing ingredients</span>
        </span>
      </label>
      <SubmitRow state={state}>Save preferences</SubmitRow>
    </form>
  );
}

export function AddAvoidedIngredientForm() {
  const [state, action] = useActionState<ProfileFormState, FormData>(addAvoidedIngredient, { n: 0 });
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="avoid-name" className={label}>Add an ingredient to avoid</label>
        {/* key resets the field after each successful add */}
        <IngredientField key={state.n} id="avoid-name" />
      </div>
      <SubmitRow state={state}>
        <Plus className="h-4 w-4" aria-hidden /> Avoid
      </SubmitRow>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState<ProfileFormState, FormData>(changePassword, {});
  return (
    <form action={action} className="space-y-3">
      <div>
        <label htmlFor="current-password" className={label}>Current password</label>
        <input id="current-password" name="password" type="password" autoComplete="current-password" required className={input} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="new-password" className={label}>New password</label>
          <input id="new-password" name="newPassword" type="password" autoComplete="new-password" required minLength={8} className={input} />
        </div>
        <div>
          <label htmlFor="confirm-password" className={label}>Confirm new password</label>
          <input id="confirm-password" name="confirm" type="password" autoComplete="new-password" required minLength={8} className={input} />
        </div>
      </div>
      <SubmitRow state={state}>Change password</SubmitRow>
    </form>
  );
}

/** "Delete account" button that asks for the password in a pop-up before deleting. */
export function DeleteAccountButton() {
  const [state, action] = useActionState<ProfileFormState, FormData>(deleteAccount, {});
  const dialogRef = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()} className={btn.danger}>
        <Trash2 className="h-4 w-4" aria-hidden /> Delete account
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="delete-title"
        className="m-auto w-[min(28rem,calc(100%-2rem))] rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-lg backdrop:bg-black/40"
      >
        <form action={action} className="space-y-3">
          <h2 id="delete-title" className="font-sans text-lg font-extrabold text-ink">Delete your account?</h2>
          <p className="text-sm text-muted">Your pantry and saved preferences will be removed. This can&apos;t be undone.</p>
          <div>
            <label htmlFor="delete-password" className={label}>Enter your password to confirm</label>
            <input id="delete-password" name="password" type="password" autoComplete="current-password" required className={input} />
          </div>
          {state.error && <p role="alert" className="text-sm font-semibold text-tomato">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => dialogRef.current?.close()} className={btn.ghost}>Cancel</button>
            <SubmitButton className={btn.danger}>
              <Trash2 className="h-4 w-4" aria-hidden /> Delete my account
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}
