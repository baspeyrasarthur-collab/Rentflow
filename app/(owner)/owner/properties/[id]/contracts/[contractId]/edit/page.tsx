import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { InfoAlert } from "@/components/ui/rentflow";
import { cn } from "@/lib/utils";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_CURRENCY } from "@/server/config/app";
import { formatCentsForEuroInput } from "@/server/owner/contract-form";
import { getOwnerPropertyContractById } from "@/server/owner/contracts";

import { updateOwnerIndividualContractAction } from "./actions";

function formatDateInputValue(date: Date | null) {
  if (!date) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

async function getContractForPage(propertyId: string, contractId: string) {
  try {
    return await getOwnerPropertyContractById(propertyId, contractId);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OwnerContractEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; contractId: string }>;
  searchParams?: Promise<{ focus?: string | string[] }>;
}) {
  const { id, contractId } = await params;
  const resolvedSearchParams = await searchParams;
  const focus = getSearchParamValue(resolvedSearchParams?.focus);
  const isRequiredFieldsFocus = focus === "required-fields";
  const contract = await getContractForPage(id, contractId);

  if (!contract) {
    notFound();
  }

  const updateAction = updateOwnerIndividualContractAction.bind(
    null,
    contract.property.id,
    contract.id,
  );
  const contractDetailPath = `/owner/properties/${contract.property.id}/contracts/${contract.id}`;

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Edition contrat
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Modifier le contrat
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Seuls les contrats brouillon peuvent etre modifies. Le statut, le
              logement, le proprietaire et le type de contrat ne sont pas
              modifiables ici.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={contractDetailPath}
          >
            Retour contrat
          </Link>
        </div>
      </div>

      {isRequiredFieldsFocus ? (
        <InfoAlert title="Action ciblee" tone="warning">
          Completez les informations necessaires du contrat avant de poursuivre
          le parcours locataire.
        </InfoAlert>
      ) : null}

      {contract.status !== "DRAFT" ? (
        <div className="rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-lg font-semibold tracking-normal">
            Modification indisponible
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ce contrat n&apos;est plus en brouillon. Pour cette phase, seuls les
            contrats au statut DRAFT peuvent etre modifies.
          </p>
        </div>
      ) : (
        <form action={updateAction} className="space-y-6">
          <div
            className={cn(
              "rounded-lg border bg-card p-5 text-card-foreground transition-all duration-300",
              isRequiredFieldsFocus
                ? "border-chart-4/75 bg-chart-4/10 shadow-lg shadow-chart-4/10"
                : "",
            )}
            id="required-fields"
          >
            <h2 className="text-lg font-semibold tracking-normal">
              Informations du contrat
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Saisissez les montants en euros. RentFlow les enregistre
              automatiquement en centimes.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <span>Date de debut</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue={formatDateInputValue(contract.startDate)}
                  name="startDate"
                  required
                  type="date"
                />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Date de fin</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue={formatDateInputValue(contract.endDate)}
                  name="endDate"
                  type="date"
                />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Loyer mensuel (€)</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue={formatCentsForEuroInput(
                    contract.totalRentAmountInCents,
                  )}
                  min="1"
                  name="totalRentAmountInEuros"
                  placeholder="Exemple : 980 pour 980 €"
                  required
                  step="0.01"
                  type="number"
                />
                <span className="block text-xs leading-5 text-muted-foreground">
                  Saisissez le montant en euros. RentFlow l&apos;enregistre
                  automatiquement en centimes.
                </span>
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Charges mensuelles (€)</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue={formatCentsForEuroInput(
                    contract.totalChargesAmountInCents,
                  )}
                  min="0"
                  name="totalChargesAmountInEuros"
                  placeholder="Exemple : 120"
                  required
                  step="0.01"
                  type="number"
                />
                <span className="block text-xs leading-5 text-muted-foreground">
                  Saisissez le montant en euros. RentFlow l&apos;enregistre
                  automatiquement en centimes.
                </span>
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Depot de garantie (€)</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue={formatCentsForEuroInput(
                    contract.depositAmountInCents,
                  )}
                  min="0"
                  name="depositAmountInEuros"
                  placeholder="Exemple : 980"
                  required
                  step="0.01"
                  type="number"
                />
                <span className="block text-xs leading-5 text-muted-foreground">
                  Saisissez le montant en euros. RentFlow l&apos;enregistre
                  automatiquement en centimes.
                </span>
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Devise</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue={contract.currency || DEFAULT_CURRENCY}
                  maxLength={3}
                  minLength={3}
                  name="currency"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Jour de paiement</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  defaultValue={contract.paymentDayOfMonth}
                  max="28"
                  min="1"
                  name="paymentDayOfMonth"
                  required
                  step="1"
                  type="number"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={contractDetailPath}
            >
              Annuler
            </Link>
            <button className={buttonVariants()} type="submit">
              Enregistrer
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
