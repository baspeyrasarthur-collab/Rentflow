import Link from "next/link";
import { notFound } from "next/navigation";

import { Button, buttonVariants } from "@/components/ui/button";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_CURRENCY } from "@/server/config/app";
import { getOwnerPropertyById } from "@/server/owner/properties";

import { createOwnerIndividualContractAction } from "./actions";

async function getPropertyForPage(propertyId: string) {
  try {
    return await getOwnerPropertyById(propertyId);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function NewOwnerIndividualContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getPropertyForPage(id);

  if (!property) {
    notFound();
  }

  if (property.status === "ARCHIVED") {
    return (
      <section className="max-w-3xl space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Nouveau contrat
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Logement archive
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Ce logement est archive. Aucun nouveau contrat ne peut etre cree
            pour ce logement.
          </p>
        </div>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/owner/properties/${property.id}`}
        >
          Retour au logement
        </Link>
      </section>
    );
  }

  const createAction = createOwnerIndividualContractAction.bind(
    null,
    property.id,
  );

  return (
    <section className="max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Nouveau contrat
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Contrat individuel
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Le contrat sera cree en brouillon pour {property.name}. Le
              locataire, l&apos;invitation, le paiement et la quittance seront
              ajoutes plus tard.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/owner/properties/${property.id}`}
          >
            Retour logement
          </Link>
        </div>
      </div>

      <form action={createAction} className="space-y-6">
        <div className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="startDate">
              Date de debut
            </label>
            <input
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              id="startDate"
              name="startDate"
              required
              type="date"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="endDate">
              Date de fin optionnelle
            </label>
            <input
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              id="endDate"
              name="endDate"
              type="date"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm text-muted-foreground">
              Saisissez les montants en euros. RentFlow les enregistre
              automatiquement en centimes.
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="totalRentAmountInEuros"
            >
              Loyer mensuel (€)
            </label>
            <input
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              id="totalRentAmountInEuros"
              min={1}
              name="totalRentAmountInEuros"
              placeholder="Exemple : 980 pour 980 €"
              required
              step="0.01"
              type="number"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Saisissez le montant en euros. RentFlow l&apos;enregistre
              automatiquement en centimes.
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="totalChargesAmountInEuros"
            >
              Charges mensuelles (€)
            </label>
            <input
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              id="totalChargesAmountInEuros"
              min={0}
              name="totalChargesAmountInEuros"
              placeholder="Exemple : 120"
              required
              step="0.01"
              type="number"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Saisissez le montant en euros. RentFlow l&apos;enregistre
              automatiquement en centimes.
            </p>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium"
              htmlFor="depositAmountInEuros"
            >
              Depot de garantie (€)
            </label>
            <input
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              id="depositAmountInEuros"
              min={0}
              name="depositAmountInEuros"
              placeholder="Exemple : 980"
              required
              step="0.01"
              type="number"
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Saisissez le montant en euros. RentFlow l&apos;enregistre
              automatiquement en centimes.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="currency">
              Devise
            </label>
            <input
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm uppercase outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={DEFAULT_CURRENCY}
              id="currency"
              maxLength={3}
              name="currency"
              required
              type="text"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="paymentDayOfMonth">
              Jour de paiement
            </label>
            <input
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              id="paymentDayOfMonth"
              max={28}
              min={1}
              name="paymentDayOfMonth"
              required
              step={1}
              type="number"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/owner/properties/${property.id}`}
          >
            Annuler
          </Link>
          <Button type="submit">Creer le brouillon</Button>
        </div>
      </form>
    </section>
  );
}
