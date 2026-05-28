import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_COUNTRY } from "@/server/config/app";
import { getOwnerPropertyCreationAvailability } from "@/server/owner/properties";

import { createOwnerPropertyAction } from "./actions";

async function getPropertyCreationAvailabilityForPage() {
  try {
    return await getOwnerPropertyCreationAvailability();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function NewOwnerPropertyPage() {
  const creationAvailability = await getPropertyCreationAvailabilityForPage();

  return (
    <section className="max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Nouveau logement
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Ajouter un logement
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Le logement sera cree en brouillon. Les contrats, invitations et
              paiements seront ajoutes dans des etapes separees.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/owner/properties"
          >
            Retour logements
          </Link>
        </div>
      </div>

      {!creationAvailability.canCreateProperty ? (
        <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
          <p className="font-medium text-card-foreground">
            Votre plan actuel ne permet pas d’ajouter un logement
            supplémentaire.
          </p>
          <p className="mt-2">
            Les changements de plan seront disponibles plus tard.
          </p>
          <Link
            className={buttonVariants({
              className: "mt-4",
              variant: "outline",
            })}
            href="/owner/upgrade"
          >
            Voir les plans
          </Link>
        </div>
      ) : (
        <form action={createOwnerPropertyAction} className="space-y-6">
          <div className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="name">
                Nom du logement
              </label>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="name"
                maxLength={120}
                name="name"
                required
                type="text"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="addressLine1">
                Adresse
              </label>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="addressLine1"
                maxLength={191}
                name="addressLine1"
                required
                type="text"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="addressLine2">
                Complement adresse
              </label>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="addressLine2"
                maxLength={191}
                name="addressLine2"
                type="text"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="postalCode">
                Code postal
              </label>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="postalCode"
                maxLength={32}
                name="postalCode"
                required
                type="text"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="city">
                Ville
              </label>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="city"
                maxLength={120}
                name="city"
                required
                type="text"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="country">
                Pays
              </label>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm uppercase outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue={DEFAULT_COUNTRY}
                id="country"
                maxLength={2}
                name="country"
                required
                type="text"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="propertyType">
                Type
              </label>
              <select
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue="APARTMENT"
                id="propertyType"
                name="propertyType"
                required
              >
                <option value="APARTMENT">Appartement</option>
                <option value="HOUSE">Maison</option>
                <option value="ROOM">Chambre</option>
                <option value="OTHER">Autre</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="surfaceAreaSqm">
                Surface en m2
              </label>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="surfaceAreaSqm"
                min={1}
                name="surfaceAreaSqm"
                step={1}
                type="number"
              />
            </div>

            <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-3">
              <input
                className="size-4 rounded border"
                id="furnished"
                name="furnished"
                type="checkbox"
              />
              <label className="text-sm font-medium" htmlFor="furnished">
                Logement meuble
              </label>
            </div>

            <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-3">
              <input
                className="size-4 rounded border"
                id="isColocation"
                name="isColocation"
                type="checkbox"
              />
              <label className="text-sm font-medium" htmlFor="isColocation">
                Colocation
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/properties"
            >
              Annuler
            </Link>
            <Button type="submit">Creer le brouillon</Button>
          </div>
        </form>
      )}
    </section>
  );
}
