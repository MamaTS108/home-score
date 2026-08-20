"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export function PaywallCard({ projectId, returnTo }: { projectId: string; returnTo: string }) {
  const [loading, setLoading] = useState<"unlock" | "premium" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(kind: "unlock" | "premium") {
    setLoading(kind);
    setError(null);
    try {
      const endpoint = kind === "unlock" ? "/api/checkout/unlock-project" : "/api/checkout/subscription";
      const body = kind === "unlock" ? { projectId } : { returnTo };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Erreur lors du paiement.");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(null);
    }
  }

  return (
    <Card className="border-accent">
      <CardContent className="text-center py-8">
        <p className="text-2xl mb-2">🔒</p>
        <p className="font-semibold mb-1">Vous avez utilisé vos 2 visualisations gratuites</p>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Débloquez d&apos;autres propositions sur ce projet, ou passez Premium pour un accès illimité à tous vos
          projets.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={() => startCheckout("unlock")} disabled={loading !== null}>
            {loading === "unlock" ? "Redirection..." : "Débloquer ce projet — 4,99 €"}
          </Button>
          <Button variant="secondary" onClick={() => startCheckout("premium")} disabled={loading !== null}>
            {loading === "premium" ? "Redirection..." : "Passer Premium — 9,99 €/mois"}
          </Button>
        </div>
        {error && <p className="text-sm text-danger mt-4">{error}</p>}
      </CardContent>
    </Card>
  );
}
