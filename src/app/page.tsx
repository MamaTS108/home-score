import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ValueChain } from "@/components/landing/ValueChain";
import { PhoneCaptureAnimation } from "@/components/landing/PhoneCaptureAnimation";

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Badge tone="accent">Imaginez-le. Planifiez-le. Budgétez-le.</Badge>
            <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1]">
              Rénovez votre logement avec l&apos;IA.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-md">
              Prenez une photo. Décrivez votre projet. Obtenez le design, les matériaux et le budget estimé.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link href="/renovate">
                <Button size="lg">Démarrer ma rénovation</Button>
              </Link>
              <span className="text-sm text-muted-foreground">Gratuit pour votre premier projet</span>
            </div>
          </div>

          <div>
            <PhoneCaptureAnimation />
            <p className="text-center text-xs text-muted-foreground mt-4 max-w-xs mx-auto">
              Photo → analyse → visualisation IA → budget, en quelques secondes.
            </p>
          </div>
        </section>

        {/* Value chain */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Comment ça marche
          </h2>
          <ValueChain />
        </section>

        {/* Worked example */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent>
                <h3 className="font-semibold mb-3">Travaux</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Préparation des murs</li>
                  <li>Peinture</li>
                  <li>Remplacement du sol</li>
                  <li>Installation de rangements</li>
                  <li>Pose des plinthes</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <h3 className="font-semibold mb-3">Matériaux / produits</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Peinture murale</li>
                  <li>Sous-couche</li>
                  <li>Parquet</li>
                  <li>Plinthes</li>
                  <li>Meubles de rangement</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Estimation basée sur des prix indicatifs. Toutes les quantités et prix sont des estimations à vérifier
            avant achat ou travaux.
          </p>
        </section>

        {/* Positioning */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <Card className="bg-accent text-accent-foreground border-none">
            <CardContent className="py-10 px-8 md:px-12">
              <p className="text-sm uppercase tracking-wide opacity-70 mb-3">Positionnement</p>
              <p className="text-2xl md:text-3xl font-medium leading-snug max-w-2xl">
                &laquo;&nbsp;Je voudrais refaire mon appartement&nbsp;&raquo; devient &laquo;&nbsp;Voici à quoi il
                pourrait ressembler, ce qu&apos;il faut acheter, et combien cela pourrait coûter.&nbsp;&raquo;
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>HOME SCORE, AI Renovation Planner</span>
          <span>Estimations indicatives, non contractuelles. Ne remplace pas un devis professionnel.</span>
        </div>
      </footer>
    </>
  );
}
