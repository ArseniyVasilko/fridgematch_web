import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
  <footer className="mt-16 border-t border-line bg-sand/50">
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted md:flex-row md:items-center md:justify-between">
    <div className="scale-75 origin-left">
      <Logo tagline={false} />
    </div>

      <div className="text-xs md:text-right">
        <p>© 2026 FridgeMatch</p>
        <p>
          Data from{" "}
          <a
            href="https://www.themealdb.com"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-brown-dark"
          >
            TheMealDB
          </a>
          {" "}· Aalto University
        </p>
      </div>
    </div>
  </footer>
  );
}
