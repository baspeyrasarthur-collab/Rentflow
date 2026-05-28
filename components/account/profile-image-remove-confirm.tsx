"use client";

import { useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfileImageRemoveConfirmProps = {
  action: (formData: FormData) => void | Promise<void>;
};

export function ProfileImageRemoveConfirm({
  action,
}: ProfileImageRemoveConfirmProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button
        className={buttonVariants({
          variant: "ghost",
          size: "sm",
          className: "text-destructive hover:bg-destructive/10",
        })}
        onClick={() => setIsConfirming(true)}
        type="button"
      >
        Supprimer la photo
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-destructive/35 bg-destructive/8 p-3">
      <p className="text-sm font-medium text-foreground">
        Supprimer la photo de profil ?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <form action={action}>
          <input name="confirmRemoveProfileImage" type="hidden" value="on" />
          <button
            className={buttonVariants({
              variant: "destructive",
              size: "sm",
            })}
            type="submit"
          >
            Oui
          </button>
        </form>
        <button
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          onClick={() => setIsConfirming(false)}
          type="button"
        >
          Non
        </button>
      </div>
    </div>
  );
}
