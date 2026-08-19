import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { Button } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Lets the login link bring people back to wherever they were, after
  // signing in — set by proxy.ts on every request.
  const headerList = await headers();
  const currentPath = headerList.get("x-pathname") ?? "/";
  const loginHref = `/login?next=${encodeURIComponent(currentPath)}`;

  return (
    <header className="sticky top-0 z-40">
      {/* Top bar: logo, search, account, cart */}
      <div className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-20 flex items-center gap-6">
          <Link href="/" className="flex items-center shrink-0">
            <Image src="/images/logo-teelte.png" alt="Teelte" width={130} height={36} className="h-9 w-auto" unoptimized />
          </Link>

          {/* Search bar — visual for now, will search the marketplace catalog once it exists */}
          <div className="hidden md:flex flex-1 max-w-xl">
            <div className="flex w-full h-11 rounded-full border border-border-strong bg-surface overflow-hidden">
              <input
                type="search"
                placeholder="Rechercher un produit..."
                disabled
                className="flex-1 px-4 text-sm bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 px-5 bg-accent text-accent-foreground text-sm font-medium disabled:opacity-90 disabled:cursor-not-allowed"
                title="Bientôt disponible"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Rechercher
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
                <SignOutButton />
              </>
            ) : (
              <>
                <Link href={loginHref} className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">
                  Se connecter
                </Link>
                <Link href="/renovate">
                  <Button size="sm">Démarrer ma rénovation</Button>
                </Link>
              </>
            )}
            <button
              type="button"
              disabled
              title="Panier — bientôt disponible"
              className="relative h-9 w-9 flex items-center justify-center rounded-full text-muted-foreground disabled:cursor-not-allowed"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="9" cy="20" r="1.5" fill="currentColor" />
                <circle cx="17" cy="20" r="1.5" fill="currentColor" />
                <path
                  d="M2 3h2l2.6 12.6a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-accent-foreground text-[10px] leading-4 text-center font-medium">
                0
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary nav bar */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="mx-auto max-w-6xl px-6 h-11 flex items-center gap-6 text-sm font-medium overflow-x-auto">
          <Link href="/renovate" className="whitespace-nowrap hover:opacity-80 transition-opacity">
            Nouveau projet
          </Link>
          <Link href="/app" className="whitespace-nowrap hover:opacity-80 transition-opacity">
            Mes projets
          </Link>
          <Link href="/catalogue" className="whitespace-nowrap hover:opacity-80 transition-opacity">
            Catalogue produits
          </Link>
        </div>
      </div>
    </header>
  );
}
