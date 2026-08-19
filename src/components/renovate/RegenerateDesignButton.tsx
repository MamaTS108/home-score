"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";

export function RegenerateDesignButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
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
    <div className="space-y-2">
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
