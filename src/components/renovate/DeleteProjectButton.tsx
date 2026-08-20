"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function DeleteProjectButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Erreur lors de la suppression.");
      router.push("/app");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <Button variant="secondary" onClick={() => setConfirming(true)} className="text-danger hover:text-danger">
        Supprimer ce projet
      </Button>
    );
  }

  return (
    <div className="border border-danger rounded-[var(--radius-card)] p-4 space-y-3">
      <p className="text-sm font-medium">
        Supprimer définitivement « {projectName} » ? Cette action est irréversible : l&apos;analyse, le plan, le
        budget et les visualisations générées seront perdus.
      </p>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => setConfirming(false)} disabled={loading}>
          Annuler
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={loading}>
          {loading ? "Suppression..." : "Oui, supprimer"}
        </Button>
      </div>
    </div>
  );
}
