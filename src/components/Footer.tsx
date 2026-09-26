import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-sand/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm text-muted md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="max-w-xs">Cook with what you already have and waste less food.</p>
        </div>
        <nav aria-label="Footer" className="flex gap-8 font-semibold">
          <ul className="space-y-1.5">
            <li><Link className="hover:text-brown-dark hover:underline" href="/recipes">Recipes</Link></li>
            <li><Link className="hover:text-brown-dark hover:underline" href="/pantry">My Pantry</Link></li>
          </ul>
          <ul className="space-y-1.5">
            <li><Link className="hover:text-brown-dark hover:underline" href="/about">About / Help</Link></li>
          </ul>
        </nav>
        <p className="max-w-xs text-xs">
          Recipe data and photos from{" "}
          <a className="underline hover:text-brown-dark" href="https://www.themealdb.com" target="_blank" rel="noreferrer">
            TheMealDB
          </a>
          . A CS-E4400 Design of WWW Services project, Aalto University.
        </p>
      </div>
    </footer>
  );
}
