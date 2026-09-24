"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { EyewearTryOn } from "@/components/eyewear/EyewearTryOn";
import type { EyewearProduct } from "@/lib/types";

export function EyewearTryOnPage({ products }: { products: EyewearProduct[] }) {
  const [selected, setSelected] = useState<EyewearProduct | null>(null);

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-10">
          <p className="font-medium mb-1">Aucune monture disponible pour le moment.</p>
          <p className="text-sm text-muted-foreground mb-5">
            Les opticiens partenaires ajoutent progressivement leur catalogue.
          </p>
          <a href="/opticien">
            <Button variant="secondary">Je suis opticien, ajouter mon catalogue</Button>
          </a>
        </CardContent>
      </Card>
    );
  }

  if (selected) {
    return <EyewearTryOn product={selected} onClose={() => setSelected(null)} />;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => setSelected(product)}
          className="text-left rounded-[var(--radius-card)] border border-border bg-surface overflow-hidden hover:border-border-strong transition-colors"
        >
          <div className="relative aspect-square bg-white">
            <Image src={product.imageUrl} alt={product.name} fill className="object-contain p-4" unoptimized />
            <Badge tone={product.category === "solaire" ? "accent" : "default"} className="absolute top-2 left-2">
              {product.category === "solaire" ? "Solaire" : "Optique"}
            </Badge>
          </div>
          <div className="p-3">
            <p className="text-sm font-medium truncate">{product.brand}</p>
            <p className="text-xs text-muted-foreground truncate">{product.name}</p>
            {product.price !== null && (
              <p className="text-sm mt-1 font-medium">{formatCurrency(product.price, product.currency)}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
