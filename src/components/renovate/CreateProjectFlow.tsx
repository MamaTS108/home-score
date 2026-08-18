"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea, Select } from "@/components/ui/Field";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CategoryChoicePicker } from "@/components/renovate/CategoryChoicePicker";
import { RENOVATION_CHOICE_CATEGORIES, composeDescription } from "@/lib/renovationChoices";
import type { RenovationStyle } from "@/lib/types";

const STYLES: { value: RenovationStyle; label: string }[] = [
  { value: "modern", label: "Moderne" },
  { value: "scandinavian", label: "Scandinave" },
  { value: "minimalist", label: "Minimaliste" },
  { value: "industrial", label: "Industriel" },
  { value: "contemporary", label: "Contemporain" },
  { value: "classic", label: "Classique" },
  { value: "japandi", label: "Japandi" },
  { value: "free", label: "Libre" },
];

type Step = "photo" | "description" | "generating";

export function CreateProjectFlow() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("photo");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("Mon projet de rénovation");
  const [selections, setSelections] = useState<Record<string, string | null>>({});
  const [notes, setNotes] = useState("");
  const [style, setStyle] = useState<RenovationStyle>("free");
  const [budgetMax, setBudgetMax] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState("Analyse de votre pièce...");

  const description = composeDescription(selections, notes);
  const hasAnySelection = Object.values(selections).some((v) => v !== null && v !== undefined);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(selected.type)) {
      setError("Formats acceptés : JPG, PNG, WEBP.");
      return;
    }

    setError(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleSubmit() {
    if (!file) {
      setError("Ajoutez une photo pour continuer.");
      return;
    }
    if (!hasAnySelection && !notes.trim()) {
      setError("Choisissez au moins un élément à changer, ou décrivez votre projet.");
      return;
    }

    setError(null);
    setStep("generating");

    try {
      setLoadingLabel("Envoi de votre photo...");
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const formData = new FormData();
      formData.append("photo", file);
      formData.append("name", name || "Mon projet de rénovation");
      if (user) formData.append("userId", user.id);

      const createRes = await fetch("/api/projects", { method: "POST", body: formData });
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson.error ?? "Erreur lors de la création du projet.");

      const projectId = createJson.project.id as string;

      setLoadingLabel("Enregistrement de votre demande...");
      const patchRes = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          style,
          budgetMax: budgetMax ? Number(budgetMax) : null,
        }),
      });
      if (!patchRes.ok) throw new Error("Erreur lors de l'enregistrement du projet.");

      setLoadingLabel("Analyse de votre pièce...");
      const genRes = await fetch(`/api/projects/${projectId}/generate`, { method: "POST" });
      const genJson = await genRes.json();
      if (!genRes.ok) throw new Error(genJson.error ?? "Erreur lors de la génération.");

      router.push(`/renovate/${projectId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setStep("description");
    }
  }

  if (step === "generating") {
    return (
      <Card className="max-w-lg mx-auto text-center py-16">
        <CardContent>
          <div className="mx-auto mb-6 h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="font-medium">{loadingLabel}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Cela peut prendre quelques instants — analyse, plan de travaux, matériaux et budget.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8">
      {/* Step 1: photo */}
      <Card>
        <CardContent>
          <Label>1. Photo de la pièce</Label>
          <p className="text-sm text-muted-foreground mb-4">Formats acceptés : JPG, PNG, WEBP.</p>

          {previewUrl ? (
            <div className="relative aspect-[4/3] rounded-[var(--radius-card)] overflow-hidden border border-border mb-3">
              <Image src={previewUrl} alt="Photo de la pièce" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-[4/3] rounded-[var(--radius-card)] border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <span className="text-sm font-medium">Cliquez pour importer une photo</span>
              <span className="text-xs">ou glissez-déposez un fichier ici</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />

          {previewUrl && (
            <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
              Changer la photo
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Step 2: structured choices */}
      <Card>
        <CardContent className="space-y-5">
          <div>
            <Label htmlFor="name">Nom du projet</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div>
            <Label>2. Que souhaitez-vous changer ?</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Cochez ce que vous voulez changer, puis choisissez une option. Plus c&apos;est précis, meilleur
              sera le résultat.
            </p>
            <div className="space-y-3">
              {RENOVATION_CHOICE_CATEGORIES.map((category) => (
                <CategoryChoicePicker
                  key={category.key}
                  category={category}
                  selected={selections[category.key] ?? null}
                  onChange={(value) => setSelections((prev) => ({ ...prev, [category.key]: value }))}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Précisions supplémentaires (optionnel)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Ex : garder la cheminée, ajouter un îlot central si la place le permet..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="style">Style (optionnel)</Label>
              <Select id="style" value={style} onChange={(e) => setStyle(e.target.value as RenovationStyle)}>
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="budget">Budget maximum (€)</Label>
              <Input
                id="budget"
                type="number"
                min={0}
                placeholder="5000"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {description && (
        <Card className="bg-accent-soft border-none">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground mb-1">Aperçu de votre demande</p>
            <p className="text-sm text-foreground">{description}</p>
          </CardContent>
        </Card>
      )}

      {error && (
        <p className="text-sm text-danger bg-danger-soft rounded-[var(--radius-button)] px-3 py-2">{error}</p>
      )}

      <Button size="lg" className="w-full" onClick={handleSubmit}>
        Générer mon projet
      </Button>
    </div>
  );
}
