import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ADMIN_EMAIL } from "@/lib/email/resend";

const CATEGORY_LABELS: Record<string, string> = {
  sol: "Sol",
  peinture: "Peinture",
  eclairage: "Éclairage",
  mobilier: "Mobilier",
  cuisine: "Cuisine",
  salle_de_bain: "Salle de bain",
  isolation: "Isolation",
  fenetres: "Fenêtres",
  chauffage: "Chauffage",
  decoration: "Décoration",
};

interface ProductInterestRow {
  id: string;
  categories: string[];
  created_at: string;
  project_id: string | null;
}

interface ArtisanInterestRow {
  id: string;
  work_type: string | null;
  location: string | null;
  budget: number | null;
  created_at: string;
}

export default async function AdminDemandesPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Simple MVP protection — no role system yet, just gate by the admin
  // email configured for notifications. Good enough while it's just you;
  // revisit with a real roles table before adding more admins.
  if (!user || !ADMIN_EMAIL || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    redirect("/");
  }

  const admin = createSupabaseAdminClient();

  const { data: productRows } = await admin
    .from("product_interest")
    .select("id, categories, created_at, project_id")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: artisanRows } = await admin
    .from("artisan_interest")
    .select("id, work_type, location, budget, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const products = (productRows ?? []) as ProductInterestRow[];
  const artisans = (artisanRows ?? []) as ArtisanInterestRow[];

  const categoryCounts = new Map<string, number>();
  for (const row of products) {
    for (const category of row.categories ?? []) {
      categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    }
  }
  const sortedCategories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Demandes (reporting)</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Vue agrégée des inscriptions aux listes d&apos;attente produits et artisans.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-3xl font-semibold text-accent">{products.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Demandes produits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-3xl font-semibold text-accent">{artisans.length}</p>
              <p className="text-sm text-muted-foreground mt-1">Demandes artisan</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Catégories les plus demandées</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {sortedCategories.length === 0 && (
              <p className="text-sm text-muted-foreground">Aucune demande pour l&apos;instant.</p>
            )}
            {sortedCategories.map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span>{CATEGORY_LABELS[category] ?? category}</span>
                <Badge tone="accent">{count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Dernières demandes produits</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {products.slice(0, 20).map((row) => (
              <div key={row.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                <span className="text-muted-foreground">
                  {(row.categories ?? []).map((c) => CATEGORY_LABELS[c] ?? c).join(", ")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
            {products.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Dernières demandes artisan</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {artisans.slice(0, 20).map((row) => (
              <div key={row.id} className="flex items-center justify-between text-sm border-b border-border pb-2 last:border-0">
                <span className="text-muted-foreground">
                  {row.work_type ?? "Travaux non précisés"}
                  {row.location ? ` — ${row.location}` : ""}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(row.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
            {artisans.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande.</p>}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
