import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProjectNav } from "@/components/renovate/ProjectNav";
import { DesignViewer } from "@/components/renovate/DesignViewer";
import { Card, CardContent } from "@/components/ui/Card";
import { getProjectDetail } from "@/lib/data/getProjectDetail";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPremiumStatus } from "@/lib/stripe/isUserPremium";

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  const { project, designs } = detail;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const premium = await getPremiumStatus(supabase, user?.id ?? null);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        </div>
        <ProjectNav projectId={id} />

        {designs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16 text-muted-foreground">
              Aucune visualisation générée pour l&apos;instant.
            </CardContent>
          </Card>
        ) : (
          <DesignViewer
            projectId={id}
            originalImageUrl={project.originalImageUrl}
            designs={designs}
            premiumUnlocked={project.premiumUnlocked}
            isPremium={premium.isPremium && !premium.quotaExceeded}
          />
        )}
      </main>
    </>
  );
}
