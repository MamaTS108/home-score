"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function SubscriptionCard({
  isPremium,
  generationsUsed,
  generationsLimit,
  currentPeriodEnd,
  unlockedProjects,
}: {
  isPremium: boolean;
  generationsUsed: number;
  generationsLimit: number;
  currentPeriodEnd: string | null;
  unlockedProjects: { id: string; name: string }[];
}) {
  const [loading, setLoading] = useState<"portal" | "upgrade" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading("portal");
    setError(null);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Erreur.");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(null);
    }
  }

  async function startUpgrade() {
    setLoading("upgrade");
    setError(null);
    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/compte" }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error ?? "Erreur.");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(null);
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

        {unlockedProjects.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              🔓 {unlockedProjects.length} projet{unlockedProjects.length > 1 ? "s" : ""} débloqué
              {unlockedProjects.length > 1 ? "s" : ""} à l&apos;unité (jusqu&apos;à 30 générations chacun)
            </p>
            <ul className="space-y-1">
              {unlockedProjects.map((p) => (
                <li key={p.id}>
                  <Link href={`/renovate/${p.id}/design`} className="text-sm text-accent font-medium">
                    {p.name} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        {isPremium ? (
          <Button variant="secondary" onClick={openPortal} disabled={loading !== null}>
            {loading === "portal" ? "Redirection..." : "Gérer mon abonnement"}
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Passez Premium pour un accès illimité (jusqu&apos;à 1000 générations/mois) à tous vos projets, présents
              et futurs.
            </p>
            <Button onClick={startUpgrade} disabled={loading !== null}>
              {loading === "upgrade" ? "Redirection..." : "Passer Premium : 9,99 €/mois"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
