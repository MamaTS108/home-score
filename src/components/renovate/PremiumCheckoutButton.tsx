"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function PremiumCheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnTo: "/app" }),
      });
      const json = await res.json();

      if (res.status === 401) {
        // Full navigation on purpose, not router.push — mirrors the pattern
        // used elsewhere for post-auth redirects.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/login?next=/tarifs";
        return;
      }
      if (!res.ok || !json.url) throw new Error(json.error ?? "Erreur lors du paiement.");
      window.location.href = json.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div>
      <Button variant="secondary" className="w-full" onClick={handleClick} disabled={loading}>
        {loading ? "Redirection..." : "Payer et passer Premium"}
      </Button>
      {error && <p className="text-xs text-danger mt-2 text-center">{error}</p>}
    </div>
  );
}
