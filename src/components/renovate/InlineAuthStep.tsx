"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { Card, CardContent } from "@/components/ui/Card";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function InlineAuthStep({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSent, setSignupSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      onAuthenticated();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setSignupSent(true);
    }
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardContent>
        <h2 className="text-xl font-semibold mb-1">Encore une étape</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Connectez-vous pour voir le résultat de votre projet et le retrouver plus tard. Votre photo et vos
          choix sont conservés.
        </p>

        {signupSent ? (
          <p className="text-sm text-accent">
            Compte créé ! Vérifiez votre email pour confirmer votre inscription, puis connectez-vous ci-dessous.
          </p>
        ) : (
          <>
            <GoogleAuthButton nextPath="/renovate" />

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="auth-password">Mot de passe</Label>
                <Input
                  id="auth-password"
                  type="password"
                  required
                  minLength={mode === "signup" ? 6 : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading
                  ? "Un instant..."
                  : mode === "signin"
                    ? "Se connecter et voir le résultat"
                    : "Créer mon compte"}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground mt-6 text-center">
              {mode === "signin" ? (
                <>
                  Pas encore de compte ?{" "}
                  <button type="button" className="text-accent font-medium" onClick={() => setMode("signup")}>
                    Créer un compte
                  </button>
                </>
              ) : (
                <>
                  Déjà un compte ?{" "}
                  <button type="button" className="text-accent font-medium" onClick={() => setMode("signin")}>
                    Se connecter
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
