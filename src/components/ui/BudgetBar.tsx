import { formatCurrency } from "@/lib/utils";

export function BudgetBar({
  budgetMax,
  estimatedTotal,
}: {
  budgetMax: number | null;
  estimatedTotal: number;
}) {
  if (budgetMax === null) {
    return (
      <div className="text-sm text-muted-foreground">
        Aucun budget maximum défini, estimation produits : {formatCurrency(estimatedTotal)}
      </div>
    );
  }

  const usedRatio = Math.min(1, estimatedTotal / budgetMax);
  const overBudget = estimatedTotal > budgetMax;
  const remaining = budgetMax - estimatedTotal;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm mb-2">
        <span className="text-muted-foreground">Budget</span>
        <span className="font-medium">{formatCurrency(budgetMax)}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-accent-soft overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${usedRatio * 100}%`,
            background: overBudget ? "var(--danger)" : "var(--accent)",
          }}
        />
      </div>
      <div className="flex items-baseline justify-between text-sm mt-2">
        <span className="text-muted-foreground">Produits estimés : {formatCurrency(estimatedTotal)}</span>
        <span className={overBudget ? "text-danger font-medium" : "text-accent font-medium"}>
          {overBudget
            ? `Dépassement de ${formatCurrency(Math.abs(remaining))}`
            : `Reste ${formatCurrency(remaining)}`}
        </span>
      </div>
    </div>
  );
}
