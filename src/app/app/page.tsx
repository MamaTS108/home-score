import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProjectRepository } from "@/lib/repositories/projectRepository";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const repo = new ProjectRepository(supabase);
  const projects = await repo.listProjects(user.id);

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Mes projets</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {projects.length} projet{projects.length > 1 ? "s" : ""}
            </p>
          </div>
          <Link href="/renovate">
            <Button>Nouveau projet</Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <p className="text-muted-foreground mb-4">Vous n&apos;avez pas encore de projet.</p>
              <Link href="/renovate">
                <Button>Démarrer ma rénovation</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <Link key={project.id} href={`/renovate/${project.id}`}>
                <Card className="overflow-hidden h-full hover:border-border-strong transition-colors">
                  <div className="relative aspect-[4/3]">
                    <Image src={project.originalImageUrl} alt={project.name} fill className="object-cover" unoptimized />
                    <Badge tone="default" className="absolute top-3 left-3 bg-surface/90">
                      {project.status}
                    </Badge>
                  </div>
                  <CardContent>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.budgetMax ? `${formatCurrency(project.budgetMax)} budget` : "Budget non défini"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Mis à jour le {new Date(project.updatedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
