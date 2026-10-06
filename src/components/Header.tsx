import Link from "next/link";
import { BookOpen, CircleHelp, LogOut, Refrigerator, Search, UserRound } from "lucide-react";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions/auth";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { btn } from "./ui";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/recipes", label: "Recipes" },
  { href: "/pantry", label: "My Pantry" },
  { href: "/about", label: "About / Help" },
];

function IconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex min-w-16 flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-bold text-brown-dark hover:bg-sand"
    >
      {children}
      {label}
    </Link>
  );
}

export async function Header() {
  const session = await auth();
  const user = session?.user;
  const displayName = user?.name || user?.email?.split("@")[0];

  return (
    <header className="relative border-b border-line/70 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/80">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-6">
        <Logo />

        <form action="/recipes" role="search" className="hidden flex-1 md:block">
          <label className="relative block">
            <span className="sr-only">Search recipes</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              name="q"
              type="search"
              placeholder="Search recipes, ingredients, or dishes…"
              className="w-full rounded-xl border border-line bg-sand/60 py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-muted/80 focus:border-brown focus:bg-card focus:outline-none focus:ring-2 focus:ring-brown/30"
            />
          </label>
        </form>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <IconLink href="/recipes" label="Recipes">
            <BookOpen className="h-5 w-5" aria-hidden />
          </IconLink>
          <IconLink href="/pantry" label="My Pantry">
            <Refrigerator className="h-5 w-5" aria-hidden />
          </IconLink>
          <IconLink href="/about" label="Help">
            <CircleHelp className="h-5 w-5" aria-hidden />
          </IconLink>
          {user ? (
            <div className="ml-1 flex items-center gap-1 border-l border-line pl-2">
              <Link
                href="/profile"
                className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 text-xs font-bold text-brown-dark hover:bg-sand"
                title={`My profile (${user.email ?? ""})`}
              >
                <UserRound className="h-5 w-5" aria-hidden />
                <span className="max-w-24 truncate">{displayName}</span>
              </Link>
              <form action={logoutAction}>
                <button className={`${btn.ghost} text-xs`} aria-label="Log out">
                  <LogOut className="h-4 w-4" aria-hidden /> Log out
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className={`${btn.primary} ml-2 py-2 text-sm`}>
              <UserRound className="h-4 w-4" aria-hidden /> Log in
            </Link>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-1 md:hidden">
          <Link href="/recipes#search" className="rounded-xl p-2 text-brown-dark hover:bg-sand" aria-label="Search recipes">
            <Search className="h-6 w-6" aria-hidden />
          </Link>
          <MobileMenu links={NAV}>
            {user ? (
              <>
                <Link href="/profile" className="block rounded-xl px-3 py-3 text-lg font-bold text-brown-dark hover:bg-sand">
                  My Profile
                </Link>
                <form action={logoutAction} className="flex items-center justify-between px-3">
                  <span className="text-sm font-semibold text-muted">Signed in as {displayName}</span>
                  <button className={btn.outline}>Log out</button>
                </form>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" className={btn.primary}>Log in</Link>
                <Link href="/register" className={btn.outline}>Sign up</Link>
              </div>
            )}
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
