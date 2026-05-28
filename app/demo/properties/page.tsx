import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FileText,
  Home,
  Plus,
  ReceiptText,
  UserPlus,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  ActionCard,
  InfoAlert,
  PageHeader,
  SectionHeader,
  StatCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { formatMoney, formatSignedMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

import { DemoActionPill, type DemoActionPillTone } from "../demo-action-pill";
import { demoDashboardData } from "../demo-data";
import { DemoSpotlightCard } from "../demo-spotlight-card";

type BadgeTone =
  | "default"
  | "success"
  | "info"
  | "warning"
  | "danger"
  | "muted";

const propertyVisualClasses: Record<string, string> = {
  river: "from-primary/35 via-ring/15 to-background",
  studio: "from-chart-4/30 via-primary/10 to-background",
  house: "from-ring/30 via-secondary/35 to-background",
};

const propertyActionIcons: Record<string, ReactNode> = {
  "Ajouter un logement": <Plus className="size-5" />,
  "Voir le detail": <Home className="size-5" />,
  "Creer un contrat": <FileText className="size-5" />,
  "Inviter un locataire": <UserPlus className="size-5" />,
  "Suivre les paiements": <WalletCards className="size-5" />,
};

const propertyActionTones: Record<string, DemoActionPillTone> = {
  "Ajouter un logement": "info",
  "Voir le detail": "default",
  "Creer un contrat": "success",
  "Inviter un locataire": "default",
  "Suivre les paiements": "warning",
};

function getCashFlowInCents(property: {
  collectedRentInCents: number;
  outgoingAmountInCents: number;
}) {
  return property.collectedRentInCents - property.outgoingAmountInCents;
}

function PropertyVisual({
  alt,
  imageSrc,
  variant,
}: {
  alt: string;
  imageSrc?: string;
  variant: string;
}) {
  if (imageSrc) {
    return (
      <div className="relative h-36 overflow-hidden bg-muted">
        <Image
          alt={alt}
          className="object-cover transition duration-500 group-hover:scale-105"
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          src={imageSrc}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-background/10 to-transparent" />
        <div className="absolute left-6 top-6 flex size-11 items-center justify-center rounded-xl border border-white/15 bg-background/45 text-primary backdrop-blur-sm">
          <Building2 className="size-5" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative h-36 overflow-hidden bg-gradient-to-br",
        propertyVisualClasses[variant] ?? propertyVisualClasses.river,
      )}
    >
      <div className="absolute inset-x-7 bottom-0 h-20 rounded-t-2xl border border-white/10 bg-background/35 shadow-2xl shadow-black/30" />
      <div className="absolute bottom-8 right-8 h-16 w-24 rounded-t-xl border border-white/10 bg-white/10" />
      <div className="absolute left-6 top-6 flex size-11 items-center justify-center rounded-xl border border-white/15 bg-background/35 text-primary">
        <Building2 className="size-5" />
      </div>
    </div>
  );
}

export default function DemoPropertiesPage() {
  const { summary } = demoDashboardData;

  return (
    <section className="space-y-10">
      <PageHeader
        eyebrow="Démo publique - données fictives"
        title="Logements"
        description="Visualisez comment RentFlow centralise les biens, loyers, contrats et actions à suivre."
        actions={
          <>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/demo"
            >
              Retour démo
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/demo/finances"
            >
              Voir les finances
            </Link>
            <Link className={buttonVariants()} href="/sign-up">
              Créer un compte
            </Link>
          </>
        }
      />

      <DemoSpotlightCard tone="info">
        <InfoAlert title="Logements fictifs">
          Cette démo utilise uniquement des logements fictifs. Créez un compte
          pour gérer vos propres biens.
        </InfoAlert>
      </DemoSpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          description="Une lecture courte du portefeuille fictif présenté dans la démo."
          title="Résumé logements"
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DemoSpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<Building2 className="size-5" />}
              label="Total logements"
              value={summary.propertyCount}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="success">
            <StatCard
              className="h-full border-primary/70 bg-primary/26 shadow-primary/15"
              icon={<Home className="size-5" />}
              label="Logements actifs"
              value={summary.activePropertiesCount}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="warning">
            <StatCard
              className="h-full border-chart-4/75 bg-chart-4/26 shadow-chart-4/15"
              icon={<FileText className="size-5" />}
              label="Brouillons"
              value={summary.draftPropertiesCount}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard tone="info">
            <StatCard
              className="h-full border-ring/65 bg-ring/24 shadow-ring/15"
              icon={<ReceiptText className="size-5" />}
              label="Quittances disponibles"
              value={summary.availableReceiptsCount}
            />
          </DemoSpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Des exemples d'actions que RentFlow remonte dans le bon ordre."
          title="À faire sur vos logements"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          <DemoSpotlightCard href="/sign-up" tone="info">
            <ActionCard
              className="h-full"
              description="Un bien fictif demande encore un contrat complet."
              icon={<FileText className="size-5" />}
              title="Créer un contrat"
              tone="info"
              value={1}
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard href="/sign-up" tone="success">
            <ActionCard
              className="h-full"
              description="Invitez un locataire pour centraliser paiements et quittances."
              icon={<UserPlus className="size-5" />}
              title="Inviter un locataire"
              tone="success"
            />
          </DemoSpotlightCard>
          <DemoSpotlightCard href="/sign-up" tone="warning">
            <ActionCard
              className="h-full"
              description="Le studio fictif contient un paiement à surveiller."
              icon={<WalletCards className="size-5" />}
              title="Suivre les paiements"
              tone="warning"
              value={summary.watchPaymentsCount}
            />
          </DemoSpotlightCard>
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          action={
            <Link className={buttonVariants()} href="/sign-up">
              Ajouter un logement
            </Link>
          }
          description="Cards fictives inspirées du rendu owner connecté."
          title="Liste des logements"
        />

        <div className="grid gap-4 lg:grid-cols-3">
          {demoDashboardData.properties.map((property) => (
            <Link
              className="group block h-full overflow-hidden rounded-xl border border-primary/35 bg-primary/8 text-card-foreground shadow-sm shadow-black/10 ring-1 ring-white/[0.02] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-primary/65 hover:bg-primary/10 hover:shadow-xl hover:shadow-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              href="/sign-up"
              key={property.id}
            >
              <PropertyVisual
                alt={`${property.name} - ${property.city}`}
                imageSrc={property.imageSrc}
                variant={property.visualVariant}
              />
              <div className="space-y-5 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-lg font-semibold tracking-normal">
                      {property.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {property.city} - {property.type} -{" "}
                      {property.surfaceLabel}
                    </p>
                  </div>
                  <StatusBadge tone={property.statusTone as BadgeTone}>
                    {property.status}
                  </StatusBadge>
                </div>

                <dl className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Loyer attendu</dt>
                    <dd className="font-medium">
                      {formatMoney(property.expectedRentInCents)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Loyer encaissé</dt>
                    <dd className="font-medium">
                      {formatMoney(property.collectedRentInCents)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-muted-foreground">Sorties</dt>
                    <dd className="font-medium">
                      {formatMoney(property.outgoingAmountInCents)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-t pt-3">
                    <dt className="text-muted-foreground">Cash-flow estimé</dt>
                    <dd className="font-medium">
                      {formatSignedMoney(getCashFlowInCents(property))}
                    </dd>
                  </div>
                </dl>

                <div className="grid grid-cols-3 gap-3 rounded-lg border bg-background/45 p-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Contrats</p>
                    <p className="mt-1 font-medium">
                      {property.contractsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Paiements</p>
                    <p className="mt-1 font-medium">
                      {property.watchPaymentsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Quittances</p>
                    <p className="mt-1 font-medium">
                      {property.availableReceiptsCount}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors group-hover:text-primary/80">
                  Voir le détail dans mon compte
                  <ArrowRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <SectionHeader
          description="Raccourcis fictifs vers les actions clés."
          title="Actions rapides"
        />
        <div className="flex flex-wrap gap-3">
          {demoDashboardData.propertyActions.map((action) => (
            <DemoActionPill
              icon={propertyActionIcons[action]}
              key={action}
              label={action}
              tone={propertyActionTones[action] ?? "default"}
            />
          ))}
        </div>
      </section>
    </section>
  );
}
