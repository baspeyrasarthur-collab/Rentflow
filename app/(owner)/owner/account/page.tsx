import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";
import {
  Building2,
  KeyRound,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { PersonalInfoForm } from "@/components/account/personal-info-form";
import { ProfileImageRemoveConfirm } from "@/components/account/profile-image-remove-confirm";
import {
  InfoAlert,
  OwnerQuickActions,
  PageHeader,
  ScrollToFocus,
  SectionHeader,
  SpotlightCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { cn } from "@/lib/utils";
import { requireOwnerAccess } from "@/server/auth/access";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";
import { prisma } from "@/server/db/prisma";

import {
  createTenantProfileFromOwnerAccountAction,
  removeOwnerAccountProfileImageAction,
  updateOwnerAccountPersonalInfoAction,
  updateOwnerAccountProfileImageAction,
} from "./actions";

type OwnerAccountPageProps = {
  searchParams?: Promise<{
    focus?: string | string[];
  }>;
};

async function getOwnerAccountData() {
  try {
    const { ownerProfile: accessOwnerProfile, user } =
      await requireOwnerAccess();
    const [ownerProfile, tenantProfile] = await Promise.all([
      prisma.ownerProfile.findUnique({
        where: { userId: user.id },
        select: {
          billingName: true,
          plan: true,
        },
      }),
      prisma.tenantProfile.findUnique({
        where: { userId: user.id },
        select: {
          id: true,
        },
      }),
    ]);

    return {
      ownerProfile: ownerProfile ?? {
        billingName: null,
        plan: accessOwnerProfile.plan,
      },
      tenantProfile,
      user,
    };
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }
}

type OwnerAccountData = Awaited<ReturnType<typeof getOwnerAccountData>>;

function getDisplayName(user: OwnerAccountData["user"]) {
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

function getRoleLabel(role: OwnerAccountData["user"]["role"]) {
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

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function AccountSummaryCard({
  className,
  hint,
  icon,
  label,
  value,
}: {
  className?: string;
  hint: string;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <article
      className={cn(
        "h-full min-w-0 rounded-xl border bg-card p-5 text-card-foreground shadow-sm shadow-black/10 ring-1 ring-white/[0.02] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg hover:shadow-black/15",
        className,
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm leading-5 text-muted-foreground">{label}</p>
          <p className="mt-2 truncate text-xl font-semibold leading-tight tracking-normal text-foreground">
            {value}
          </p>
          <p className="mt-2 truncate text-sm leading-5 text-muted-foreground">
            {hint}
          </p>
        </div>
        <div className="shrink-0 rounded-xl border border-primary/55 bg-primary/24 p-2.5 text-primary shadow-sm shadow-primary/20">
          {icon}
        </div>
      </div>
    </article>
  );
}

export default async function OwnerAccountPage({
  searchParams,
}: OwnerAccountPageProps = {}) {
  const resolvedSearchParams = await searchParams;
  const isPersonalInfoFocused =
    getSearchParamValue(resolvedSearchParams?.focus) === "personal-info";
  const { ownerProfile, tenantProfile, user } = await getOwnerAccountData();
  const displayName = getDisplayName(user);
  const currentPlan = ownerProfile?.plan ?? "Non renseigne";
  const roleLabel = getRoleLabel(user.role);

  return (
    <section className="space-y-8">
      <ScrollToFocus />
      <PageHeader
        eyebrow="Compte"
        title="Mon compte"
        description="Consultez vos informations de compte, vos espaces disponibles et votre plan RentFlow."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/owner"
            >
              Tableau de bord
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/support"
            >
              Contacter le support
            </Link>
            <Link className={buttonVariants()} href="/owner/upgrade">
              Voir les plans
            </Link>
          </>
        }
      />

      <section className="space-y-4">
        <SectionHeader
          title="Resume du compte"
          description="Les informations disponibles aujourd'hui dans RentFlow."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <SpotlightCard tone="success">
            <AccountSummaryCard
              className="h-full border-primary/70 bg-primary/24 shadow-primary/15"
              icon={<UserRound className="size-5" />}
              label="Nom affiche"
              value={displayName}
              hint={ownerProfile?.billingName ?? "Nom de facturation a venir"}
            />
          </SpotlightCard>
          <SpotlightCard tone="info">
            <AccountSummaryCard
              className="h-full min-w-0 border-ring/65 bg-ring/22 shadow-ring/10"
              icon={<Mail className="size-5" />}
              label="Email"
              value={user.email}
              hint="Identifiant de connexion"
            />
          </SpotlightCard>
          <SpotlightCard tone="default">
            <AccountSummaryCard
              className="h-full min-w-0 border-border bg-card shadow-black/10"
              icon={<ShieldCheck className="size-5" />}
              label="Role principal"
              value={roleLabel}
              hint="Conserve pour compatibilite"
            />
          </SpotlightCard>
          <SpotlightCard tone="warning">
            <AccountSummaryCard
              className="h-full border-chart-4/70 bg-chart-4/22 shadow-chart-4/10"
              icon={<Sparkles className="size-5" />}
              label="Plan"
              value={currentPlan}
              hint="Abonnement proprietaire"
            />
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Changer d'espace"
          description="Ouvrez les espaces rattaches a ce meme compte."
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <SpotlightCard tone="success">
            <article className="h-full rounded-xl border border-primary/55 bg-primary/12 p-5 text-card-foreground shadow-sm shadow-black/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold tracking-normal text-foreground">
                      Espace proprietaire
                    </h2>
                    <StatusBadge tone="success">Disponible</StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Gere les biens, contrats, paiements, quittances et finances
                    rattaches a votre profil proprietaire.
                  </p>
                </div>
                <Link
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                  href="/owner"
                >
                  Ouvrir l&apos;espace proprietaire
                </Link>
              </div>
            </article>
          </SpotlightCard>

          <SpotlightCard tone={tenantProfile ? "info" : "default"}>
            <article className="h-full rounded-xl border border-ring/45 bg-ring/10 p-5 text-card-foreground shadow-sm shadow-black/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold tracking-normal text-foreground">
                      Espace locataire
                    </h2>
                    <StatusBadge tone={tenantProfile ? "info" : "muted"}>
                      {tenantProfile ? "Disponible" : "Non active"}
                    </StatusBadge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {tenantProfile
                      ? "Consultez vos locations, paiements, quittances et documents locataire."
                      : "Votre espace proprietaire restera inchange. Vous utiliserez le meme email et le meme mot de passe."}
                  </p>
                </div>
                {tenantProfile ? (
                  <Link
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                    })}
                    href="/tenant"
                  >
                    Ouvrir l&apos;espace locataire
                  </Link>
                ) : (
                  <form action={createTenantProfileFromOwnerAccountAction}>
                    <button
                      className={buttonVariants({ size: "sm" })}
                      type="submit"
                    >
                      Creer mon espace locataire gratuit
                    </button>
                  </form>
                )}
              </div>
              {!tenantProfile ? (
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Vous pourrez aussi etre rattache a un logement plus tard via
                  une invitation proprietaire.
                </p>
              ) : null}
            </article>
          </SpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Profil et securite"
          description="Photo de profil, identifiants et informations facultatives de votre compte."
        />
        <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="h-full rounded-xl border border-primary/45 bg-primary/10 p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-xl hover:shadow-black/15">
            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(280px,0.8fr)]">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                <ProfileImagePreview
                  displayName={displayName}
                  imageUrl={user.profileImageUrl}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="min-w-0 truncate font-semibold tracking-normal text-foreground">
                      Profil utilisateur
                    </h2>
                    <StatusBadge tone="success">Actif</StatusBadge>
                  </div>
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
                    action={updateOwnerAccountProfileImageAction}
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
                          action={removeOwnerAccountProfileImageAction}
                        />
                      ) : null}
                    </div>
                  </form>
                </div>

                <div className="rounded-lg border border-primary/35 bg-background/40 p-3">
                  <p className="text-xs text-muted-foreground">
                    Identite du compte
                  </p>
                  <p className="mt-2 text-sm font-medium text-foreground">
                    {displayName}
                  </p>
                  <p className="mt-2 break-all text-xs leading-5 text-muted-foreground">
                    La photo et les informations personnelles sont communes a
                    vos espaces proprietaire et locataire.
                  </p>
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
                    <StatusBadge tone="info">Auth securisee</StatusBadge>
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
          action={updateOwnerAccountPersonalInfoAction}
          isFocused={isPersonalInfoFocused}
          user={user}
        />
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Plan RentFlow"
          description="Votre plan proprietaire actuel et les options disponibles."
          action={
            <Link
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href="/owner/upgrade"
            >
              Voir les plans
            </Link>
          }
        />
        <SpotlightCard tone="warning">
          <article className="rounded-xl border border-chart-4/50 bg-chart-4/12 p-5 text-card-foreground shadow-sm shadow-black/10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-chart-4/50 bg-chart-4/18 text-chart-4">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h2 className="font-semibold tracking-normal text-foreground">
                    Plan {currentPlan}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Le plan est lu depuis votre profil proprietaire. Aucun
                    checkout reel n&apos;est branche dans cette etape.
                  </p>
                </div>
              </div>
              <StatusBadge tone="warning">{currentPlan}</StatusBadge>
            </div>
          </article>
        </SpotlightCard>
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Actions rapides"
          description="Raccourcis vers les principales etapes de gestion."
        />
        <OwnerQuickActions />
      </section>
    </section>
  );
}
