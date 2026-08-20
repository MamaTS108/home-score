"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RegenerateDesignButton } from "@/components/renovate/RegenerateDesignButton";
import { PaywallCard } from "@/components/renovate/PaywallCard";
import { cn } from "@/lib/utils";
import type { DesignGeneration } from "@/lib/types";

/** Generations 1 and 2 are always shown in full. The 3rd is generated but shown blurred until unlocked. */
const FREE_GENERATIONS = 2;
/** Generation up to this version is allowed even when locked (the 3rd is the "teaser") — beyond that, generation itself is blocked until paid. */
const MAX_TEASER_VERSION = FREE_GENERATIONS + 1;

export function DesignViewer({
  projectId,
  originalImageUrl,
  designs,
  premiumUnlocked,
  isPremium,
}: {
  projectId: string;
  originalImageUrl: string;
  designs: DesignGeneration[];
  /** This specific project was paid to unlock (one-time payment). */
  premiumUnlocked: boolean;
  /** The user has an active Premium subscription (unlocks every project). */
  isPremium: boolean;
}) {
  const latest = designs[designs.length - 1];
  const [selectedId, setSelectedId] = useState(latest.id);

  // Whenever a new version is generated, jump straight to showing it on the
  // right — don't make the person hunt for it in the history thumbnails.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedId(latest.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designs.length]);

  const selected = designs.find((d) => d.id === selectedId) ?? latest;

  const hasAccess = premiumUnlocked || isPremium;
  const isSelectedLocked = !hasAccess && selected.version > FREE_GENERATIONS;
  const nextGenerationWouldBeLocked = !hasAccess && designs.length >= MAX_TEASER_VERSION;

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/3]">
            <Image src={originalImageUrl} alt="Avant" fill className="object-cover" unoptimized />
          </div>
          <CardContent className="py-3">
            <Badge tone="muted">Avant</Badge>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/3]">
            <Image
              src={selected.imageUrl}
              alt="Après"
              fill
              className={cn("object-cover transition-all", isSelectedLocked && "blur-2xl scale-110")}
              unoptimized
            />
            {isSelectedLocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <span className="text-4xl">🔒</span>
              </div>
            )}
          </div>
          <CardContent className="py-3 flex items-center justify-between">
            <Badge tone="accent">Après : Visualisation IA</Badge>
            <span className="text-xs text-muted-foreground">Version {selected.version}</span>
          </CardContent>
        </Card>
      </div>

      {isSelectedLocked || nextGenerationWouldBeLocked ? (
        <PaywallCard projectId={projectId} returnTo={`/renovate/${projectId}/design`} />
      ) : (
        <>
          <Card>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium text-foreground">{selected.disclaimer}</p>
              <p>Ce n&apos;est pas un plan architectural. Le résultat final peut différer de la réalisation.</p>
            </CardContent>
          </Card>
          <RegenerateDesignButton
            projectId={projectId}
            hasExistingDesign
            selectedVersion={selected.version}
            sourceDesignId={selected.id}
          />
        </>
      )}

      {designs.length > 1 && (
        <Card>
          <CardContent>
            <h3 className="font-semibold text-sm mb-3">Historique des versions</h3>
            <p className="text-xs text-muted-foreground mb-3">Cliquez une version pour l&apos;afficher en grand.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {designs.map((d) => {
                const locked = !hasAccess && d.version > FREE_GENERATIONS;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={cn(
                      "relative aspect-square rounded-[var(--radius-button)] overflow-hidden border-2 transition-colors",
                      selected.id === d.id ? "border-accent" : "border-border hover:border-border-strong"
                    )}
                  >
                    <Image
                      src={d.imageUrl}
                      alt={`Version ${d.version}`}
                      fill
                      className={cn("object-cover", locked && "blur-md")}
                      unoptimized
                    />
                    {locked && (
                      <span className="absolute inset-0 flex items-center justify-center bg-black/25 text-lg">
                        🔒
                      </span>
                    )}
                    <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white rounded px-1.5 py-0.5">
                      v{d.version}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
