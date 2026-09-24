import { SiteHeader } from "@/components/layout/SiteHeader";
import { Badge } from "@/components/ui/Badge";
import { EyewearTryOnPage } from "@/components/eyewear/EyewearTryOnPage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { EyewearRepository } from "@/lib/repositories/eyewearRepository";

// The catalogue changes whenever an optician adds/hides a product, so this
// page must never be statically prerendered/cached at build time.
export const dynamic = "force-dynamic";

export default async function EssayagePage() {
  const supabase = createSupabaseAdminClient();
  const repo = new EyewearRepository(supabase);
  const products = await repo.listActive();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-5xl px-6 pt-12 pb-20">
          <Badge tone="accent">Essayage virtuel</Badge>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Essayez des lunettes avec votre webcam</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Choisissez une monture ci-dessous, autorisez l&apos;accès à votre webcam, et visualisez le rendu en
            temps réel sur votre visage. Aucune image n&apos;est enregistrée ni envoyée à un serveur : tout se
            passe directement dans votre navigateur.
          </p>

          <div className="mt-8">
            <EyewearTryOnPage products={products} />
          </div>
        </section>
      </main>
    </>
  );
}