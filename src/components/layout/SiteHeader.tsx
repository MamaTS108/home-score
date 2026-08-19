import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/auth/SignOutButton";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-6 w-6 rounded-md bg-accent" aria-hidden />
          <span className="font-semibold tracking-tight">HOME SCORE</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/renovate" className="hover:text-foreground transition-colors">
            Nouveau projet
          </Link>
          <Link href="/app" className="hover:text-foreground transition-colors">
            Mes projets
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground hidden sm:inline">
                Se connecter
              </Link>
              <Link href="/renovate">
                <Button size="sm">Démarrer ma rénovation</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
