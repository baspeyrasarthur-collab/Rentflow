import { auth } from "@clerk/nextjs/server";
import Link from "next/link";

import { acceptTenantInvitationAction } from "@/app/invitations/accept/actions";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { DEFAULT_LOCALE } from "@/server/config/app";
import { prisma } from "@/server/db/prisma";
import {
  canAcceptInvitation,
  canUserAcceptTenantInvitation,
  doesConnectedEmailMatchInvitationEmail,
  getInvitationByRawToken,
} from "@/server/invitations/acceptance";

export const dynamic = "force-dynamic";

type AcceptInvitationPageProps = {
  searchParams: Promise<{
    token?: string | string[];
  }>;
};

function getRawToken(token: string | string[] | undefined) {
  return Array.isArray(token) ? token[0] : token;
}

function buildAuthHref(path: "/sign-in" | "/sign-up", returnPath: string) {
  const params = new URLSearchParams({
    redirect_url: returnPath,
  });

  return `${path}?${params.toString()}`;
}

function buildOnboardingHref(returnPath: string) {
  const params = new URLSearchParams({
    returnTo: returnPath,
  });

  return `/onboarding?${params.toString()}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatOptionalDate(date: Date | null) {
  return date ? formatDate(date) : "Non renseignee";
}

function getOwnerDisplayName(
  invitation: Awaited<ReturnType<typeof getInvitationByRawToken>>,
) {
  const ownerUser = invitation?.rentalContract.ownerProfile.user;

  if (!ownerUser) {
    return "Proprietaire";
  }

  const name = [ownerUser.firstName, ownerUser.lastName]
    .filter(Boolean)
    .join(" ");

  return name || ownerUser.email;
}

function PageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Invitation RentFlow
          </p>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground">
            {title}
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            {description}
          </p>
        </div>
        {children}
      </section>
    </main>
  );
}

function GenericInvalidInvitation() {
  return (
    <PageShell
      title="Invitation invalide"
      description="Invitation invalide ou introuvable."
    />
  );
}

export default async function AcceptInvitationPage({
  searchParams,
}: AcceptInvitationPageProps) {
  const resolvedSearchParams = await searchParams;
  const rawToken = getRawToken(resolvedSearchParams.token);
  const invitation = await getInvitationByRawToken(rawToken);

  if (!invitation) {
    return <GenericInvalidInvitation />;
  }

  if (!canAcceptInvitation(invitation)) {
    return (
      <PageShell
        title="Invitation non valide"
        description="Cette invitation n'est plus valide."
      />
    );
  }

  const returnPath = `/invitations/accept?${new URLSearchParams({
    token: rawToken ?? "",
  }).toString()}`;
  const { userId } = await auth();

  if (!userId) {
    return (
      <PageShell
        title="Connexion requise"
        description="Connectez-vous ou creez un compte locataire RentFlow pour continuer."
      >
        <div className="flex flex-wrap gap-3">
          <Link
            className={buttonVariants()}
            href={buildAuthHref("/sign-in", returnPath)}
          >
            Se connecter
          </Link>
          <Link
            className={buttonVariants({ variant: "outline" })}
            href={buildAuthHref("/sign-up", returnPath)}
          >
            Creer un compte
          </Link>
        </div>
      </PageShell>
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      clerkUserId: userId,
    },
    select: {
      email: true,
      role: true,
      disabledAt: true,
      tenantProfile: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    return (
      <PageShell
        title="Compte a initialiser"
        description="Votre compte RentFlow doit etre initialise avant de pouvoir continuer."
      >
        <Link
          className={buttonVariants()}
          href={buildOnboardingHref(returnPath)}
        >
          Initialiser mon compte
        </Link>
      </PageShell>
    );
  }

  if (user.disabledAt) {
    return (
      <PageShell
        title="Compte indisponible"
        description="Ce compte RentFlow ne peut pas accepter cette invitation."
      />
    );
  }

  if (!canUserAcceptTenantInvitation(user.role)) {
    return (
      <PageShell
        title="Compte non eligible"
        description="Les comptes admin ne peuvent pas accepter une invitation locataire."
      />
    );
  }

  if (
    !doesConnectedEmailMatchInvitationEmail(user.email, invitation.tenantEmail)
  ) {
    return (
      <PageShell
        title="Email different"
        description="L'email du compte connecte ne correspond pas a cette invitation."
      />
    );
  }

  return (
    <PageShell
      title="Invitation prete"
      description={
        user.tenantProfile
          ? "Vous pouvez accepter cette invitation avec ce compte. Vous retrouverez ensuite votre espace locataire dans RentFlow."
          : "Vous pouvez accepter cette invitation avec le meme compte. RentFlow ajoutera un espace locataire a votre profil, sans modifier votre espace proprietaire si vous en avez un."
      }
    >
      <div className="grid gap-3 rounded-lg border bg-card p-4 text-sm text-card-foreground">
        <div>
          <p className="text-muted-foreground">Logement</p>
          <p className="font-medium">
            {invitation.rentalContract.property.name} -{" "}
            {invitation.rentalContract.property.city}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Proprietaire</p>
          <p className="font-medium">{getOwnerDisplayName(invitation)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Email invite</p>
          <p className="font-medium">{invitation.tenantEmail}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Statut invitation</p>
          <p className="font-medium">{invitation.status}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Expiration</p>
          <p className="font-medium">{formatDate(invitation.expiresAt)}</p>
        </div>
      </div>
      <div className="grid gap-3 rounded-lg border bg-card p-4 text-sm text-card-foreground">
        <p className="font-medium text-foreground">
          Verifiez ces informations avant d&apos;accepter l&apos;invitation.
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Type de contrat</dt>
            <dd className="font-medium">
              {invitation.rentalContract.contractType}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Loyer</dt>
            <dd className="font-medium">
              {formatMoney(
                invitation.rentalContract.totalRentAmountInCents,
                invitation.rentalContract.currency,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Charges</dt>
            <dd className="font-medium">
              {formatMoney(
                invitation.rentalContract.totalChargesAmountInCents,
                invitation.rentalContract.currency,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Total mensuel</dt>
            <dd className="font-medium">
              {formatMoney(
                invitation.rentalContract.totalRentAmountInCents +
                  invitation.rentalContract.totalChargesAmountInCents,
                invitation.rentalContract.currency,
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Date de debut</dt>
            <dd className="font-medium">
              {formatDate(invitation.rentalContract.startDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Date de fin</dt>
            <dd className="font-medium">
              {formatOptionalDate(invitation.rentalContract.endDate)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Jour de paiement</dt>
            <dd className="font-medium">
              Jour {invitation.rentalContract.paymentDayOfMonth}
            </dd>
          </div>
        </dl>
      </div>
      <form action={acceptTenantInvitationAction} className="space-y-4">
        <input name="token" type="hidden" value={rawToken ?? ""} />
        <label className="flex items-start gap-2 rounded-lg border bg-card p-3 text-sm leading-6 text-muted-foreground">
          <input
            className="mt-1 size-4 shrink-0 accent-primary"
            name="confirmAccept"
            required
            type="checkbox"
          />
          <span>
            Je confirme vouloir rejoindre ce logement avec mon compte locataire.
          </span>
        </label>
        <button className={buttonVariants()} type="submit">
          Accepter l&apos;invitation
        </button>
      </form>
    </PageShell>
  );
}
