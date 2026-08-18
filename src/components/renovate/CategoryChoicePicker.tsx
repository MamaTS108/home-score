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
  const active = selected !== null;

  return (
    <div className="border border-border rounded-[var(--radius-card)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-medium text-sm">{category.label}</p>
          <p className="text-xs text-muted-foreground">{category.question}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => onChange(e.target.checked ? category.options[0].value : null)}
            className="h-4 w-4 rounded border-border accent-accent"
          />
          Changer
        </label>
      </div>

      {active && (
        <div className="flex flex-wrap gap-2">
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
      )}
    </div>
  );
}
