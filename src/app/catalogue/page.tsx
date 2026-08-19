import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MOCK_CATALOG } from "@/lib/products/catalog";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  "peinture murale": "Peinture",
  "sous-couche": "Sous-couche",
  "préparation des murs": "Préparation des murs",
  sol: "Sol",
  plinthes: "Plinthes",
  rangement: "Rangement",
  cuisine: "Cuisine",
  "salle de bain": "Salle de bain",
  éclairage: "Éclairage",
  accessoires: "Accessoires",
  décoration: "Décoration",
  isolation: "Isolation",
  fenêtres: "Fenêtres",
  chauffage: "Chauffage",
  ventilation: "Ventilation",
  "énergie solaire": "Énergie solaire",
};

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const categories = Array.from(new Set(MOCK_CATALOG.map((p) => p.category))).sort();
  const products = category ? MOCK_CATALOG.filter((p) => p.category === category) : MOCK_CATALOG;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 pt-12 pb-8">
          <Badge tone="accent">Catalogue Teelte</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Produits et fournitures pour vos travaux</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Ce catalogue indicatif est la base utilisée par l&apos;IA pour estimer le budget de vos projets de
            rénovation. Les prix affichés ne proviennent pas de Leroy Merlin ni d&apos;un autre revendeur — ce sont
            des estimations à vérifier avant achat.
          </p>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-6">
          <div className="flex flex-wrap gap-2">
            <Link href="/catalogue">
              <Badge tone={!category ? "accent" : "default"} className="cursor-pointer px-3 py-1.5">
                Toutes les catégories
              </Badge>
            </Link>
            {categories.map((c) => (
              <Link key={c} href={`/catalogue?category=${encodeURIComponent(c)}`}>
                <Badge tone={category === c ? "accent" : "default"} className="cursor-pointer px-3 py-1.5">
                  {CATEGORY_LABELS[c] ?? c}
                </Badge>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((product) => (
              <Card key={product.id} className="overflow-hidden flex flex-col">
                <div className="aspect-square bg-accent-soft flex items-center justify-center">
                  <CategoryGlyph category={product.category} />
                </div>
                <CardContent className="flex-1 flex flex-col">
                  <Badge tone="muted" className="self-start mb-2">
                    {CATEGORY_LABELS[product.category] ?? product.category}
                  </Badge>
                  <p className="font-medium text-sm flex-1">{product.name}</p>
                  <div className="flex items-baseline justify-between mt-3">
                    <span className="text-lg font-semibold text-accent">
                      {formatCurrency(product.estimatedUnitPrice)}
                    </span>
                    <span className="text-xs text-muted-foreground">/ {product.unit}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {products.length === 0 && (
            <p className="text-center text-muted-foreground py-16">Aucun produit dans cette catégorie.</p>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-20">
          <Card className="bg-secondary text-secondary-foreground border-none">
            <CardContent className="py-8 px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-lg">Prêt à rénover ?</p>
                <p className="text-sm opacity-90 mt-1">
                  Créez un projet et laissez l&apos;IA choisir les bons produits de ce catalogue pour votre budget.
                </p>
              </div>
              <Link
                href="/renovate"
                className="shrink-0 inline-flex h-10 px-5 items-center rounded-[var(--radius-button)] bg-accent text-accent-foreground text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                Démarrer ma rénovation
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}

/** Simple category glyph — no stock photos, just a clean geometric mark per category. */
function CategoryGlyph({ category }: { category: string }) {
  const letter = (CATEGORY_LABELS[category] ?? category).charAt(0).toUpperCase();
  return (
    <span className="text-4xl font-semibold text-accent/40" aria-hidden>
      {letter}
    </span>
  );
}
