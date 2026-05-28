import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { listOwnerPropertiesForExpenseCreation } from "@/server/owner/expenses";

import { createOwnerExpenseAction } from "../actions";

async function getExpenseFormProperties() {
  try {
    return await listOwnerPropertiesForExpenseCreation();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

export default async function NewOwnerExpensePage() {
  const properties = await getExpenseFormProperties();

  return (
    <section className="max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Finances
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Ajouter une depense
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Ajoutez une sortie liee a un bien : charge, assurance, taxe,
              travaux, remboursement d&apos;emprunt ou frais divers.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/owner/finances"
          >
            Retour finances
          </Link>
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-lg border bg-card p-5 text-sm text-muted-foreground">
          Aucun bien disponible pour saisir une depense.
        </div>
      ) : (
        <form action={createOwnerExpenseAction} className="space-y-6">
          <div className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="propertyId">
                Bien concerne
              </label>
              <select
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="propertyId"
                name="propertyId"
                required
              >
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name} - {property.city}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="label">
                Libelle facultatif
              </label>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="label"
                maxLength={140}
                name="label"
                placeholder="Laisse vide pour utiliser la categorie"
                type="text"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="amountInEuros">
                Montant en euros
              </label>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="amountInEuros"
                min="0.01"
                name="amountInEuros"
                required
                step="0.01"
                type="number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="dueDate">
                Mois
              </label>
              <input
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                id="dueDate"
                name="dueDate"
                required
                type="month"
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="category">
                Categorie
              </label>
              <select
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue="OTHER"
                id="category"
                name="category"
                required
              >
                <option value="LOAN_REPAYMENT">
                  Remboursement d&apos;emprunt
                </option>
                <option value="INSURANCE">Assurance</option>
                <option value="CONDO_FEES">Charges de copropriete</option>
                <option value="PROPERTY_TAX">Taxe fonciere</option>
                <option value="WORKS">Travaux</option>
                <option value="OTHER">Autre</option>
              </select>
              <p className="text-sm leading-6 text-muted-foreground">
                Les emprunts sont saisis comme sorties declaratives. RentFlow ne
                calcule pas automatiquement les mensualites ni les interets.
              </p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium" htmlFor="status">
                Statut
              </label>
              <select
                className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                defaultValue="PENDING"
                id="status"
                name="status"
                required
              >
                <option value="PENDING">En attente</option>
                <option value="PAID">Payee</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/finances"
            >
              Annuler
            </Link>
            <Button type="submit">Ajouter la depense</Button>
          </div>
        </form>
      )}
    </section>
  );
}
