"use client";

import { useActionState, useState } from "react";
import type { CookState } from "@/app/actions/cooking";
import { btn } from "@/components/ui";

type Props = {
  action: (state: CookState, formData: FormData) => Promise<CookState>;
  deductions: { id: number; name: string; usedLabel: string }[];
};

export function MarkAsCooked({ action, deductions }: Props) {
  const [open, setOpen] = useState(false);
  const [state, submit, pending] = useActionState(action, {});

  return (
    <div className="mt-6">
      {state.message ? (
        <p role="status" className="text-sm font-bold text-herb">
          {state.message}
        </p>
      ) : (
        <>
          {state.error && (
            <p role="alert" className="mb-2 text-sm text-tomato">{state.error}</p>
          )}

          {!deductions.length ? (
            <p className="text-sm text-muted">No measured pantry ingredients to deduct.</p>
          ) : !open ? (
            <button type="button" className={btn.outline} onClick={() => setOpen(true)}>
              Mark as cooked
            </button>
          ) : (
            <form action={submit} className="rounded-2xl border border-line bg-card p-4">
              <p className="font-bold text-ink">Deduct these amounts from My Pantry?</p>
              <ul className="my-3 list-disc space-y-1 pl-5 text-sm text-muted">
                {deductions.map(({ id, name, usedLabel }) => (
                  <li key={id}>{name} · {usedLabel}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={btn.outline} disabled={pending}>
                  {pending ? "Updating pantry…" : "Confirm and update pantry"}
                </button>
                <button
                  type="button"
                  className={btn.ghost}
                  disabled={pending}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}