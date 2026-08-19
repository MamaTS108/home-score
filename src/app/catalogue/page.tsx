import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CatalogueWaitlistForm } from "@/components/renovate/CatalogueWaitlistForm";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function CataloguePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 pt-16 pb-20 text-center">
          <Badge tone="accent">Catalogue Teelte</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            🛒 Nous préparons une sélection de produits adaptés à vos projets.
          </h1>
          <p className="mt-3 text-muted-foreground">
            Nous recherchons actuellement les meilleurs fournisseurs pour les projets Teelte. En attendant, chaque
            projet que vous créez estime déjà votre budget matériaux à partir de prix indicatifs.
          </p>

          <Card className="mt-10 text-left">
            <CardContent>
              {user ? (
                <CatalogueWaitlistForm />
              ) : (
                <div className="text-center py-4">
                  <p className="font-medium mb-1">Connectez-vous pour être informé(e)</p>
                  <p className="text-sm text-muted-foreground mb-5">
                    Un compte est nécessaire pour choisir vos catégories et recevoir une notification.
                  </p>
                  <Link href="/login?next=/catalogue">
                    <Button>Se connecter</Button>
                  </Link>
                  <p className="text-sm text-muted-foreground mt-4">
                    Pas encore de compte ?{" "}
                    <Link href="/signup?next=/catalogue" className="text-accent font-medium">
                      Créer un compte
                    </Link>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-10">
            <Link href="/renovate">
              <Button variant="secondary">Démarrer ma rénovation</Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
