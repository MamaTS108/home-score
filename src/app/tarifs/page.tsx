import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function TarifsPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 pt-16 pb-10 text-center">
          <Badge tone="accent">Tarifs</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Des tarifs simples, sans surprise</h1>
          <p className="mt-3 text-muted-foreground">
            Commencez gratuitement. Payez seulement si vous voulez explorer plus de propositions.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-20 grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="py-8 flex flex-col h-full">
              <p className="font-semibold text-lg mb-1">Gratuit</p>
              <p className="text-3xl font-semibold mb-4">0 €</p>
              <ul className="text-sm text-muted-foreground space-y-2 mb-8 flex-1">
                <li>✓ Projets illimités</li>
                <li>✓ Analyse IA de la pièce</li>
                <li>✓ Plan de travaux détaillé</li>
                <li>✓ Estimation budget (matériaux + main-d&apos;œuvre)</li>
                <li>✓ 2 visualisations IA gratuites par projet</li>
              </ul>
              <Link href="/renovate">
                <Button variant="secondary" className="w-full">
                  Commencer gratuitement
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-accent">
            <CardContent className="py-8 flex flex-col h-full">
              <p className="font-semibold text-lg mb-1">Débloquer un projet</p>
              <p className="text-3xl font-semibold mb-1">4,99 €</p>
              <p className="text-xs text-muted-foreground mb-4">Paiement unique, par projet</p>
              <ul className="text-sm text-muted-foreground space-y-2 mb-8 flex-1">
                <li>✓ Tout ce qui est dans Gratuit</li>
                <li>✓ Jusqu&apos;à 30 générations sur ce projet précis</li>
                <li>✓ Idéal si vous n&apos;avez qu&apos;une seule pièce à rénover</li>
              </ul>
              <Link href="/renovate">
                <Button className="w-full">Commencer un projet</Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-8 flex flex-col h-full">
              <p className="font-semibold text-lg mb-1">Premium</p>
              <p className="text-3xl font-semibold mb-1">9,99 €</p>
              <p className="text-xs text-muted-foreground mb-4">Par mois, résiliable à tout moment</p>
              <ul className="text-sm text-muted-foreground space-y-2 mb-8 flex-1">
                <li>✓ Tout ce qui est dans Gratuit</li>
                <li>✓ Jusqu&apos;à 1000 générations IA par mois, sur tous vos projets</li>
                <li>✓ Idéal pour plusieurs pièces ou une rénovation complète</li>
              </ul>
              <Link href="/renovate">
                <Button variant="secondary" className="w-full">
                  Commencer un projet
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-20">
          <h2 className="text-lg font-semibold mb-4 text-center">Questions fréquentes</h2>
          <div className="space-y-4">
            <div>
              <p className="font-medium text-sm">Puis-je annuler mon abonnement Premium à tout moment ?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Oui, sans engagement. Gérez ou annulez votre abonnement à tout moment depuis votre{" "}
                <Link href="/compte" className="text-accent font-medium">
                  page compte
                </Link>
                .
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">Quelle est la différence entre débloquer un projet et Premium ?</p>
              <p className="text-sm text-muted-foreground mt-1">
                « Débloquer un projet » est un paiement unique valable uniquement sur le projet concerné. Premium est
                un abonnement mensuel qui débloque tous vos projets, présents et futurs.
              </p>
            </div>
            <div>
              <p className="font-medium text-sm">Les estimations de budget sont-elles fiables ?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Elles sont indicatives, basées sur des prix moyens du marché, à vérifier avant tout achat ou
                engagement de travaux. Ce ne sont pas des devis professionnels.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
