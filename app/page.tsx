import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  HomeIcon,
  LifeBuoy,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Users,
  WalletCards,
} from "lucide-react";
import type { ComponentType } from "react";

import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { LandingThemeToggle } from "@/components/landing/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LandingCard = {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
};

const problemCards: LandingCard[] = [
  {
    title: "Trop d'actions dispersées",
    description:
      "Loyers, quittances, contrats et demandes finissent vite dans plusieurs outils.",
    icon: ClipboardList,
  },
  {
    title: "Des oublis qui coûtent du temps",
    description:
      "Une action simple peut devenir urgente quand elle n'est pas visible au bon moment.",
    icon: WalletCards,
  },
  {
    title: "Des locataires qui attendent une réponse",
    description:
      "Chaque demande doit trouver sa place, sans créer une messagerie compliquée.",
    icon: Users,
  },
];

const flowSteps = [
  {
    title: "Une action apparaît",
    description: "RentFlow détecte ce qui mérite votre attention.",
  },
  {
    title: "Vous cliquez sur le bloc",
    description: "La card entière devient un chemin clair.",
  },
  {
    title: "RentFlow ouvre le bon écran",
    description: "Vous arrivez directement au contexte utile.",
  },
  {
    title: "L'action disparaît une fois faite",
    description: "Le dashboard reste propre et vivant.",
  },
];

const ownerCards: LandingCard[] = [
  {
    title: "À faire maintenant",
    description: "Les priorités owner restent visibles dès l'arrivée.",
    icon: Sparkles,
  },
  {
    title: "Biens et contrats",
    description:
      "Chaque logement garde son état, ses contrats et ses locataires.",
    icon: Building2,
  },
  {
    title: "Paiements et quittances",
    description:
      "Déclarations, confirmations et quittances restent dans le bon ordre.",
    icon: ReceiptText,
  },
  {
    title: "Finances et déclarations",
    description:
      "Les données connues restent vérifiables, sans promesse fiscale magique.",
    icon: BarChart3,
  },
];

const tenantCards: LandingCard[] = [
  {
    title: "Voir mon logement",
    description: "Le locataire comprend immédiatement son logement actif.",
    icon: HomeIcon,
  },
  {
    title: "Consulter mon contrat",
    description: "Le contrat reste accessible en lecture seule.",
    icon: FileText,
  },
  {
    title: "Déclarer un loyer payé",
    description: "La déclaration reste distincte de la réception propriétaire.",
    icon: WalletCards,
  },
  {
    title: "Demander une quittance",
    description: "Les demandes importantes restent guidées et simples.",
    icon: ReceiptText,
  },
];

const plans = [
  {
    name: "Free",
    label: "Pour démarrer",
    description: "Un premier espace pour tester le rythme guidé de RentFlow.",
    features: [
      "Tableau de bord guidé",
      "Suivi des biens principaux",
      "Actions à faire maintenant",
      "Espace locataire gratuit",
      "Support de base",
    ],
  },
  {
    name: "Pro",
    label: "Pour gérer plus sereinement",
    description:
      "Le plan mis en avant pour plusieurs logements et un suivi plus fluide.",
    featured: true,
    features: [
      "Gestion de plusieurs biens",
      "Paiements et quittances",
      "Demandes locataires",
      "Export finances",
      "Données à compléter pour la déclaration",
    ],
  },
  {
    name: "Scale",
    label: "Pour plusieurs biens",
    description: "Une base pensée pour les portefeuilles qui grandissent.",
    features: [
      "Gestion avancée multi-biens",
      "Vue consolidée",
      "Exports plus complets",
      "Organisation locataires / contrats",
      "Accompagnement évolutif",
    ],
  },
];

const trustCards: LandingCard[] = [
  {
    title: "Permissions owner / tenant",
    description: "Chaque espace garde ses accès et ses données séparés.",
    icon: ShieldCheck,
  },
  {
    title: "Compte multi-profils",
    description: "Un même utilisateur peut naviguer entre ses rôles.",
    icon: Users,
  },
  {
    title: "Support humain",
    description: "Un lien direct vers le support quand un blocage apparaît.",
    icon: LifeBuoy,
  },
  {
    title: "Exports vérifiables",
    description: "Les exports restent des documents de travail à vérifier.",
    icon: LockKeyhole,
  },
];

const dashboardActions = [
  {
    title: "Confirmer un loyer",
    badge: "Prioritaire",
    tone: "warning",
  },
  {
    title: "Générer une quittance",
    badge: "Prêt",
    tone: "teal",
  },
  {
    title: "Répondre à une demande",
    badge: "Nouveau",
    tone: "cyan",
  },
] as const;

function PublicNav() {
  return (
    <header className="fixed left-0 right-0 top-3 z-[80] px-3 sm:px-6">
      <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 rounded-[1.35rem] border border-white/10 bg-[#071A20]/72 px-4 shadow-2xl shadow-black/20 backdrop-blur-2xl sm:px-5 lg:px-6">
        <Link className="group flex items-center gap-3 font-semibold" href="/">
          <span className="flex size-10 items-center justify-center rounded-2xl border border-[#8FD8C8]/35 bg-[#102C36]/85 shadow-lg shadow-[#7BC4B8]/10 transition-transform duration-300 group-hover:scale-105">
            <Image
              alt="RentFlow"
              className="size-7 object-contain"
              height={28}
              src="/brand/logo-rentflow.png"
              width={28}
            />
          </span>
          <span className="text-lg tracking-normal text-[#F5F1E8]">
            RentFlow
          </span>
        </Link>

        <nav
          aria-label="Navigation publique"
          className="hidden items-center gap-7 text-sm font-medium text-[#A8B8BE] lg:flex"
        >
          <a
            className="transition-colors hover:text-[#8FD8C8]"
            href="#fonctionnalites"
          >
            Fonctionnalités
          </a>
          <a className="transition-colors hover:text-[#8FD8C8]" href="#demo">
            Démo
          </a>
          <a className="transition-colors hover:text-[#8FD8C8]" href="#plans">
            Plans
          </a>
          <a className="transition-colors hover:text-[#8FD8C8]" href="#support">
            Support
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LandingThemeToggle />
          <Link
            className={buttonVariants({
              variant: "outline",
              size: "sm",
              className:
                "border-white/12 bg-white/[0.03] text-[#F5F1E8] hover:bg-white/[0.07]",
            })}
            href="/sign-in"
          >
            Se connecter
          </Link>
          <Link
            className={cn(
              buttonVariants({ size: "sm" }),
              "landing-shine border border-[#8FD8C8]/35 bg-gradient-to-r from-[#7BC4B8] to-[#6BC6D9] text-[#071A20] shadow-lg shadow-[#7BC4B8]/20 hover:scale-[1.02]",
            )}
            href="/demo"
          >
            Voir le site
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroDashboardMockup() {
  return (
    <div className="landing-float relative mx-auto w-full max-w-2xl">
      <div className="landing-orb absolute -inset-10 rounded-[3rem] bg-[#7BC4B8]/20 blur-3xl" />
      <div className="landing-dashboard-card relative overflow-hidden rounded-[2rem] border border-[#8FD8C8]/20 bg-[#0B222A]/88 p-4 shadow-2xl shadow-black/45 ring-1 ring-white/[0.04] backdrop-blur-xl">
        <div className="grid gap-4 lg:grid-cols-[4.5rem_1fr]">
          <aside className="hidden rounded-[1.4rem] border border-white/10 bg-[#071A20]/80 p-3 lg:block">
            <div className="mx-auto mb-6 size-8 rounded-xl bg-[#8FD8C8]/20" />
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((item) => (
                <div
                  className={cn(
                    "mx-auto h-9 w-9 rounded-xl border border-white/8 bg-white/[0.04]",
                    item === 1 && "border-[#8FD8C8]/35 bg-[#8FD8C8]/15",
                  )}
                  key={item}
                />
              ))}
            </div>
          </aside>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[1.4rem] border border-white/10 bg-[#102C36]/70 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[#8FD8C8]">
                  Mai 2026
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-normal text-[#F5F1E8]">
                  Pilotage locatif
                </h2>
              </div>
              <span className="landing-pulse-soft rounded-full border border-[#8FD8C8]/30 bg-[#8FD8C8]/10 px-3 py-1 text-xs font-medium text-[#8FD8C8]">
                3 actions
              </span>
            </div>

            <section className="rounded-[1.5rem] border border-[#8FD8C8]/18 bg-[#102C36]/72 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-[#8FD8C8]">
                    À faire maintenant
                  </p>
                  <h3 className="mt-1 font-semibold tracking-normal text-[#F5F1E8]">
                    Le bon ordre, sans tri manuel.
                  </h3>
                </div>
                <ArrowRight className="size-4 text-[#8FD8C8]" />
              </div>
              <div className="landing-line-flow mt-4 h-px rounded-full bg-gradient-to-r from-transparent via-[#8FD8C8] to-transparent" />
              <div className="mt-4 space-y-3">
                {dashboardActions.map((action, index) => (
                  <div
                    className="landing-fade-up landing-glow-card group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#071A20]/72 p-4 transition-all duration-300 hover:scale-[1.02] hover:border-[#8FD8C8]/35"
                    key={action.title}
                    style={{ animationDelay: `${300 + index * 120}ms` }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium tracking-normal text-[#F5F1E8]">
                        {action.title}
                      </p>
                      <p className="mt-1 text-sm text-[#A8B8BE]">
                        Ouvrir l&apos;écran exact
                      </p>
                    </div>
                    <span
                      className={cn(
                        "landing-pulse-soft shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                        action.tone === "warning" &&
                          "border-[#D8A85F]/35 bg-[#D8A85F]/12 text-[#D8A85F]",
                        action.tone === "teal" &&
                          "border-[#8FD8C8]/35 bg-[#8FD8C8]/12 text-[#8FD8C8]",
                        action.tone === "cyan" &&
                          "border-[#6BC6D9]/35 bg-[#6BC6D9]/12 text-[#6BC6D9]",
                      )}
                    >
                      {action.badge}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-[1.4rem] border border-white/10 bg-[#102C36]/64 p-4">
                <p className="text-sm font-medium text-[#F5F1E8]">Mes biens</p>
                <div className="mt-3 space-y-2">
                  {["Appartement Canal", "Maison Saint-Félix"].map((item) => (
                    <div
                      className="flex items-center justify-between rounded-xl bg-white/[0.04] px-3 py-2 text-sm"
                      key={item}
                    >
                      <span className="text-[#C2CDD1]">{item}</span>
                      <CheckCircle2 className="size-4 text-[#8FD8C8]" />
                    </div>
                  ))}
                </div>
              </section>
              <section className="rounded-[1.4rem] border border-white/10 bg-[#102C36]/64 p-4">
                <p className="text-sm font-medium text-[#F5F1E8]">
                  Activité récente
                </p>
                <div className="mt-3 space-y-2 text-sm text-[#A8B8BE]">
                  <p>Loyer confirmé</p>
                  <p>Quittance prête</p>
                  <p>Demande traitée</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description: string;
}) {
  return (
    <ScrollReveal className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8FD8C8]">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.045em] text-[#F5F1E8] md:text-5xl">
        {title}
      </h2>
      <p className="mt-5 text-base leading-7 text-[#A8B8BE] md:text-lg">
        {description}
      </p>
    </ScrollReveal>
  );
}

function VisualCard({
  card,
  className,
}: {
  card: LandingCard;
  className?: string;
}) {
  const Icon = card.icon;

  return (
    <ScrollReveal
      as="article"
      className={cn(
        "landing-glow-card group rounded-[1.5rem] border border-white/10 bg-[#102C36]/72 p-6 shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-[#8FD8C8]/35",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl border border-[#8FD8C8]/24 bg-[#8FD8C8]/10 text-[#8FD8C8] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-5 text-xl font-semibold tracking-normal text-[#F5F1E8]">
        {card.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[#A8B8BE]">
        {card.description}
      </p>
    </ScrollReveal>
  );
}

function RoleSection({
  title,
  description,
  cards,
  variant,
}: {
  title: string;
  description: string;
  cards: LandingCard[];
  variant: "owner" | "tenant";
}) {
  return (
    <section className="relative mx-auto grid max-w-7xl gap-8 px-4 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
      <ScrollReveal
        direction={variant === "owner" ? "left" : "right"}
        className={cn(
          "rounded-[2rem] border border-white/10 bg-[#102C36]/58 p-8 shadow-2xl shadow-black/25",
          variant === "tenant" && "lg:order-2",
        )}
      >
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[#8FD8C8]">
          {variant === "owner" ? "Propriétaire" : "Locataire"}
        </p>
        <h2 className="mt-4 text-4xl font-semibold leading-[0.95] tracking-[-0.045em] text-[#F5F1E8] md:text-5xl">
          {title}
        </h2>
        <p className="mt-5 leading-7 text-[#A8B8BE]">{description}</p>
        <div className="mt-8 rounded-[1.5rem] border border-[#8FD8C8]/18 bg-[#071A20]/72 p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#C2CDD1]">
              {variant === "owner" ? "Priorités owner" : "Espace personnel"}
            </span>
            <span className="rounded-full border border-[#8FD8C8]/25 bg-[#8FD8C8]/10 px-3 py-1 text-xs text-[#8FD8C8]">
              Démo
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {(variant === "owner"
              ? ["Confirmer", "Générer", "Exporter"]
              : ["Logement", "Contrat", "Quittance"]
            ).map((label) => (
              <div
                className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-3"
                key={label}
              >
                <span className="font-medium text-[#F5F1E8]">{label}</span>
                <ArrowRight className="size-4 text-[#8FD8C8]" />
              </div>
            ))}
          </div>
        </div>
      </ScrollReveal>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <VisualCard
            card={card}
            className="landing-stagger-1"
            key={card.title}
          />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#071A20] text-[#F5F1E8]">
      <PublicNav />

      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,#071A20_0%,#0A232B_44%,#0F3443_100%)]" />
        <div className="landing-orb absolute -left-32 top-8 -z-10 size-96 rounded-full bg-[#0F3443]/80 blur-3xl" />
        <div className="landing-orb absolute right-0 top-24 -z-10 size-[28rem] rounded-full bg-[#7BC4B8]/22 blur-3xl [animation-delay:2s]" />
        <div className="landing-orb absolute bottom-24 left-1/3 -z-10 size-80 rounded-full bg-[#D8A85F]/12 blur-3xl [animation-delay:5s]" />

        <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-14 px-4 pb-20 pt-28 sm:px-6 lg:grid-cols-[1fr_0.95fr] lg:px-8 xl:pb-28 xl:pt-32">
          <div>
            <p className="landing-fade-up inline-flex rounded-full border border-[#8FD8C8]/28 bg-[#102C36]/70 px-4 py-2 text-sm font-medium text-[#8FD8C8] shadow-lg shadow-black/20 backdrop-blur">
              Gestion locative guidée
            </p>
            <h1 className="landing-fade-up-delay-1 mt-7 max-w-5xl bg-gradient-to-r from-[#F5F1E8] via-[#F5F1E8] to-[#8FD8C8] bg-clip-text text-5xl font-semibold leading-[0.9] tracking-[-0.06em] text-transparent sm:text-6xl lg:text-7xl xl:text-8xl">
              Gérez vos locations dans le bon ordre, sans oubli.
            </h1>
            <p className="landing-fade-up-delay-2 mt-7 max-w-2xl text-lg leading-8 text-[#C2CDD1]">
              RentFlow aide propriétaires et locataires à suivre les loyers,
              quittances, contrats, demandes et documents sans chercher la
              prochaine étape.
            </p>
            <div className="landing-fade-up-delay-2 mt-9 flex flex-wrap items-center gap-3">
              <Link
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "landing-shine border border-[#8FD8C8]/35 bg-gradient-to-r from-[#8FD8C8] to-[#6BC6D9] text-[#071A20] shadow-2xl shadow-[#7BC4B8]/20 hover:scale-[1.02]",
                )}
                href="/demo"
              >
                Voir le site
                <ArrowRight className="size-4" />
              </Link>
              <Link
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-white/12 bg-white/[0.04] text-[#F5F1E8] hover:bg-white/[0.08]",
                })}
                href="/sign-up"
              >
                Créer un compte
              </Link>
              <Link
                className={buttonVariants({
                  variant: "link",
                  size: "lg",
                  className: "text-[#C2CDD1] hover:text-[#8FD8C8]",
                })}
                href="/sign-in"
              >
                Se connecter
              </Link>
            </div>
          </div>

          <HeroDashboardMockup />
        </div>
      </section>

      <section
        className="relative border-y border-white/10 bg-[#0A232B] px-4 py-24 sm:px-6 lg:px-8"
        id="fonctionnalites"
      >
        <div className="landing-orb absolute left-10 top-16 size-64 rounded-full bg-[#B66A5E]/12 blur-3xl" />
        <div className="mx-auto max-w-7xl">
          <SectionHeading
            eyebrow="Le problème"
            title="Un propriétaire ne devrait pas devoir chercher quoi faire."
            description="Les loyers, quittances, contrats, demandes et données fiscales créent vite une suite de petites actions difficiles à suivre."
          />
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {problemCards.map((card) => (
              <VisualCard
                card={card}
                className="landing-stagger-1"
                key={card.title}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#071A20] px-4 py-28 sm:px-6 lg:px-8">
        <div className="landing-orb absolute right-10 top-16 size-80 rounded-full bg-[#6BC6D9]/14 blur-3xl" />
        <SectionHeading
          eyebrow="Solution guidée"
          title="RentFlow vous emmène directement au bon endroit."
          description="Chaque action affichée mène vers l'écran exact où elle peut être traitée."
        />
        <div className="relative mx-auto mt-14 grid max-w-7xl gap-5 md:grid-cols-4">
          <div className="landing-line-flow absolute left-[10%] right-[10%] top-10 hidden h-px bg-gradient-to-r from-transparent via-[#8FD8C8] to-transparent md:block" />
          {flowSteps.map((step, index) => (
            <ScrollReveal
              as="article"
              className="relative rounded-[1.5rem] border border-white/10 bg-[#102C36]/74 p-6 shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1 hover:border-[#8FD8C8]/35"
              delay={index * 110}
              key={step.title}
            >
              <span className="relative z-10 flex size-12 items-center justify-center rounded-2xl border border-[#8FD8C8]/30 bg-[#071A20] text-sm font-semibold text-[#8FD8C8]">
                {index + 1}
              </span>
              <h3 className="mt-6 text-lg font-semibold tracking-normal text-[#F5F1E8]">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#A8B8BE]">
                {step.description}
              </p>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <RoleSection
        cards={ownerCards}
        description="Le propriétaire voit ce qui est à traiter, puis arrive au bon écran sans chercher dans toutes les pages."
        title="Un espace propriétaire qui priorise l'action."
        variant="owner"
      />

      <RoleSection
        cards={tenantCards}
        description="Le locataire voit son logement, ses documents et ses actions utiles, sans tableau de bord de gestion complexe."
        title="Un espace locataire simple et rassurant."
        variant="tenant"
      />

      <section
        className="relative border-y border-white/10 bg-[#0A232B] px-4 py-24 sm:px-6 lg:px-8"
        id="demo"
      >
        <div className="landing-orb absolute left-1/2 top-10 size-80 -translate-x-1/2 rounded-full bg-[#7BC4B8]/16 blur-3xl" />
        <div className="mx-auto max-w-4xl text-center">
          <SectionHeading
            eyebrow="Démo"
            title="Essayez RentFlow avant de créer un compte."
            description="La démo reprend l'expérience finale avec des données fictives, côté propriétaire comme côté locataire."
          />
          <div className="mt-8 flex justify-center gap-3">
            <span className="landing-pulse-soft rounded-full border border-[#8FD8C8]/35 bg-[#8FD8C8]/10 px-4 py-2 text-sm font-medium text-[#8FD8C8]">
              Mode propriétaire
            </span>
            <span className="landing-pulse-soft rounded-full border border-[#6BC6D9]/35 bg-[#6BC6D9]/10 px-4 py-2 text-sm font-medium text-[#6BC6D9] [animation-delay:1.4s]">
              Mode locataire
            </span>
          </div>
          <ScrollReveal className="landing-glow-card mx-auto mt-10 max-w-2xl rounded-[2rem] border border-[#8FD8C8]/20 bg-[#102C36]/76 p-6 shadow-2xl shadow-black/25">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#8FD8C8]/20 bg-[#071A20]/70 p-4 text-left">
                <p className="text-sm text-[#8FD8C8]">Propriétaire</p>
                <p className="mt-2 font-semibold">
                  Confirmer, générer, exporter
                </p>
              </div>
              <div className="rounded-2xl border border-[#6BC6D9]/20 bg-[#071A20]/70 p-4 text-left">
                <p className="text-sm text-[#6BC6D9]">Locataire</p>
                <p className="mt-2 font-semibold">
                  Consulter, déclarer, demander
                </p>
              </div>
            </div>
            <Link
              className={cn(
                buttonVariants({ size: "lg" }),
                "landing-shine mt-6 border border-[#8FD8C8]/35 bg-gradient-to-r from-[#8FD8C8] to-[#6BC6D9] text-[#071A20]",
              )}
              href="/demo"
            >
              Voir la démo
              <ArrowRight className="size-4" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
        id="plans"
      >
        <SectionHeading
          eyebrow="Plans"
          title="Des offres lisibles, sans détour."
          description="Le propriétaire choisit son rythme. Le compte locataire est gratuit."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <ScrollReveal
              as="article"
              className={cn(
                "landing-glow-card rounded-[1.75rem] border bg-[#102C36]/72 p-7 shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-1",
                plan.featured
                  ? "border-[#8FD8C8]/45 shadow-[#7BC4B8]/10"
                  : "border-white/10",
              )}
              delay={index * 100}
              key={plan.name}
            >
              <p className="text-sm font-medium text-[#8FD8C8]">{plan.label}</p>
              <h3 className="mt-4 text-3xl font-semibold leading-none tracking-[-0.035em] text-[#F5F1E8]">
                {plan.name}
              </h3>
              <p className="mt-4 leading-7 text-[#A8B8BE]">
                {plan.description}
              </p>
              <details className="mt-6 rounded-2xl border border-white/10 bg-[#071A20]/50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#8FD8C8] transition-colors hover:text-[#6BC6D9]">
                  Fonctionnalités incluses
                </summary>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-[#C2CDD1]">
                  {plan.features.map((feature) => (
                    <li className="flex gap-2" key={feature}>
                      <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#8FD8C8]" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </ScrollReveal>
          ))}
        </div>
        <p className="mt-7 text-center text-sm font-medium text-[#8FD8C8]">
          Le compte locataire est gratuit.
        </p>
      </section>

      <section
        className="border-y border-white/10 bg-[#0A232B] px-4 py-24 sm:px-6 lg:px-8"
        id="support"
      >
        <SectionHeading
          eyebrow="Confiance"
          title="Pensé pour des données sensibles."
          description="RentFlow reste sobre sur les promesses et clair sur les accès."
        />
        <div className="mx-auto mt-12 grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-4">
          {trustCards.map((card) => (
            <VisualCard
              card={card}
              className="landing-stagger-1"
              key={card.title}
            />
          ))}
        </div>
      </section>

      <section className="landing-final-glow relative overflow-hidden px-4 py-32 sm:px-6 lg:px-8">
        <div className="landing-orb absolute inset-x-0 top-6 mx-auto size-[30rem] rounded-full bg-[#7BC4B8]/24 blur-3xl" />
        <div className="landing-orb absolute bottom-0 right-[10%] size-80 rounded-full bg-[#D8A85F]/16 blur-3xl [animation-delay:4s]" />
        <ScrollReveal className="landing-cta-glow landing-glow-card relative mx-auto max-w-5xl overflow-hidden rounded-[2.2rem] border border-[#8FD8C8]/35 bg-gradient-to-br from-[#123A45]/95 via-[#102C36]/96 to-[#0A232B]/94 p-8 text-center shadow-2xl shadow-[#7BC4B8]/15 sm:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(143,216,200,0.24),transparent_40%)]" />
          <div className="relative">
            <h2 className="bg-gradient-to-r from-[#F5F1E8] via-[#8FD8C8] to-[#6BC6D9] bg-clip-text text-4xl font-semibold leading-[0.95] tracking-[-0.055em] text-transparent md:text-6xl">
              Prêt à gérer vos locations sans pression ?
            </h2>
            <p className="mx-auto mt-5 max-w-2xl leading-7 text-[#C2CDD1]">
              Explorez la démo, puis créez votre espace quand vous êtes prêt.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "landing-shine border border-[#8FD8C8]/35 bg-gradient-to-r from-[#8FD8C8] to-[#6BC6D9] text-[#071A20]",
                )}
                href="/demo"
              >
                Voir le site
              </Link>
              <Link
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-white/12 bg-white/[0.04] text-[#F5F1E8] hover:bg-white/[0.08]",
                })}
                href="/sign-up"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <footer className="border-t border-[#8FD8C8]/14 bg-[#0A232B]/80 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#A8B8BE] md:flex-row md:items-center md:justify-between">
          <p>RentFlow - gérez vos locations dans le bon ordre.</p>
          <div className="flex flex-wrap gap-4">
            <Link className="hover:text-[#8FD8C8]" href="/demo">
              Démo
            </Link>
            <Link className="hover:text-[#8FD8C8]" href="/support">
              Support
            </Link>
            <Link className="hover:text-[#8FD8C8]" href="/sign-in">
              Se connecter
            </Link>
            <Link className="hover:text-[#8FD8C8]" href="/sign-up">
              Créer un compte
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
