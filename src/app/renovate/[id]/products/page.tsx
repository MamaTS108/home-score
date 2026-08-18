import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ProjectNav } from "@/components/renovate/ProjectNav";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { getProjectDetail } from "@/lib/data/getProjectDetail";
import { formatCurrency } from "@/lib/utils";

export default async function ProductsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProjectDetail(id);
  if (!detail) notFound();

  const { project, productBudget } = detail;

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-6xl w-full px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        </div>
        <ProjectNav projectId={id} />

        {!productBudget || productBudget.lines.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16 text-muted-foreground">
              Aucun produit estimé pour l&apos;instant.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="flex items-center justify-between flex-row">
              <div>
                <h2 className="font-semibold">Matériaux / produits</h2>
                <p className="text-xs text-muted-foreground mt-1">Estimation basée sur des prix indicatifs.</p>
              </div>
              <span className="font-semibold text-accent">{formatCurrency(productBudget.estimatedProductsTotal)}</span>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Produit</th>
                    <th className="px-5 py-3 font-medium">Catégorie</th>
                    <th className="px-5 py-3 font-medium text-right">Quantité</th>
                    <th className="px-5 py-3 font-medium text-right">Prix unitaire</th>
                    <th className="px-5 py-3 font-medium text-right">Total estimé</th>
                  </tr>
                </thead>
                <tbody>
                  {productBudget.lines.map((line) => (
                    <tr key={line.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-3 font-medium">{line.name}</td>
                      <td className="px-5 py-3 text-muted-foreground capitalize">{line.category}</td>
                      <td className="px-5 py-3 text-right">
                        {line.quantity} {line.unit}
                      </td>
                      <td className="px-5 py-3 text-right">{formatCurrency(line.estimatedUnitPrice)}</td>
                      <td className="px-5 py-3 text-right font-medium">{formatCurrency(line.estimatedTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="px-5 py-3 text-right text-muted-foreground">
                      Matériaux
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(productBudget.materials)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="px-5 py-3 text-right text-muted-foreground">
                      Accessoires
                    </td>
                    <td className="px-5 py-3 text-right font-medium">{formatCurrency(productBudget.accessories)}</td>
                  </tr>
                  <tr className="border-t border-border">
                    <td colSpan={4} className="px-5 py-3 text-right font-semibold">
                      Total produits
                    </td>
                    <td className="px-5 py-3 text-right font-semibold text-accent">
                      {formatCurrency(productBudget.estimatedProductsTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-muted-foreground mt-4">
          Les produits affichés ne proviennent pas de Leroy Merlin ni d&apos;un autre revendeur. Toutes les
          quantités et tous les prix sont des estimations à vérifier avant achat.
        </p>
      </main>
    </>
  );
}
