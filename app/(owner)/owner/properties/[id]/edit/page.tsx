import Link from "next/link";
import { notFound } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { getOwnerPropertyById } from "@/server/owner/properties";

import { updateOwnerPropertyAction } from "./actions";

async function getPropertyForPage(propertyId: string) {
  try {
    return await getOwnerPropertyById(propertyId);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function EditOwnerPropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyForPage(id);

  if (!property) {
    notFound();
  }

  const updateAction = updateOwnerPropertyAction.bind(null, property.id);

  return (
    <section className="max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Modifier logement
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              {property.name}
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Modification des informations simples uniquement. Le statut du
              logement reste gere dans une etape separee.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/owner/properties/${property.id}`}
          >
            Retour detail
          </Link>
        </div>
      </div>

      <form action={updateAction} className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="name">
              Nom du logement
            </label>
            <input
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={property.name}
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
              defaultValue={property.addressLine1}
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
              defaultValue={property.addressLine2 ?? ""}
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
              defaultValue={property.postalCode}
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
              defaultValue={property.city}
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
              defaultValue={property.country}
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
              defaultValue={property.propertyType}
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
              defaultValue={property.surfaceAreaSqm ?? ""}
              id="surfaceAreaSqm"
              min={1}
              name="surfaceAreaSqm"
              step={1}
              type="number"
            />
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-3">
            <input name="furnishedPresent" type="hidden" value="1" />
            <input
              className="size-4 rounded border"
              defaultChecked={property.furnished}
              id="furnished"
              name="furnished"
              type="checkbox"
            />
            <label className="text-sm font-medium" htmlFor="furnished">
              Logement meuble
            </label>
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-3">
            <input name="isColocationPresent" type="hidden" value="1" />
            <input
              className="size-4 rounded border"
              defaultChecked={property.isColocation}
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
            href={`/owner/properties/${property.id}`}
          >
            Annuler
          </Link>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </section>
  );
}
