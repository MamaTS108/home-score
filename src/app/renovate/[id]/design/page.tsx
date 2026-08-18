import { notFound } from "next/navigation";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProjectNav } from "@/components/renovate/ProjectNav";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RegenerateDesignButton } from "@/components/renovate/RegenerateDesignButton";
import { getProjectDetail } from "@/lib/data/getProjectDetail";

export default async function DesignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  const { project, designs } = detail;
  const latest = designs[designs.length - 1];

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        </div>
        <ProjectNav projectId={id} />

        {!latest ? (
          <Card>
            <CardContent className="text-center py-16 text-muted-foreground">
              Aucune visualisation générée pour l&apos;instant.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <Image src={project.originalImageUrl} alt="Avant" fill className="object-cover" unoptimized />
                </div>
                <CardContent className="py-3">
                  <Badge tone="muted">Avant</Badge>
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <div className="relative aspect-[4/3]">
                  <Image src={latest.imageUrl} alt="Après" fill className="object-cover" unoptimized />
                </div>
                <CardContent className="py-3">
                  <Badge tone="accent">Après — Visualisation IA</Badge>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p className="font-medium text-foreground">{latest.disclaimer}</p>
                <p>Ce n&apos;est pas un plan architectural. Le résultat final peut différer de la réalisation.</p>
              </CardContent>
            </Card>

            <div>
              <RegenerateDesignButton projectId={id} />
              <p className="text-xs text-muted-foreground mt-2">
                Un détail vous semble incorrect (porte masquée, élément déplacé...) ? Régénérez — chaque
                génération IA peut légèrement varier.
              </p>
            </div>

            {designs.length > 1 && (
              <Card>
                <CardContent>
                  <h3 className="font-semibold text-sm mb-3">Historique des versions</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {designs.map((d) => (
                      <div key={d.id} className="relative aspect-square rounded-[var(--radius-button)] overflow-hidden border border-border">
                        <Image src={d.imageUrl} alt={`Version ${d.version}`} fill className="object-cover" unoptimized />
                        <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white rounded px-1.5 py-0.5">
                          v{d.version}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </>
  );
}
