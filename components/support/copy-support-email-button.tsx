"use client";

import { useState } from "react";
import { Copy } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";

type CopySupportEmailButtonProps = {
  email: string;
};

export function CopySupportEmailButton({ email }: CopySupportEmailButtonProps) {
  const [copied, setCopied] = useState(false);

  async function copyEmail() {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(email);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  }

  return (
    <button
      className={buttonVariants({ variant: "outline" })}
      onClick={copyEmail}
      type="button"
    >
      <Copy className="size-4" />
      {copied ? "Adresse copiee" : "Copier l'adresse"}
    </button>
  );
}
