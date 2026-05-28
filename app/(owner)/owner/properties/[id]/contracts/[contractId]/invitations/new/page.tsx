import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { isAppError } from "@/server/errors";
import { getOwnerContractForInvitation } from "@/server/owner/invitations";

import { createOwnerTenantInvitationAction } from "./actions";

type InvitationPageResult =
  | {
      status: "ready";
      propertyId: string;
      contractId: string;
    }
  | {
      status: "unavailable";
      message: string;
    }
  | null;

async function getInvitationPageData(
  propertyId: string,
  contractId: string,
): Promise<InvitationPageResult> {
  try {
    const { property, contract } = await getOwnerContractForInvitation(
      propertyId,
      contractId,
    );

    return {
      status: "ready",
      propertyId: property.id,
      contractId: contract.id,
    };
  } catch (error) {
    if (isAppError(error) && error.code === "CONFLICT") {
      return {
        status: "unavailable",
        message: error.message,
      };
    }

    if (isAppError(error) && error.code === "NOT_FOUND") {
      return null;
    }

    return redirectAfterRoleAccessError(error);
  }
}

export default async function NewTenantInvitationPage({
  params,
}: {
  params: Promise<{ id: string; contractId: string }>;
}) {
  const { id, contractId } = await params;
  const pageData = await getInvitationPageData(id, contractId);

  if (!pageData) {
    notFound();
  }

  if (pageData.status === "unavailable") {
    return (
      <section className="mx-auto max-w-3xl space-y-6">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Invitation locataire
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal">
            Invitation indisponible
          </h1>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            {pageData.message}
          </p>
        </div>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href={`/owner/properties/${id}/contracts/${contractId}`}
        >
          Retour contrat
        </Link>
      </section>
    );
  }

  const createAction = createOwnerTenantInvitationAction.bind(
    null,
    pageData.propertyId,
    pageData.contractId,
  );

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Invitation locataire
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-normal">
              Inviter un locataire
            </h1>
            <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
              L&apos;email est envoye via le provider mock en developpement. Une
              seule invitation active est autorisee pour un contrat individuel.
            </p>
          </div>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/owner/properties/${pageData.propertyId}/contracts/${pageData.contractId}`}
          >
            Retour contrat
          </Link>
        </div>
      </div>

      <form action={createAction} className="space-y-6">
        <div className="rounded-lg border bg-card p-5 text-card-foreground">
          <h2 className="text-lg font-semibold tracking-normal">
            Coordonnees du locataire
          </h2>
          <div className="mt-5 grid gap-4">
            <label className="space-y-2 text-sm font-medium">
              <span>Email</span>
              <input
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                name="tenantEmail"
                required
                type="email"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">
                <span>Prenom</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  name="tenantFirstName"
                  required
                />
              </label>

              <label className="space-y-2 text-sm font-medium">
                <span>Nom</span>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  name="tenantLastName"
                  required
                />
              </label>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={`/owner/properties/${pageData.propertyId}/contracts/${pageData.contractId}`}
          >
            Annuler
          </Link>
          <button className={buttonVariants()} type="submit">
            Envoyer l&apos;invitation
          </button>
        </div>
      </form>
    </section>
  );
}
