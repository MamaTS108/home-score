import { SiteHeader } from "@/components/layout/SiteHeader";
import { CreateProjectFlow } from "@/components/renovate/CreateProjectFlow";

export default function RenovatePage() {
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
