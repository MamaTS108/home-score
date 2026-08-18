const STEPS = [
  { label: "Photo", detail: "Vous prenez la pièce en photo." },
  { label: "Comprendre", detail: "L'IA identifie murs, sol, style, matériaux." },
  { label: "Imaginer", detail: "Une visualisation de rénovation est générée." },
  { label: "Planifier", detail: "La liste des travaux est établie." },
  { label: "Matériaux", detail: "Les produits nécessaires sont listés." },
  { label: "Budget", detail: "Une estimation chiffrée est calculée." },
];

export function ValueChain() {
  return (
    <ol className="grid grid-cols-2 md:grid-cols-6 gap-px bg-border rounded-[var(--radius-card)] overflow-hidden border border-border">
      {STEPS.map((step, index) => (
        <li key={step.label} className="bg-surface p-5 flex flex-col gap-2">
          <span className="font-mono text-xs text-muted-foreground">{String(index + 1).padStart(2, "0")}</span>
          <span className="font-semibold text-sm">{step.label}</span>
          <span className="text-xs text-muted-foreground leading-snug">{step.detail}</span>
        </li>
      ))}
    </ol>
  );
}
