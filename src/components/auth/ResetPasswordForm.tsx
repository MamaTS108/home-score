"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      // Full navigation (not router.push) on purpose: forces a fresh
      // server-side session read, avoiding the JWT clock-skew edge case
      // right after a password reset.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/app";
    }, 2500);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <h1 className="text-xl font-semibold mb-1">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground mb-6">Choisissez un nouveau mot de passe.</p>

        {success ? (
          <p className="text-sm text-accent">Mot de passe mis à jour. Redirection...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <PasswordInput
                id="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <PasswordInput
                id="confirmPassword"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
