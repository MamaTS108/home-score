"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess(true);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
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
              <form onSubmit={handleSubmit} className="space-y-4">
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
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Création..." : "Créer mon compte"}
                </Button>
              </form>
            )}

            <p className="text-sm text-muted-foreground mt-6 text-center">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-accent font-medium">
                Se connecter
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
