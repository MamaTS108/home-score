"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function DeleteAccountButton({ isPremium }: { isPremium: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Erreur lors de la suppression.");

      const supabase = createSupabaseBrowserClient();
      await supabase.auth.signOut();

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <Card className="border-danger">
      <CardHeader>
        <h2 className="font-semibold text-danger">Zone de danger</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {!confirming ? (
          <>
            <p className="text-sm text-muted-foreground">
              Supprimez définitivement votre compte et toutes vos données (projets, visualisations, historique).
              Cette action est irréversible.
            </p>
            <Button variant="secondary" onClick={() => setConfirming(true)} className="text-danger">
              Supprimer mon compte
            </Button>
          </>
        ) : (
          <>
            {isPremium && (
              <p className="text-sm text-danger font-medium">
                ⚠️ Vous avez un abonnement Premium actif. Supprimer votre compte n&apos;annule pas automatiquement
                cet abonnement — pensez à l&apos;annuler d&apos;abord ci-dessus (« Gérer mon abonnement ») pour
                éviter d&apos;être facturé à nouveau.
              </p>
            )}
            <p className="text-sm font-medium">
              Confirmez-vous la suppression définitive de votre compte et de toutes vos données ? Cette action est
              irréversible.
            </p>
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={loading}>
                Annuler
              </Button>
              <Button variant="danger" onClick={handleDelete} disabled={loading}>
                {loading ? "Suppression..." : "Oui, supprimer définitivement"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
