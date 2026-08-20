"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const MAX_ATTEMPTS = 6;
const RETRY_DELAY_MS = 2000;

/**
 * The Stripe webhook that unlocks a project can take a second or two to
 * arrive after Stripe redirects the browser back here — without this, the
 * page can briefly (or, on a slow webhook, confusingly) look like "nothing
 * happened" even though the payment succeeded.
 */
export function CheckoutStatusBanner({ isUnlocked }: { isUnlocked: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get("checkout");

  const [attempts, setAttempts] = useState(0);
  const [gaveUp, setGaveUp] = useState(false);

  useEffect(() => {
    if (checkoutStatus !== "success" || isUnlocked) return;
    if (attempts >= MAX_ATTEMPTS) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGaveUp(true);
      return;
    }

    const timeout = setTimeout(() => {
      setAttempts((a) => a + 1);
      router.refresh();
    }, RETRY_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [checkoutStatus, isUnlocked, attempts, router]);

  if (checkoutStatus === "canceled") {
    return (
      <Card className="border-border">
        <CardContent className="text-sm text-muted-foreground py-4">Paiement annulé.</CardContent>
      </Card>
    );
  }

  if (checkoutStatus !== "success" || isUnlocked) return null;

  if (gaveUp) {
    return (
      <Card className="border-accent">
        <CardContent className="py-4 flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Le paiement a été reçu, mais sa confirmation prend plus de temps que prévu. Réessayez de rafraîchir dans
            un instant.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setAttempts(0);
              setGaveUp(false);
              router.refresh();
            }}
          >
            Rafraîchir
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-accent">
      <CardContent className="py-4">
        <p className="text-sm text-muted-foreground">
          Paiement reçu — confirmation en cours <span className="inline-block animate-pulse">⏳</span>
        </p>
      </CardContent>
    </Card>
  );
}
