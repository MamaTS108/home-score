"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

export function ArtisanInterestCTA({ projectId }: { projectId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [location, setLocation] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/interest/artisan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location }),
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
          <p className="font-medium">Merci ! Nous vous contacterons dès qu&apos;un professionnel sera disponible.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <h3 className="font-semibold mb-1">👷 Trouver un artisan</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Nous construisons notre réseau de professionnels. Recevez une mise en relation dès que ce service sera
          disponible.
        </p>

        {!expanded ? (
          <Button variant="secondary" onClick={() => setExpanded(true)}>
            🔔 Je suis intéressé(e)
          </Button>
        ) : (
          <div className="space-y-3">
            <Input
              placeholder="Ville ou code postal (optionnel)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
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
