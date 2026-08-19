import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { CatalogueWaitlistForm } from "@/components/renovate/CatalogueWaitlistForm";

export default function CataloguePage() {
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
              <CatalogueWaitlistForm />
            </CardContent>
          </Card>

          <div className="mt-10">
            <Link href="/renovate">
              <Button>Démarrer ma rénovation</Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
