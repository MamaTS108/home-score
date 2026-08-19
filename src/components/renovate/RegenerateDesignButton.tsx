"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

type Source = "original" | "selected";

export function RegenerateDesignButton({
  projectId,
  hasExistingDesign = false,
  selectedVersion,
  sourceDesignId,
}: {
  projectId: string;
  /** Whether at least one design version already exists (enables the "selected" source option). */
  hasExistingDesign?: boolean;
  /** Version number of the design currently displayed on screen (left/right cards, or a clicked history thumbnail). */
  selectedVersion?: number;
  /** ID of that same currently-displayed design — this is what gets edited, not necessarily the newest one. */
  sourceDesignId?: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [source, setSource] = useState<Source>("original");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          source,
          sourceDesignId: source === "selected" ? sourceDesignId : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur lors de la régénération.");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {hasExistingDesign && (
        <div>
          <p className="text-xs font-medium text-foreground mb-1.5">Partir de quelle image ?</p>
          <div className="inline-flex rounded-[var(--radius-button)] border border-border p-0.5 bg-surface">
            <SourceOption label="Photo originale" active={source === "original"} onClick={() => setSource("original")} />
            <SourceOption
              label={`Version affichée${selectedVersion ? ` (v${selectedVersion})` : ""}`}
              active={source === "selected"}
              onClick={() => setSource("selected")}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {source === "original"
              ? "Repart de votre photo d'origine — bon pour explorer une proposition très différente."
              : "Modifie la version actuellement affichée à l'écran (celle de droite, ou celle sélectionnée dans l'historique) — bon pour un ajustement précis sans tout changer."}
          </p>
        </div>
      )}

      <Textarea
        rows={2}
        placeholder="Précisez ce que vous voulez changer (optionnel) : ex. « lit au centre, tête de lit en bois »..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button variant="secondary" onClick={handleRegenerate} disabled={loading}>
        {loading ? "Génération en cours..." : "Régénérer une autre proposition"}
      </Button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function SourceOption({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-xs px-3 py-1.5 rounded-[calc(var(--radius-button)-2px)] transition-colors",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </button>
  );
}
