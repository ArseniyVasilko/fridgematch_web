"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import type { AuthFormState } from "@/app/actions/auth";
import { btn, input, label } from "./ui";

type Action = (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button className={`${btn.primary} w-full py-3`} disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function AuthForm({ mode, action, callbackUrl }: { mode: "login" | "register"; action: Action; callbackUrl: string }) {
  const [state, formAction] = useActionState(action, {});
  const isRegister = mode === "register";
  const other = isRegister ? "/login" : "/register";
  const otherHref = callbackUrl !== "/" ? `${other}?callbackUrl=${encodeURIComponent(callbackUrl)}` : other;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      {state.error && (
        <p role="alert" className="rounded-xl bg-tomato-soft px-3 py-2 text-sm font-semibold text-tomato">
          {state.error}
        </p>
      )}
      {isRegister && (
        <div>
          <label htmlFor="name" className={label}>
            Name <span className="font-semibold text-muted">(optional)</span>
          </label>
          <input id="name" name="name" autoComplete="given-name" defaultValue={state.name} className={input} />
        </div>
      )}
      <div>
        <label htmlFor="email" className={label}>Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          aria-invalid={!!state.fieldErrors?.email}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
          className={input}
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-sm font-semibold text-tomato">{state.fieldErrors.email}</p>
        )}
      </div>
      <div>
        <label htmlFor="password" className={label}>Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
          minLength={isRegister ? 8 : undefined}
          aria-invalid={!!state.fieldErrors?.password}
          aria-describedby={isRegister ? "password-hint" : undefined}
          className={input}
        />
        {isRegister && (
          <p id="password-hint" className={`mt-1 text-sm ${state.fieldErrors?.password ? "font-semibold text-tomato" : "text-muted"}`}>
            {state.fieldErrors?.password ?? "At least 8 characters."}
          </p>
        )}
      </div>
      <Submit>{isRegister ? "Create account" : "Log in"}</Submit>
      <p className="text-center text-sm text-muted">
        {isRegister ? "Already have an account?" : "New to FridgeMatch?"}{" "}
        <Link href={otherHref} className="font-bold text-brown-dark underline">
          {isRegister ? "Log in" : "Create a free account"}
        </Link>
      </p>
    </form>
  );
}
