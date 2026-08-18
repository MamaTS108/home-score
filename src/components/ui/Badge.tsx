import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type Tone = "default" | "accent" | "danger" | "muted";

const toneClasses: Record<Tone, string> = {
  default: "bg-surface border border-border text-foreground",
  accent: "bg-accent-soft text-accent",
  danger: "bg-danger-soft text-danger",
  muted: "bg-[color-mix(in_srgb,var(--border)_50%,transparent)] text-muted-foreground",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
