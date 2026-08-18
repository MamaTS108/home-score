"use client";

import { useEffect, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = category.options.find((o) => o.value === selected) ?? null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="border border-border rounded-[var(--radius-card)] p-4" ref={containerRef}>
      <div className="mb-2">
        <p className="font-medium text-sm">{category.label}</p>
        <p className="text-xs text-muted-foreground">{category.question}</p>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full h-10 px-3 flex items-center justify-between rounded-[var(--radius-button)] border border-border bg-surface text-sm hover:border-border-strong transition-colors"
        >
          <span className="flex items-center gap-2">
            {selectedOption?.swatch && (
              <span
                className="h-4 w-4 rounded-full border border-border shrink-0"
                style={{ backgroundColor: selectedOption.swatch }}
                aria-hidden
              />
            )}
            <span className={selectedOption ? "text-foreground" : "text-muted-foreground"}>
              {selectedOption?.label ?? "Ne pas changer"}
            </span>
          </span>
          <svg
            className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
            viewBox="0 0 20 20"
            fill="none"
          >
            <path d="M5 8l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-[var(--radius-button)] border border-border bg-surface shadow-lg py-1">
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent-soft transition-colors",
                selected === null && "bg-accent-soft"
              )}
            >
              <span className="h-4 w-4 rounded-full border border-dashed border-border shrink-0" aria-hidden />
              <span className="text-muted-foreground">Ne pas changer</span>
            </button>
            {category.options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-accent-soft transition-colors",
                  selected === option.value && "bg-accent-soft"
                )}
              >
                {option.swatch && (
                  <span
                    className="h-4 w-4 rounded-full border border-border shrink-0"
                    style={{ backgroundColor: option.swatch }}
                    aria-hidden
                  />
                )}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
