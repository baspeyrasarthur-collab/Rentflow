"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/rentflow";
import { cn } from "@/lib/utils";

const DEMO_RESET_EVENT = "rentflow-demo-reset";

type DemoSimulatedActionProps = {
  label: string;
  doneLabel: string;
  confirmLabel?: string;
  className?: string;
  tone?: "default" | "success" | "warning" | "danger";
};

function useDemoReset(reset: () => void) {
  useEffect(() => {
    window.addEventListener(DEMO_RESET_EVENT, reset);

    return () => window.removeEventListener(DEMO_RESET_EVENT, reset);
  }, [reset]);
}

export function DemoResetButton({ className }: { className?: string }) {
  return (
    <button
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        className,
      )}
      onClick={() => window.dispatchEvent(new Event(DEMO_RESET_EVENT))}
      type="button"
    >
      <RotateCcw className="size-3.5" />
      Réinitialiser la démo
    </button>
  );
}

export function DemoSimulatedAction({
  className,
  confirmLabel,
  doneLabel,
  label,
  tone = "default",
}: DemoSimulatedActionProps) {
  const [state, setState] = useState<"idle" | "confirming" | "done">("idle");

  useDemoReset(() => setState("idle"));

  if (state === "done") {
    return (
      <div
        className={cn(
          "rounded-lg border border-primary/35 bg-primary/10 px-3 py-2 text-sm",
          className,
        )}
      >
        <StatusBadge tone="success">{doneLabel}</StatusBadge>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Action simulée localement. Aucune donnée réelle n&apos;a été modifiée.
        </p>
      </div>
    );
  }

  if (state === "confirming") {
    return (
      <div
        className={cn(
          "rounded-lg border border-chart-4/45 bg-chart-4/10 p-3 text-sm",
          className,
        )}
      >
        <p className="font-medium text-foreground">
          {confirmLabel ?? "Confirmer cette action fictive ?"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className={buttonVariants({ size: "sm" })}
            onClick={() => setState("done")}
            type="button"
          >
            Oui, simuler
          </button>
          <button
            className={buttonVariants({ variant: "outline", size: "sm" })}
            onClick={() => setState("idle")}
            type="button"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      className={cn(
        buttonVariants({
          variant:
            tone === "danger"
              ? "destructive"
              : tone === "default"
                ? "outline"
                : "default",
          size: "sm",
        }),
        tone === "success" && "bg-primary text-primary-foreground",
        tone === "warning" && "bg-chart-4 text-background hover:bg-chart-4/90",
        className,
      )}
      onClick={() => setState(confirmLabel ? "confirming" : "done")}
      type="button"
    >
      {label}
    </button>
  );
}

export function DemoInlinePanel({
  children,
  triggerLabel,
  title,
}: {
  children: ReactNode;
  triggerLabel: string;
  title: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useDemoReset(() => setIsOpen(false));

  return (
    <div className="space-y-3">
      <button
        className={buttonVariants({ variant: "outline", size: "sm" })}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        {triggerLabel}
      </button>
      {isOpen ? (
        <div className="rounded-xl border border-ring/35 bg-ring/10 p-4">
          <p className="font-medium text-foreground">{title}</p>
          <div className="mt-3 text-sm leading-6 text-muted-foreground">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DemoTenantRequestComposer() {
  const [requests, setRequests] = useState<string[]>([]);
  const [subject, setSubject] = useState("");

  useDemoReset(() => {
    setRequests([]);
    setSubject("");
  });

  return (
    <div className="grid gap-3">
      <label className="grid gap-1 text-sm font-medium">
        Sujet
        <input
          className="h-10 rounded-lg border bg-background px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Ex. Joint de fenêtre à vérifier"
          value={subject}
        />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Message
        <textarea
          className="min-h-24 rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          defaultValue="Bonjour, pouvez-vous regarder ce point quand vous aurez un moment ?"
        />
      </label>
      <button
        className={buttonVariants()}
        onClick={() => {
          const requestTitle = subject.trim() || "Nouvelle demande fictive";

          setRequests((current) => [requestTitle, ...current]);
          setSubject("");
        }}
        type="button"
      >
        Envoyer la demande (simulation)
      </button>
      {requests.length > 0 ? (
        <div className="rounded-lg border border-primary/35 bg-primary/10 p-3">
          <StatusBadge tone="success">Demande ajoutée dans la démo</StatusBadge>
          <ul className="mt-3 space-y-2 text-sm">
            {requests.map((request) => (
              <li key={request}>{request}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
