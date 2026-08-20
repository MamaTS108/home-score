"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "teelte-cookie-consent";

export function CookieConsentBanner() {
  // Starts hidden on both server and client (avoids a hydration mismatch,
  // since localStorage isn't available during SSR), then reveals itself
  // after mount if no consent decision was stored yet.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, []);

  function respond(value: "accepted" | "rejected") {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-surface/98 backdrop-blur shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="mx-auto max-w-6xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-muted-foreground flex-1">
          Nous utilisons des cookies pour améliorer votre expérience et mesurer l&apos;audience du site. Consultez
          nos{" "}
          <Link href="/cgu" className="text-accent font-medium">
            conditions d&apos;utilisation
          </Link>{" "}
          pour en savoir plus.
        </p>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" size="sm" onClick={() => respond("rejected")}>
            Refuser
          </Button>
          <Button size="sm" onClick={() => respond("accepted")}>
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
