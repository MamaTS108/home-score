"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ProjectNav({ projectId }: { projectId: string }) {
  const pathname = usePathname();

  const tabs = [
    { href: `/renovate/${projectId}`, label: "Projet" },
    { href: `/renovate/${projectId}/design`, label: "Visualisation" },
    { href: `/renovate/${projectId}/products`, label: "Produits" },
    { href: `/renovate/${projectId}/budget`, label: "Budget" },
  ];

  return (
    <nav className="flex items-center gap-1 border-b border-border mb-8 -mt-2 overflow-x-auto">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              active
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
