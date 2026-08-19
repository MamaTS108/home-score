"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { RegenerateDesignButton } from "@/components/renovate/RegenerateDesignButton";
import { cn } from "@/lib/utils";
import type { DesignGeneration } from "@/lib/types";

export function DesignViewer({
  projectId,
  originalImageUrl,
  designs,
}: {
  projectId: string;
  originalImageUrl: string;
  designs: DesignGeneration[];
}) {
  const latest = designs[designs.length - 1];
  const [selectedId, setSelectedId] = useState(latest.id);
  const selected = designs.find((d) => d.id === selectedId) ?? latest;

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
            <Image src={selected.imageUrl} alt="Après" fill className="object-cover" unoptimized />
          </div>
          <CardContent className="py-3 flex items-center justify-between">
            <Badge tone="accent">Après : Visualisation IA</Badge>
            <span className="text-xs text-muted-foreground">Version {selected.version}</span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p className="font-medium text-foreground">{selected.disclaimer}</p>
          <p>Ce n&apos;est pas un plan architectural. Le résultat final peut différer de la réalisation.</p>
        </CardContent>
      </Card>

      <div>
        <RegenerateDesignButton projectId={projectId} hasExistingDesign />
      </div>

      {designs.length > 1 && (
        <Card>
          <CardContent>
            <h3 className="font-semibold text-sm mb-3">Historique des versions</h3>
            <p className="text-xs text-muted-foreground mb-3">Cliquez une version pour l&apos;afficher en grand.</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {designs.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className={cn(
                    "relative aspect-square rounded-[var(--radius-button)] overflow-hidden border-2 transition-colors",
                    selected.id === d.id ? "border-accent" : "border-border hover:border-border-strong"
                  )}
                >
                  <Image src={d.imageUrl} alt={`Version ${d.version}`} fill className="object-cover" unoptimized />
                  <span className="absolute bottom-1 right-1 text-[10px] bg-black/60 text-white rounded px-1.5 py-0.5">
                    v{d.version}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
