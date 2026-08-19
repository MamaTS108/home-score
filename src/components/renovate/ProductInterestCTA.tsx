"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const CATEGORY_OPTIONS = [
  { value: "sol", label: "Sol" },
  { value: "peinture", label: "Peinture" },
  { value: "eclairage", label: "Éclairage" },
  { value: "mobilier", label: "Mobilier" },
  { value: "cuisine", label: "Cuisine" },
  { value: "salle_de_bain", label: "Salle de bain" },
];

export function ProductInterestCTA({ projectId }: { projectId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(value: string) {
    setSelected((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  async function handleSubmit() {
    if (selected.length === 0) {
      setError("Sélectionnez au moins une catégorie.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/interest/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur.");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="font-medium">Merci ! Vous serez prévenu(e) dès que ce sera disponible.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <h3 className="font-semibold mb-1">🛒 Trouver les produits nécessaires</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Nous préparons une sélection de produits adaptés à votre projet.
        </p>

        {!expanded ? (
          <Button variant="secondary" onClick={() => setExpanded(true)}>
            🔔 Je veux être informé
          </Button>
        ) : (
          <div className="space-y-4">
            <p className="text-sm font-medium">Quels produits vous intéressent ?</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-2 text-sm border border-border rounded-[var(--radius-button)] px-3 py-2 cursor-pointer hover:border-border-strong"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(option.value)}
                    onChange={() => toggle(option.value)}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Envoi..." : "Me prévenir"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
