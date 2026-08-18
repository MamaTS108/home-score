"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <Card className="w-full max-w-sm">
          <CardContent>
            <h1 className="text-xl font-semibold mb-1">Mot de passe oublié</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Indiquez votre email, nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            {sent ? (
              <p className="text-sm text-accent">
                Si un compte existe pour cet email, un lien de réinitialisation vient de vous être envoyé. Vérifiez
                votre boîte de réception.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer le lien"}
                </Button>
              </form>
            )}

            <p className="text-sm text-muted-foreground mt-6 text-center">
              <Link href="/login" className="text-accent font-medium">
                Retour à la connexion
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
