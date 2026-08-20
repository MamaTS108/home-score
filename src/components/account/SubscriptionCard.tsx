"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function SubscriptionCard({
  isPremium,
  generationsUsed,
  generationsLimit,
  currentPeriodEnd,
}: {
  isPremium: boolean;
  generationsUsed: number;
  generationsLimit: number;
  currentPeriodEnd: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Erreur.");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Abonnement</h2>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Formule actuelle</span>
          <Badge tone={isPremium ? "accent" : "muted"}>{isPremium ? "Premium" : "Gratuit"}</Badge>
        </div>

        {isPremium && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Générations IA ce mois-ci</span>
              <span className="font-medium">
                {generationsUsed} / {generationsLimit}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-accent-soft overflow-hidden">
              <div
                className="h-full bg-accent rounded-full"
                style={{ width: `${Math.min(100, (generationsUsed / generationsLimit) * 100)}%` }}
              />
            </div>
            {currentPeriodEnd && (
              <p className="text-xs text-muted-foreground">
                Renouvellement le {new Date(currentPeriodEnd).toLocaleDateString("fr-FR")}
              </p>
            )}
          </>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {isPremium ? (
          <Button variant="secondary" onClick={openPortal} disabled={loading}>
            {loading ? "Redirection..." : "Gérer mon abonnement"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Passez Premium depuis n&apos;importe quel projet pour un accès illimité à vos visualisations.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
