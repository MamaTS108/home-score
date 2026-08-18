import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { CreateProjectFlow } from "@/components/renovate/CreateProjectFlow";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function RenovatePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/renovate");
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-12">
        <div className="max-w-xl mx-auto mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Créer mon projet de rénovation</h1>
          <p className="text-muted-foreground mt-2">
            Une photo, une description, et HOME SCORE s&apos;occupe du reste.
          </p>
        </div>
        <CreateProjectFlow />
      </main>
    </>
  );
}
