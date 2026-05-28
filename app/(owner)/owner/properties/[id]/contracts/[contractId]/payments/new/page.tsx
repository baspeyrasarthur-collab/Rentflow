import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { getOwnerPropertyContractById } from "@/server/owner/contracts";

import { createOwnerExpectedRentPaymentAction } from "./actions";

async function getContractForPage(propertyId: string, contractId: string) {
  try {
    return await getOwnerPropertyContractById(propertyId, contractId);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

function getTenantLabel(contractTenant: {
  invitedEmail: string | null;
  invitedFirstName: string | null;
  invitedLastName: string | null;
  roomLabel: string | null;
}) {
  const name = [contractTenant.invitedFirstName, contractTenant.invitedLastName]
    .filter(Boolean)
    .join(" ");
  const label = name || contractTenant.invitedEmail || "Locataire rattache";

  return contractTenant.roomLabel
    ? `${label} - ${contractTenant.roomLabel}`
    : label;
}

export default async function NewOwnerExpectedPaymentPage({
  params,
}: {
  params: Promise<{ id: string; contractId: string }>;
}) {
  const { id, contractId } = await params;
  const contract = await getContractForPage(id, contractId);

  if (!contract) {
    notFound();
  }

  const activeContractTenants = contract.contractTenants.filter(
    (contractTenant) =>
      contractTenant.status === "ACTIVE" && contractTenant.tenantProfileId,
  );
  const contractDetailPath = `/owner/properties/${contract.property.id}/contracts/${contract.id}`;
  const action = createOwnerExpectedRentPaymentAction.bind(
    null,
    contract.property.id,
    contract.id,
  );

  return (
    <section className="max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Paiement attendu
        </p>
        <div>
          <h1 className="text-3xl font-semibold tracking-normal">
            Creer un paiement attendu
          </h1>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            Ce paiement attendu sert au suivi de paiement externe ou futur
            paiement via RentFlow. Aucun prelevement ne sera declenche. Aucune
            commission ne sera creee sur ce paiement planifie.
          </p>
        </div>
      </div>

      {activeContractTenants.length === 0 ? (
        <div className="rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-lg font-semibold">Aucun locataire actif</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Un paiement attendu peut etre cree seulement pour un locataire
            rattache et actif.
          </p>
          <Link
            className={buttonVariants({
              variant: "outline",
              className: "mt-4",
            })}
            href={contractDetailPath}
          >
            Retour au contrat
          </Link>
        </div>
      ) : (
        <form action={action} className="space-y-6 rounded-lg border p-6">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="contractTenantId">
              Locataire rattache
            </label>
            <select
              className="min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              id="contractTenantId"
              name="contractTenantId"
              required
            >
              {activeContractTenants.map((contractTenant) => {
                const defaultAmount =
                  contractTenant.rentShareAmountInCents +
                  contractTenant.chargesShareAmountInCents;

                return (
                  <option key={contractTenant.id} value={contractTenant.id}>
                    {getTenantLabel(contractTenant)} -{" "}
                    {formatMoney(defaultAmount, contractTenant.currency)}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="dueDate">
                Date echeance
              </label>
              <input
                className="min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                id="dueDate"
                name="dueDate"
                required
                type="date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="currency">
                Devise
              </label>
              <input
                className="min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                id="currency"
                maxLength={3}
                name="currency"
                placeholder={contract.currency}
                type="text"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="amountInCents">
              Montant optionnel en centimes
            </label>
            <input
              className="min-h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              id="amountInCents"
              min={0}
              name="amountInCents"
              placeholder="Laisser vide pour loyer + charges"
              step={1}
              type="number"
            />
            <p className="text-sm text-muted-foreground">
              Si le champ reste vide, RentFlow utilise la quote-part loyer +
              charges du locataire.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button className={buttonVariants()} type="submit">
              Creer le paiement attendu
            </button>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href={contractDetailPath}
            >
              Retour au contrat
            </Link>
          </div>
        </form>
      )}
    </section>
  );
}
