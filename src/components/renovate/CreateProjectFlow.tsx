"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea, Select } from "@/components/ui/Field";
import { Card, CardContent } from "@/components/ui/Card";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { CategoryChoicePicker } from "@/components/renovate/CategoryChoicePicker";
import { InlineAuthStep } from "@/components/renovate/InlineAuthStep";
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

type Step = "photo" | "description" | "auth" | "generating";

export function CreateProjectFlow() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("photo");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("Mon projet de rénovation");
  const [selections, setSelections] = useState<Record<string, string | null>>({});
  const [promptText, setPromptText] = useState("");
  const [style, setStyle] = useState<RenovationStyle>("free");
  const [budgetMax, setBudgetMax] = useState("");
  const [areaM2, setAreaM2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingLabel, setLoadingLabel] = useState("Analyse de votre pièce...");
  const lastAutoTextRef = useRef("");

  const hasAnySelection = Object.values(selections).some((v) => v !== null && v !== undefined);
  const description = promptText;

  // Live-fills the prompt box as choices are made. If the person has typed
  // their own edits into the box, further chip selections stop overwriting
  // it — their manual edits always win once made.
  useEffect(() => {
    const base = composeDescription(selections, "");
    const autoText = areaM2.trim() ? `${base} Surface approximative de la pièce : ${areaM2.trim()} m².`.trim() : base;
    const previousAutoText = lastAutoTextRef.current;
    setPromptText((current) => (current === previousAutoText ? autoText : current));
    lastAutoTextRef.current = autoText;
  }, [selections, areaM2]);

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

  async function handleGenerateClick() {
    if (!file) {
      setError("Ajoutez une photo pour continuer.");
      return;
    }
    if (!hasAnySelection && !promptText.trim()) {
      setError("Choisissez au moins un élément à changer, ou décrivez votre projet.");
      return;
    }

    setError(null);

    // Gate right before generating the result — not earlier — so people can
    // fill in the whole form first. Their photo and choices stay in memory,
    // nothing is lost while they sign in.
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStep("auth");
      return;
    }

    await runGeneration();
  }

  async function runGeneration() {
    setError(null);
    setStep("generating");

    try {
      setLoadingLabel("Envoi de votre photo...");
      const supabase = createSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const formData = new FormData();
      formData.append("photo", file!);
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

  if (step === "auth") {
    return <InlineAuthStep onAuthenticated={runGeneration} />;
  }

  if (step === "generating") {
    return (
      <Card className="max-w-lg mx-auto text-center py-16">
        <CardContent>
          <div className="mx-auto mb-6 h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="font-medium">{loadingLabel}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Cela peut prendre quelques instants : analyse, plan de travaux, matériaux et budget.
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
            <Label htmlFor="promptText">Votre demande (se remplit automatiquement, modifiable)</Label>
            <Textarea
              id="promptText"
              rows={4}
              placeholder="Sélectionnez des options ci-dessus, ou décrivez directement votre projet ici..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Cette zone se remplit selon vos choix ci-dessus. Vous pouvez aussi la modifier ou compléter
              librement (ex : garder la cheminée, ajouter un îlot central...).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="area">Surface (m², optionnel)</Label>
              <Input
                id="area"
                type="number"
                min={0}
                placeholder="15"
                value={areaM2}
                onChange={(e) => setAreaM2(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-sm text-danger bg-danger-soft rounded-[var(--radius-button)] px-3 py-2">{error}</p>
      )}

      <Button size="lg" className="w-full" onClick={handleGenerateClick}>
        Générer mon projet
      </Button>
    </div>
  );
}
