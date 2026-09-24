"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Textarea, Select } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/utils";
import type { EyewearProduct } from "@/lib/types";

export function EyewearDashboard({ initialProducts }: { initialProducts: EyewearProduct[] }) {
  const [products, setProducts] = useState<EyewearProduct[]>(initialProducts);
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"optique" | "solaire">("optique");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!photo) {
      setError("Ajoutez une photo de la monture (idéalement détourée, fond transparent).");
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("brand", brand);
    formData.set("name", name);
    formData.set("category", category);
    formData.set("price", price);
    formData.set("description", description);
    formData.set("photo", photo);

    const res = await fetch("/api/eyewear/products", { method: "POST", body: formData });
    const json = await res.json();

    setLoading(false);
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue.");
      return;
    }

    setProducts((prev) => [json.product, ...prev]);
    setBrand("");
    setName("");
    setCategory("optique");
    setPrice("");
    setDescription("");
    setPhoto(null);
    const fileInput = document.getElementById("eyewear-photo-input") as HTMLInputElement | null;
    if (fileInput) fileInput.value = "";
  }

  async function toggleActive(product: EyewearProduct) {
    setBusyId(product.id);
    const res = await fetch(`/api/eyewear/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !product.active }),
    });
    setBusyId(null);
    if (!res.ok) return;
    setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p)));
  }

  async function deleteProduct(product: EyewearProduct) {
    if (!confirm(`Supprimer "${product.brand} ${product.name}" ?`)) return;
    setBusyId(product.id);
    const res = await fetch(`/api/eyewear/products/${product.id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) return;
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Ajouter une monture</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Marque</Label>
                <Input id="brand" value={brand} onChange={(e) => setBrand(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="name">Nom du modèle</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Catégorie</Label>
                <Select id="category" value={category} onChange={(e) => setCategory(e.target.value as "optique" | "solaire")}>
                  <option value="optique">Optique (vue)</option>
                  <option value="solaire">Solaire</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="price">Prix (EUR, optionnel)</Label>
                <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (optionnel)</Label>
              <Textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div>
              <Label htmlFor="eyewear-photo-input">Photo de la monture</Label>
              <input
                id="eyewear-photo-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-[var(--radius-button)] file:border-0 file:bg-accent-soft file:text-accent file:text-sm file:font-medium"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Idéalement une photo de face, fond transparent ou uni, pour un rendu propre à l&apos;essayage.
              </p>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? "Ajout en cours..." : "Ajouter au catalogue"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="font-semibold">Mes montures ({products.length})</h2>
          <Link href="/essayage" className="text-sm text-accent font-medium">
            Voir la page d&apos;essayage →
          </Link>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune monture ajoutée pour le moment.</p>
          ) : (
            <ul className="space-y-3">
              {products.map((product) => (
                <li
                  key={product.id}
                  className="flex items-center gap-4 rounded-[var(--radius-button)] border border-border p-3"
                >
                  <div className="relative h-16 w-16 shrink-0 rounded-md bg-surface overflow-hidden border border-border">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-contain" unoptimized />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {product.brand} — {product.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {product.category === "solaire" ? "Solaire" : "Optique"}
                      {product.price !== null ? ` · ${formatCurrency(product.price, product.currency)}` : ""}
                    </p>
                  </div>
                  <Badge tone={product.active ? "accent" : "muted"}>
                    {product.active ? "Visible" : "Masqué"}
                  </Badge>
                  <Button variant="secondary" size="sm" disabled={busyId === product.id} onClick={() => toggleActive(product)}>
                    {product.active ? "Masquer" : "Afficher"}
                  </Button>
                  <Button variant="danger" size="sm" disabled={busyId === product.id} onClick={() => deleteProduct(product)}>
                    Supprimer
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
