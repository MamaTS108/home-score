"use client";

import { useState, InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn(
          "w-full h-10 pl-3 pr-10 rounded-[var(--radius-button)] border border-border bg-surface text-sm text-foreground placeholder:text-muted-foreground focus:border-accent transition-colors",
          className
        )}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.4 5.5A9.6 9.6 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.4-2.4 3.6M6.6 6.6C4.6 8 3.4 9.9 2 12c1 2.5 5 7 10 7 1.3 0 2.5-.3 3.6-.8"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        )}
      </button>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";
