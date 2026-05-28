import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { listOwnerRecurringExpenseRules } from "@/server/owner/recurring-expenses";

import { disableOwnerRecurringExpenseRuleAction } from "./actions";

const expenseCategoryLabels: Record<string, string> = {
  LOAN_REPAYMENT: "Remboursement d'emprunt",
  INSURANCE: "Assurance",
  CONDO_FEES: "Charges de copropriete",
  PROPERTY_TAX: "Taxe fonciere",
  WORKS: "Travaux",
  OTHER: "Autre",
};

const recurringExpenseRuleStatusLabels: Record<string, string> = {
  ACTIVE: "Active",
  DISABLED: "Desactivee",
};

async function getRecurringExpenseRulesForPage() {
  try {
    return await listOwnerRecurringExpenseRules();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function OwnerRecurringExpensesPage() {
  const recurringExpenseRules = await getRecurringExpenseRulesForPage();

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Finances
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Depenses recurrentes
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              Consultez les sorties mensuelles configurees pour vos biens. Les
              occurrences seront generees separement.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/finances"
            >
              Retour finances
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner/finances/recurring-expenses/new"
            >
              Ajouter une depense recurrente
            </Link>
          </div>
        </div>
      </div>

      {recurringExpenseRules.length === 0 ? (
        <div className="rounded-lg border bg-card p-5 text-card-foreground">
          <p className="text-sm text-muted-foreground">
            Aucune depense recurrente configuree pour vos biens.
          </p>
          <Link
            className={buttonVariants({
              variant: "outline",
              className: "mt-4",
            })}
            href="/owner/finances/recurring-expenses/new"
          >
            Ajouter une depense recurrente
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {recurringExpenseRules.map((rule) => (
            <article
              className="space-y-4 rounded-lg border bg-card p-5 text-card-foreground"
              key={rule.id}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {rule.property.name} - {rule.property.city}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-normal">
                    {rule.label}
                  </h2>
                </div>
                <p className="text-sm font-medium">
                  {recurringExpenseRuleStatusLabels[rule.status] ?? rule.status}
                </p>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Montant</p>
                  <p className="mt-1 font-medium">
                    {formatMoney(rule.amountInCents, rule.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Categorie</p>
                  <p className="mt-1 font-medium">
                    {expenseCategoryLabels[rule.category] ?? rule.category}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jour du mois</p>
                  <p className="mt-1 font-medium">{rule.dayOfMonth}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mois de debut</p>
                  <p className="mt-1 font-medium">
                    {formatMonth(rule.startMonth)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Mois de fin</p>
                  <p className="mt-1 font-medium">
                    {rule.endMonth ? formatMonth(rule.endMonth) : "Non defini"}
                  </p>
                </div>
              </div>

              <p className="text-sm leading-6 text-muted-foreground">
                Cette regle ne genere pas automatiquement de depense tant que la
                generation explicite n&apos;est pas ajoutee. Les anciennes
                occurrences conservees ne seront pas supprimees.
              </p>

              {rule.status === "ACTIVE" ? (
                <form action={disableOwnerRecurringExpenseRuleAction}>
                  <input
                    name="recurringExpenseRuleId"
                    type="hidden"
                    value={rule.id}
                  />
                  <Button variant="destructive" type="submit">
                    Desactiver
                  </Button>
                </form>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
