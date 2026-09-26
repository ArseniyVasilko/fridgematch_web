import Link from "next/link";
import { BowlArt } from "@/components/illustrations";
import { btn } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <BowlArt className="w-32" />
      <h1 className="mt-4 text-4xl">Nothing in this bowl</h1>
      <p className="mt-2 text-muted">We couldn&apos;t find that page or recipe.</p>
      <Link href="/" className={`${btn.primary} mt-6`}>Back to home</Link>
    </div>
  );
}
