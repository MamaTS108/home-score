"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function OptimizeBudgetButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOptimize() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            "Optimise mon projet pour respecter mon budget maximum : propose des alternatives moins coûteuses tout en gardant l'esprit du projet.",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur lors de l'optimisation.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button onClick={handleOptimize} disabled={loading} variant="secondary">
        {loading ? "Optimisation en cours..." : "Optimiser mon projet"}
      </Button>
      {error && <p className="text-sm text-danger mt-2">{error}</p>}
    </div>
  );
}
