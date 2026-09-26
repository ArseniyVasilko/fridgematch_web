import { Lock } from "lucide-react";
import { FridgeIllustration } from "./illustrations";

export function AuthShell({
  title,
  intro,
  returning,
  children,
}: {
  title: string;
  intro: string;
  returning: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 py-8 md:grid-cols-2 md:py-12">
      <div className="rounded-3xl border border-line bg-card p-6 shadow-[var(--shadow-card)] sm:p-8">
        {returning && (
          <p className="mb-4 flex items-start gap-2 rounded-xl bg-sand px-3 py-2 text-sm font-semibold text-brown-dark">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Log in or sign up to continue. We&apos;ll take you back to where you were.
          </p>
        )}
        <h1 className="text-4xl">{title}</h1>
        <p className="mb-6 mt-1 text-muted">{intro}</p>
        {children}
      </div>
      <div className="hidden justify-center md:flex">
        <FridgeIllustration className="h-80" />
      </div>
    </div>
  );
}
