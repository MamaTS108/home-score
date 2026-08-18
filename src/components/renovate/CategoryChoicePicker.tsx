"use client";

import { cn } from "@/lib/utils";
import type { ChoiceCategory } from "@/lib/renovationChoices";

export function CategoryChoicePicker({
  category,
  selected,
  onChange,
}: {
  category: ChoiceCategory;
  selected: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="border border-border rounded-[var(--radius-card)] p-4">
      <div className="mb-3">
        <p className="font-medium text-sm">{category.label}</p>
        <p className="text-xs text-muted-foreground">{category.question}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "text-xs px-3 py-1.5 rounded-full border transition-colors",
            selected === null
              ? "bg-foreground text-background border-foreground"
              : "bg-surface text-muted-foreground border-border hover:border-border-strong"
          )}
        >
          Ne pas changer
        </button>
        {category.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border transition-colors",
              selected === option.value
                ? "bg-accent text-accent-foreground border-accent"
                : "bg-surface text-foreground border-border hover:border-border-strong"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
