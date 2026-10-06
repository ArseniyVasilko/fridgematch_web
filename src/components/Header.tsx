import Link from "next/link";
import { BookOpen, CircleHelp, LogOut, Refrigerator, UserRound } from "lucide-react";
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
      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-brown-dark hover:bg-sand"
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
  <header className="relative z-50 border-b border-line/70 bg-cream/95 backdrop-blur supports-[backdrop-filter]:bg-cream/80">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded-lg focus:bg-card focus:px-3 focus:py-2">
        Skip to content
      </a>
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-6">
        <Logo />

      <nav
        aria-label="Main"
        className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex">          
        <IconLink href="/recipes" label="Recipes">
            <BookOpen className="h-5 w-5" aria-hidden />
          </IconLink>
          <IconLink href="/pantry" label="My Pantry">
            <Refrigerator className="h-5 w-5" aria-hidden />
          </IconLink>
          <IconLink href="/about" label="Help">
            <CircleHelp className="h-5 w-5" aria-hidden />
          </IconLink>
        </nav>
        <div className="ml-auto hidden items-center md:flex">
          {user ? (
            <div className="flex items-center gap-1 border-l border-line pl-2">
              <span
                className="flex items-center gap-2 px-1 text-xs font-bold text-brown-dark"
                title={user.email ?? ""}
              >
                <UserRound className="h-5 w-5" aria-hidden />
                <span className="max-w-24 truncate">{displayName}</span>
              </span>

              <form action={logoutAction}>
                <button className={`${btn.ghost} text-xs`} aria-label="Log out">
                  <LogOut className="h-4 w-4" aria-hidden />
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className={`${btn.primary} py-2 text-sm`}>
              <UserRound className="h-4 w-4" aria-hidden />
              Log in
            </Link>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1 md:hidden">
          <MobileMenu links={NAV}>
            {user ? (
              <form action={logoutAction} className="flex items-center justify-between px-3">
                <span className="text-sm font-semibold text-muted">Signed in as {displayName}</span>
                <button className={btn.outline}>Log out</button>
              </form>
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
