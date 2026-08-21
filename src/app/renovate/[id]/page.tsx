import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProjectNav } from "@/components/renovate/ProjectNav";
import { ProductInterestCTA } from "@/components/renovate/ProductInterestCTA";
import { ArtisanInterestCTA } from "@/components/renovate/ArtisanInterestCTA";
import { DeleteProjectButton } from "@/components/renovate/DeleteProjectButton";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getProjectDetail } from "@/lib/data/getProjectDetail";
import { difficultyLabel, formatCurrency, roomTypeLabel, styleLabel } from "@/lib/utils";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  const { project, analysis, plan, designs, productBudget, laborEstimate } = detail;
  const latestDesign = designs[designs.length - 1];
  const totalEstimate =
    productBudget && laborEstimate !== null ? productBudget.estimatedProductsTotal + laborEstimate : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10">
        <ProjectHeader name={project.name} status={project.status} roomType={project.roomType} style={project.style} />
        <ProjectNav projectId={id} />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* ✨ Votre nouvelle pièce — Avant / Après */}
            <Card className="overflow-hidden">
              <CardHeader>
                <h2 className="font-semibold">✨ Votre nouvelle pièce</h2>
              </CardHeader>
              {latestDesign ? (
                <div className="grid grid-cols-2">
                  <div className="relative aspect-video">
                    <Image src={project.originalImageUrl} alt="Avant" fill className="object-cover" unoptimized />
                    <Badge tone="muted" className="absolute top-2 left-2 bg-surface/90">
                      Avant
                    </Badge>
                  </div>
                  <div className="relative aspect-video">
                    <Image src={latestDesign.imageUrl} alt="Après" fill className="object-cover" unoptimized />
                    <Badge tone="accent" className="absolute top-2 left-2">
                      Après : IA
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="relative aspect-video">
                  <Image src={project.originalImageUrl} alt={project.name} fill className="object-cover" unoptimized />
                </div>
              )}
              <CardContent>
                <p className="text-sm text-muted-foreground">{project.description}</p>
                {latestDesign && (
                  <Link href={`/renovate/${id}/design`} className="text-xs text-accent font-medium mt-2 inline-block">
                    Voir en grand →
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* 🔨 Travaux recommandés */}
            {plan && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold">🔨 Travaux recommandés</h2>
                  <p className="text-xs text-muted-foreground mt-1">{plan.summary}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plan.tasks.map((task, index) => (
                    <div key={task.id} className="flex gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                      <span className="font-mono text-xs text-muted-foreground pt-0.5">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{task.name}</p>
                          <Badge tone={task.requiresProfessional ? "danger" : "accent"}>
                            {difficultyLabel(task.difficulty)}
                          </Badge>
                          {task.diyPossible && <Badge tone="muted">DIY possible</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        {task.quantityEstimated && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Quantité estimée : ~{task.quantityEstimated} {task.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-2">
                    Certains travaux peuvent nécessiter un professionnel qualifié.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* 💰 Budget estimatif */}
            {productBudget && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold">💰 Budget estimatif</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimation indicative, à vérifier avant achat ou travaux, pas un devis professionnel.
                  </p>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <BudgetRow label="Matériaux" value={formatCurrency(productBudget.estimatedProductsTotal)} />
                  {laborEstimate !== null && (
                    <BudgetRow label="Main-d'œuvre (estimation très indicative)" value={formatCurrency(laborEstimate)} />
                  )}
                  {totalEstimate !== null && (
                    <BudgetRow label="Total estimé" value={formatCurrency(totalEstimate)} strong />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Two V1 demand-capture CTAs — no fake marketplace, just waitlists */}
            <div className="space-y-6">
              <ProductInterestCTA projectId={id} />
              <ArtisanInterestCTA projectId={id} />
            </div>

            {analysis && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold">Analyse de la pièce</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Estimations basées sur la photo, jamais des mesures exactes.
                  </p>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                  <AnalysisRow label="Type de pièce" value={roomTypeLabel(analysis.roomType)} />
                  <AnalysisRow
                    label="Surface estimée"
                    value={analysis.estimatedAreaM2 ? `~${analysis.estimatedAreaM2} m²` : "Non déterminée"}
                  />
                  <AnalysisRow label="Murs" value={analysis.walls.description} />
                  <AnalysisRow label="Sol" value={analysis.floor.description} />
                  <AnalysisRow label="Style actuel" value={analysis.currentStyle ?? "Non déterminé"} />
                  <AnalysisRow label="Couleurs dominantes" value={analysis.dominantColors.join(", ") || "—"} />
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Style" value={styleLabel(project.style)} />
                <InfoRow
                  label="Budget max"
                  value={project.budgetMax ? `${project.budgetMax} €` : "Non défini"}
                />
                <InfoRow label="Statut" value={project.status} />
              </CardContent>
            </Card>

            <DeleteProjectButton projectId={project.id} projectName={project.name} />
          </div>
        </div>
      </main>
    </>
  );
}

function ProjectHeader({
  name,
  status,
  roomType,
  style,
}: {
  name: string;
  status: string;
  roomType: string | null;
  style: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <Badge tone="accent">{roomTypeLabel(roomType)}</Badge>
        <Badge tone="muted">{styleLabel(style)}</Badge>
        {status !== "ready" && <Badge tone="default">{status}</Badge>}
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{name}</h1>
    </div>
  );
}

function AnalysisRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function BudgetRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "pt-2 border-t border-border" : ""}`}>
      <span className={strong ? "font-medium" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-semibold text-accent" : "font-medium"}>{value}</span>
    </div>
  );
}
