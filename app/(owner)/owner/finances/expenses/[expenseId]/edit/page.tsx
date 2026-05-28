import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import {
  getOwnerExpenseForEdition,
  listOwnerPropertiesForExpenseCreation,
} from "@/server/owner/expenses";

import {
  cancelOwnerExpenseAction,
  updateOwnerExpenseAction,
} from "../../actions";

type EditOwnerExpensePageProps = {
  params: Promise<{
    expenseId: string;
  }>;
};

async function getExpenseEditData(expenseId: string) {
  try {
    const [expenseData, properties] = await Promise.all([
      getOwnerExpenseForEdition(expenseId),
      listOwnerPropertiesForExpenseCreation(),
    ]);

    return {
      expense: expenseData.expense,
      properties,
    };
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

function formatMonthInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
}

function formatCentsAsEuroInput(amountInCents: number) {
  const euros = Math.trunc(amountInCents / 100);
  const cents = amountInCents % 100;

  if (cents === 0) {
    return String(euros);
  }

  return `${euros}.${String(cents).padStart(2, "0")}`;
}

export default async function EditOwnerExpensePage({
  params,
}: EditOwnerExpensePageProps) {
  const { expenseId } = await params;
  const { expense, properties } = await getExpenseEditData(expenseId);

  return (
    <section className="max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Finances
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Modifier une depense
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Modifiez une sortie liee a un bien. Les emprunts restent des
              sorties declaratives : RentFlow ne calcule pas automatiquement les
              mensualites, interets ou amortissement.
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

      <form action={updateOwnerExpenseAction} className="space-y-6">
        <input name="expenseId" type="hidden" value={expense.id} />

        {expense.status === "CANCELED" ? (
          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
            Cette depense est annulee et ne peut plus etre modifiee dans le MVP.
          </div>
        ) : null}

        <div className="grid gap-4 rounded-lg border bg-card p-5 text-card-foreground sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="propertyId">
              Bien concerne
            </label>
            <select
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={expense.propertyId}
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
              defaultValue={expense.label}
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
              defaultValue={formatCentsAsEuroInput(expense.amountInCents)}
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
              defaultValue={formatMonthInput(expense.dueDate)}
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
              defaultValue={expense.category}
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
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-sm font-medium" htmlFor="status">
              Statut
            </label>
            <select
              className="h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              defaultValue={
                expense.status === "PLANNED" ? "PENDING" : expense.status
              }
              id="status"
              name="status"
              required
            >
              {expense.status === "CANCELED" ? (
                <option disabled value="CANCELED">
                  Annulee
                </option>
              ) : null}
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
          <Button disabled={expense.status === "CANCELED"} type="submit">
            Enregistrer
          </Button>
        </div>
      </form>

      {expense.status !== "CANCELED" ? (
        <form
          action={cancelOwnerExpenseAction}
          className="rounded-lg border bg-card p-5 text-card-foreground"
        >
          <input name="expenseId" type="hidden" value={expense.id} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold tracking-normal">
                Annulation logique
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                La depense sera conservee, mais elle ne sera plus comptee dans
                les finances.
              </p>
            </div>
            <Button variant="destructive" type="submit">
              Annuler la depense
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
