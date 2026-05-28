import Link from "next/link";
import Image from "next/image";
import { Home, KeyRound, Mail, UserRound } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { PersonalInfoForm } from "@/components/account/personal-info-form";
import { ProfileImageRemoveConfirm } from "@/components/account/profile-image-remove-confirm";
import {
  InfoAlert,
  PageHeader,
  SectionHeader,
  SpotlightCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { requireTenantAccess } from "@/server/auth/access";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

import {
  removeTenantAccountProfileImageAction,
  updateTenantAccountPersonalInfoAction,
  updateTenantAccountProfileImageAction,
} from "./actions";

async function getTenantAccountData() {
  try {
    const { tenantProfile, user } = await requireTenantAccess();
    const ownerProfile = await prisma.ownerProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
      },
    });

    return {
      ownerProfile,
      tenantProfile,
      user,
    };
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

type TenantAccountData = Awaited<ReturnType<typeof getTenantAccountData>>;

function getDisplayName(user: TenantAccountData["user"]) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return name || user.email;
}

function getInitials(value: string) {
  const initials = value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "RF";
}

function getRoleLabel(role: TenantAccountData["user"]["role"]) {
  if (role === "OWNER") {
    return "Proprietaire";
  }

  if (role === "TENANT") {
    return "Locataire";
  }

  return "Admin";
}

function ProfileImagePreview({
  displayName,
  imageUrl,
}: {
  displayName: string;
  imageUrl: string | null;
}) {
  if (imageUrl) {
    return (
      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border border-primary/55 bg-primary/12 shadow-sm shadow-primary/10">
        <Image
          alt={`Photo de profil de ${displayName}`}
          className="object-cover"
          fill
          sizes="80px"
          src={imageUrl}
        />
      </div>
    );
  }

  return (
    <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-primary/55 bg-primary/22 text-2xl font-semibold text-primary shadow-sm shadow-primary/10">
      {getInitials(displayName)}
    </div>
  );
}

export default async function TenantAccountPage() {
  const { ownerProfile, tenantProfile, user } = await getTenantAccountData();
  const displayName = getDisplayName(user);

  return (
    <section className="space-y-8">
      <PageHeader
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/tenant"
            >
              Retour espace locataire
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/support"
            >
              Contacter le support
            </Link>
          </>
        }
        description="Consultez vos informations de compte et vos espaces disponibles."
        eyebrow="Compte"
        title="Mon compte"
      />

      <section className="space-y-4">
        <SectionHeader
          description="Les informations principales rattachees a votre espace locataire."
          title="Compte locataire"
        />
        <SpotlightCard tone="info">
          <article className="rounded-xl border border-ring/45 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 gap-4">
                <ProfileImagePreview
                  displayName={displayName}
                  imageUrl={user.profileImageUrl}
                />
                <div className="min-w-0 space-y-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold tracking-normal text-foreground">
                        {displayName}
                      </h2>
                      <StatusBadge tone="success">
                        Espace locataire disponible
                      </StatusBadge>
                    </div>
                    <p className="mt-2 break-all text-sm leading-6 text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="info">
                      Role principal : {getRoleLabel(user.role)}
                    </StatusBadge>
                    <StatusBadge tone="muted">
                      Profil locataire : {tenantProfile.id}
                    </StatusBadge>
                  </div>
                </div>
              </div>
              <Link className={buttonVariants({ size: "sm" })} href="/tenant">
                Ouvrir l&apos;espace locataire
              </Link>
            </div>
          </article>
        </SpotlightCard>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Passez d'un espace a l'autre avec le meme compte."
          title="Changer d'espace"
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <SpotlightCard tone="success">
            <article className="h-full rounded-xl border border-primary/55 bg-primary/12 p-5 text-card-foreground shadow-sm shadow-black/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold tracking-normal text-foreground">
                      Espace locataire
                    </h2>
                    <StatusBadge tone="success">Disponible</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Suivez votre logement, vos paiements, vos quittances et les
                    invitations recues.
                  </p>
                </div>
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href="/tenant"
                >
                  Ouvrir
                </Link>
              </div>
            </article>
          </SpotlightCard>

          <SpotlightCard tone={ownerProfile ? "info" : "default"}>
            <article className="h-full rounded-xl border border-ring/45 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold tracking-normal text-foreground">
                      Espace proprietaire
                    </h2>
                    <StatusBadge tone={ownerProfile ? "info" : "muted"}>
                      {ownerProfile ? "Disponible" : "Non active"}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {ownerProfile
                      ? "Accedez a votre gestion proprietaire avec le meme compte."
                      : "Vous pourrez creer un espace proprietaire depuis le parcours proprietaire."}
                  </p>
                </div>
                {ownerProfile ? (
                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href="/owner"
                  >
                    Ouvrir l&apos;espace proprietaire
                  </Link>
                ) : null}
              </div>
            </article>
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Photo de profil, identifiants et informations facultatives de votre compte."
          title="Profil et securite"
        />
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="h-full rounded-xl border border-primary/45 bg-primary/10 p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl hover:shadow-black/15">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(280px,0.8fr)]">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/45 bg-primary/18 text-primary">
                  <UserRound className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="min-w-0 truncate font-semibold tracking-normal text-foreground">
                    Profil utilisateur
                  </h2>
                  <p className="mt-2 min-w-0 break-all text-sm leading-6 text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {displayName}
                    </span>
                    <span className="mx-2 text-muted-foreground/70">-</span>
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="grid min-w-0 gap-3">
                <div className="min-w-0 rounded-lg border border-primary/35 bg-background/40 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Photo de profil
                    </p>
                    <StatusBadge
                      tone={user.profileImageUrl ? "success" : "muted"}
                    >
                      {user.profileImageUrl ? "Configuree" : "Non configuree"}
                    </StatusBadge>
                  </div>
                  <form
                    action={updateTenantAccountProfileImageAction}
                    className="mt-3 space-y-2"
                  >
                    <label className="grid min-w-0 gap-2 text-xs leading-5 text-muted-foreground">
                      <span>
                        {user.profileImageUrl
                          ? "Remplacer la photo"
                          : "Ajouter une photo"}
                      </span>
                      <input
                        accept="image/png,image/jpeg,image/webp"
                        className="min-h-10 w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground file:mr-2 file:rounded-md file:border-0 file:bg-primary file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-primary-foreground"
                        name="image"
                        required
                        type="file"
                      />
                    </label>
                    <p className="text-xs leading-5 text-muted-foreground">
                      JPG, PNG, WebP. 5 Mo max.
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        className={buttonVariants({ size: "sm" })}
                        type="submit"
                      >
                        {user.profileImageUrl
                          ? "Remplacer la photo"
                          : "Ajouter une photo"}
                      </button>
                      {user.profileImageUrl ? (
                        <ProfileImageRemoveConfirm
                          action={removeTenantAccountProfileImageAction}
                        />
                      ) : null}
                    </div>
                  </form>
                </div>

                <div className="rounded-lg border border-primary/35 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    Espaces du compte
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge tone="success">Locataire</StatusBadge>
                    <StatusBadge tone={ownerProfile ? "info" : "muted"}>
                      Proprietaire
                    </StatusBadge>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <SpotlightCard tone="info">
            <article className="h-full rounded-xl border border-ring/45 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-ring/45 bg-ring/18 text-ring">
                  <KeyRound className="size-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold tracking-normal text-foreground">
                      Identifiants
                    </h2>
                    <StatusBadge tone="info">Auth existante</StatusBadge>
                  </div>
                  <p className="mt-2 break-all text-sm leading-6 text-muted-foreground">
                    {user.email}
                  </p>
                  <InfoAlert className="mt-4" title="Email et mot de passe">
                    <p>
                      Vos identifiants sont sécurisés par l&apos;espace
                      d&apos;authentification. Vous pouvez y modifier votre
                      email, changer votre mot de passe et gérer la récupération
                      de compte.
                    </p>
                    <p className="mt-2">
                      La modification de l&apos;email peut nécessiter une
                      vérification.
                    </p>
                    <Link
                      className={buttonVariants({
                        variant: "outline",
                        size: "sm",
                      })}
                      href="/account/security"
                    >
                      Gérer mes identifiants
                    </Link>
                  </InfoAlert>
                </div>
              </div>
            </article>
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader title="Informations personnelles" />
        <PersonalInfoForm
          action={updateTenantAccountPersonalInfoAction}
          user={user}
        />
      </section>

      <section className="space-y-4">
        <SectionHeader title="Aide" />
        <SpotlightCard tone="default">
          <InfoAlert title="Besoin d'aide ?" tone="info">
            <p>
              Une question sur votre logement, votre paiement ou votre quittance
              ? Consultez votre espace locataire ou contactez votre
              proprietaire.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href="/tenant"
              >
                <Home className="size-4" />
                Espace locataire
              </Link>
              <span className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                <Mail className="size-4" />
                Contactez votre proprietaire depuis vos echanges habituels
              </span>
            </div>
          </InfoAlert>
        </SpotlightCard>
      </section>
    </section>
  );
}
