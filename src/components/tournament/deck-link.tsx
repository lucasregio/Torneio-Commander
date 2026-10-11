"use client";

import { ExternalLink } from "lucide-react";

type Props = {
  href: string;
  label?: string;
  className?: string;
};

export function DeckLink({ href, label = "lista", className }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center gap-1 text-[var(--felt-accent)] underline-offset-2 hover:underline"
      }
    >
      <ExternalLink className="size-3.5 shrink-0" aria-hidden />
      <span>{label}</span>
    </a>
  );
}
