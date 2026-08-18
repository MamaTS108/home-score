import type { HomeScoreBreakdown } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/Card";

export function HomeScoreCard({ score }: { score: HomeScoreBreakdown }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Home Score</h3>
          <span className="text-2xl font-semibold text-accent">{score.overall}/100</span>
        </div>
        <div className="space-y-3">
          <ScoreRow label="Potentiel de design" value={score.designPotential} />
          <ScoreRow label="Complexité des travaux" value={score.renovationComplexity} />
          <ScoreRow label="Efficacité budgétaire" value={score.budgetEfficiency} />
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-accent-soft overflow-hidden">
        <div className="h-full bg-accent rounded-full" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
