import Link from "next/link";
import { Building2, FileText, UserPlus, WalletCards } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  EmptyState,
  InfoAlert,
  OwnerQuickActions,
  PageHeader,
  SectionHeader,
  SpotlightCard,
  StatCard,
} from "@/components/ui/rentflow";
import { formatMoney } from "@/lib/money";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { getOwnerPaymentCreateOptions } from "@/server/owner/payments";

import { createOwnerCentralExpectedRentPaymentAction } from "../actions";

async function getPaymentCreateOptionsForPage() {
  try {
    return await getOwnerPaymentCreateOptions();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

function getTenantLabel(contractTenant: {
  invitedEmail: string | null;
  invitedFirstName: string | null;
  invitedLastName: string | null;
  roomLabel: string | null;
  tenantProfile: {
    user: {
      firstName: string | null;
      lastName: string | null;
      email: string;
    };
  } | null;
}) {
  const tenantName = contractTenant.tenantProfile
    ? [
        contractTenant.tenantProfile.user.firstName,
        contractTenant.tenantProfile.user.lastName,
      ]
        .filter(Boolean)
        .join(" ")
    : "";
  const invitedName = [
    contractTenant.invitedFirstName,
    contractTenant.invitedLastName,
  ]
    .filter(Boolean)
    .join(" ");
  const label =
    tenantName ||
    invitedName ||
    contractTenant.tenantProfile?.user.email ||
    contractTenant.invitedEmail ||
    "Locataire actif";

  return contractTenant.roomLabel
    ? `${label} - ${contractTenant.roomLabel}`
    : label;
}

function getContractLabel(contract: {
  id: string;
  property: {
    name: string;
    city: string;
  };
  status: string;
  totalRentAmountInCents: number;
  totalChargesAmountInCents: number;
  currency: string;
  paymentDayOfMonth: number;
}) {
  const amount =
    contract.totalRentAmountInCents + contract.totalChargesAmountInCents;

  return `${contract.property.name} - ${contract.property.city} - ${contract.status} - ${formatMoney(amount, contract.currency)} - jour ${contract.paymentDayOfMonth}`;
}

export default async function NewOwnerPaymentPage() {
  const options = await getPaymentCreateOptionsForPage();
  const hasProperties = options.properties.length > 0;
  const hasContracts = options.contracts.length > 0;
  const hasActiveTenants = options.contractTenants.length > 0;
  const canCreatePayment = hasProperties && hasContracts && hasActiveTenants;

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Paiements"
        title="Ajouter un loyer a encaisser"
        description="Creez un paiement attendu pour suivre un loyer paye hors RentFlow."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/payments"
            >
              Retour paiements
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/contracts"
            >
              Voir les contrats
            </Link>
          </>
        }
      />

      <SpotlightCard tone="info">
        <InfoAlert title="Paiement externe suivi">
          Ce paiement est un suivi externe : RentFlow ne preleve pas le
          locataire et ne touche pas les fonds. Le proprietaire confirmera la
          reception reelle.
        </InfoAlert>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="Verifier les rattachements"
          description="Un paiement attendu doit etre rattache a un logement, un contrat et un locataire actif."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <SpotlightCard tone={hasProperties ? "success" : "warning"}>
            <StatCard
              className="h-full border-primary/55 bg-primary/16"
              icon={<Building2 className="size-5" />}
              label="Logements disponibles"
              value={options.properties.length}
            />
          </SpotlightCard>
          <SpotlightCard tone={hasContracts ? "info" : "warning"}>
            <StatCard
              className="h-full border-ring/55 bg-ring/16"
              icon={<FileText className="size-5" />}
              label="Contrats disponibles"
              value={options.contracts.length}
            />
          </SpotlightCard>
          <SpotlightCard tone={hasActiveTenants ? "success" : "warning"}>
            <StatCard
              className="h-full border-chart-4/55 bg-chart-4/16"
              icon={<UserPlus className="size-5" />}
              label="Locataires actifs"
              value={options.contractTenants.length}
            />
          </SpotlightCard>
        </div>
      </section>

      {!hasProperties ? (
        <EmptyState
          title="Aucun logement disponible"
          description="Ajoutez un premier logement avant de creer un loyer a encaisser."
          action={
            <Link className={buttonVariants()} href="/owner/properties/new">
              Ajouter un logement
            </Link>
          }
        />
      ) : !hasContracts ? (
        <EmptyState
          title="Aucun contrat disponible"
          description="Creez un contrat depuis le logement concerne avant de suivre un loyer."
          action={
            <Link className={buttonVariants()} href="/owner/properties">
              Voir les logements
            </Link>
          }
        />
      ) : !hasActiveTenants ? (
        <SpotlightCard tone="warning">
          <InfoAlert title="Aucun locataire actif disponible" tone="warning">
            Aucun locataire actif disponible. Invitez d&apos;abord un locataire
            depuis un contrat avant de creer un loyer a encaisser.
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href="/owner/contracts"
              >
                Voir les contrats
              </Link>
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href="/owner/tenants"
              >
                Mes locataires
              </Link>
            </div>
          </InfoAlert>
        </SpotlightCard>
      ) : null}

      {canCreatePayment ? (
        <section className="space-y-4">
          <SectionHeader
            title="Nouveau loyer a encaisser"
            description="Les montants sont saisis en euros puis convertis en centimes cote serveur."
          />

          <SpotlightCard tone="success">
            <form
              action={createOwnerCentralExpectedRentPaymentAction}
              className="space-y-6 rounded-xl border border-primary/45 bg-primary/10 p-6 text-card-foreground shadow-sm shadow-black/10"
            >
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="propertyId">
                    Logement
                  </label>
                  <select
                    className="min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    id="propertyId"
                    name="propertyId"
                    required
                  >
                    {options.properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name} - {property.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="rentalContractId"
                  >
                    Contrat
                  </label>
                  <select
                    className="min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    id="rentalContractId"
                    name="rentalContractId"
                    required
                  >
                    {options.contracts.map((contract) => (
                      <option key={contract.id} value={contract.id}>
                        {getContractLabel(contract)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Le serveur verifiera que le contrat correspond bien au
                    logement choisi.
                  </p>
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="contractTenantId"
                  >
                    Locataire / rattachement
                  </label>
                  <select
                    className="min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    id="contractTenantId"
                    name="contractTenantId"
                    required
                  >
                    {options.contractTenants.map((contractTenant) => {
                      const defaultAmount =
                        contractTenant.rentShareAmountInCents +
                        contractTenant.chargesShareAmountInCents;

                      return (
                        <option
                          key={contractTenant.id}
                          value={contractTenant.id}
                        >
                          {getTenantLabel(contractTenant)} -{" "}
                          {contractTenant.rentalContract.property.name} -{" "}
                          {formatMoney(defaultAmount, contractTenant.currency)}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="amountInEuros"
                  >
                    Montant en euros
                  </label>
                  <input
                    className="min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    id="amountInEuros"
                    inputMode="decimal"
                    name="amountInEuros"
                    placeholder="950,00"
                    required
                    type="text"
                  />
                  <p className="text-xs leading-5 text-muted-foreground">
                    Exemple : 950 ou 950,00. Aucun float n&apos;est stocke.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="dueDate">
                    Echeance
                  </label>
                  <input
                    className="min-h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    id="dueDate"
                    name="dueDate"
                    required
                    type="date"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-border/80 pt-5 sm:flex-row">
                <button className={buttonVariants()} type="submit">
                  <WalletCards className="size-4" />
                  Creer le paiement attendu
                </button>
                <Link
                  className={buttonVariants({ variant: "outline" })}
                  href="/owner/payments"
                >
                  Annuler
                </Link>
              </div>
            </form>
          </SpotlightCard>
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          title="Actions rapides"
          description="Raccourcis vers les prochaines actions du parcours owner."
        />
        <OwnerQuickActions />
      </section>
    </section>
  );
}
