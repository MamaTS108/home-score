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
      <CardContent className="py-8">
        <div className="text-center mb-6">
          <p className="text-2xl mb-2">🔒</p>
          <p className="font-semibold mb-1">Vous avez utilisé vos 2 visualisations gratuites</p>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Deux façons de continuer, selon votre besoin :
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="border border-border rounded-[var(--radius-card)] p-4 flex flex-col">
            <p className="font-medium text-sm mb-1">Débloquer ce projet</p>
            <p className="text-xs text-muted-foreground mb-4 flex-1">
              Paiement unique. Jusqu&apos;à 30 générations sur ce projet précis. Idéal si vous n&apos;avez
              qu&apos;une seule pièce à rénover.
            </p>
            <Button onClick={() => startCheckout("unlock")} disabled={loading !== null} className="w-full">
              {loading === "unlock" ? "Redirection..." : "4,99 € : une seule fois"}
            </Button>
          </div>

          <div className="border border-border rounded-[var(--radius-card)] p-4 flex flex-col">
            <p className="font-medium text-sm mb-1">Passer Premium</p>
            <p className="text-xs text-muted-foreground mb-4 flex-1">
              Abonnement mensuel. Accès illimité à tous vos projets présents et futurs, jusqu&apos;à 1000 générations
              IA par mois. Idéal pour plusieurs pièces ou une rénovation complète.
            </p>
            <Button
              variant="secondary"
              onClick={() => startCheckout("premium")}
              disabled={loading !== null}
              className="w-full"
            >
              {loading === "premium" ? "Redirection..." : "9,99 € / mois"}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-danger mt-4 text-center">{error}</p>}
      </CardContent>
    </Card>
  );
}
