import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { EyewearDashboard } from "@/components/eyewear/EyewearDashboard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EyewearRepository } from "@/lib/repositories/eyewearRepository";

export default async function OpticianPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/opticien");
  }

  const repo = new EyewearRepository(supabase);
  const products = await repo.listByOptician(user.id);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl w-full px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Espace opticien</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Ajoutez vos montures pour que vos clients puissent les essayer virtuellement sur le site.
          </p>
        </div>

        <EyewearDashboard initialProducts={products} />
      </main>
    </>
  );
}
