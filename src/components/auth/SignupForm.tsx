"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

function SignupFormInner() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/app";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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
    if (!acceptedTerms) {
      setError("Vous devez accepter les conditions générales d'utilisation.");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  }

  return (
    <Card className="w-full max-w-sm">
      <CardContent>
        <h1 className="text-xl font-semibold mb-1">Créer un compte</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sauvegardez vos projets et retrouvez-les dans votre tableau de bord.
        </p>

        {success ? (
          <p className="text-sm text-accent">
            Compte créé ! Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.
          </p>
        ) : (
          <>
            <GoogleAuthButton nextPath={nextPath} />

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">ou</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="fullName">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
                />
                <span className="text-muted-foreground">
                  J&apos;accepte les{" "}
                  <Link href="/cgu" target="_blank" className="text-accent font-medium">
                    conditions générales d&apos;utilisation
                  </Link>
                </span>
              </label>
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Création..." : "Créer mon compte"}
              </Button>
            </form>
          </>
        )}

        <p className="text-sm text-muted-foreground mt-6 text-center">
          Déjà un compte ?{" "}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="text-accent font-medium">
            Se connecter
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export function SignupForm() {
  return (
    <Suspense fallback={null}>
      <SignupFormInner />
    </Suspense>
  );
}
