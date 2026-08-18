import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProjectNav } from "@/components/renovate/ProjectNav";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { BudgetBar } from "@/components/ui/BudgetBar";
import { OptimizeBudgetButton } from "@/components/renovate/OptimizeBudgetButton";
import { getProjectDetail } from "@/lib/data/getProjectDetail";
import { formatCurrency } from "@/lib/utils";

export default async function BudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  const { project, productBudget, budgetSummary } = detail;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        </div>
        <ProjectNav projectId={id} />

        {!productBudget ? (
          <Card>
            <CardContent className="text-center py-16 text-muted-foreground">
              Aucune estimation de budget pour l&apos;instant.
            </CardContent>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Estimation budget matériaux
                  </h2>
                  <p className="text-3xl font-semibold mt-2">{formatCurrency(productBudget.estimatedProductsTotal)}</p>
                </CardHeader>
                <CardContent>
                  <BudgetBar budgetMax={project.budgetMax} estimatedTotal={productBudget.estimatedProductsTotal} />
                </CardContent>
              </Card>

              {budgetSummary?.isOverBudget && (
                <Card className="border-danger/40">
                  <CardContent className="space-y-3">
                    <p className="text-sm font-medium text-danger">
                      Votre projet actuel est estimé au-dessus de votre budget.
                    </p>
                    <OptimizeBudgetButton projectId={id} />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Répartition</h3>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Matériaux" value={formatCurrency(productBudget.materials)} />
                  <Row label="Accessoires" value={formatCurrency(productBudget.accessories)} />
                  <Row
                    label="Total produits"
                    value={formatCurrency(productBudget.estimatedProductsTotal)}
                    strong
                  />
                  <p className="text-xs text-muted-foreground pt-2">
                    Estimation produits uniquement. Main-d&apos;œuvre non incluse pour ce MVP.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="space-y-3 text-sm">
                  <Row label="Budget utilisateur" value={project.budgetMax ? formatCurrency(project.budgetMax) : "Non défini"} />
                  <Row
                    label="Budget restant"
                    value={
                      budgetSummary?.remaining !== null && budgetSummary?.remaining !== undefined
                        ? formatCurrency(budgetSummary.remaining)
                        : "—"
                    }
                    tone={budgetSummary?.isOverBudget ? "danger" : "accent"}
                  />
                </CardContent>
              </Card>
              <p className="text-xs text-muted-foreground">
                Toutes les quantités et tous les prix sont des estimations à vérifier avant achat ou travaux. Ce
                n&apos;est pas un devis professionnel.
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function Row({
  label,
  value,
  strong,
  tone,
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: "accent" | "danger";
}) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          strong
            ? "font-semibold"
            : tone === "danger"
              ? "font-medium text-danger"
              : tone === "accent"
                ? "font-medium text-accent"
                : "font-medium"
        }
      >
        {value}
      </span>
    </div>
  );
}
