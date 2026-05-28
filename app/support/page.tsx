import Link from "next/link";
import { LifeBuoy, Mail, Send, ShieldCheck, UserRound } from "lucide-react";

import { CopySupportEmailButton } from "@/components/support/copy-support-email-button";
import { buttonVariants } from "@/components/ui/button";
import {
  InfoAlert,
  PageHeader,
  SectionHeader,
  SpotlightCard,
  StatusBadge,
} from "@/components/ui/rentflow";
import { requireCurrentUser } from "@/server/auth/current-user";

import { createSupportRequestAction } from "./actions";

const supportEmail = "contact@rentflow.fr";
const supportMailto =
  "mailto:contact@rentflow.fr?subject=Demande%20support%20RentFlow";

const supportCategories = [
  {
    value: "TECHNICAL_ISSUE",
    label: "Probleme technique",
  },
  {
    value: "ACCOUNT_QUESTION",
    label: "Question sur mon compte",
  },
  {
    value: "PAYMENT_RECEIPT",
    label: "Paiement / quittance",
  },
  {
    value: "PROPERTY_CONTRACT",
    label: "Logement / contrat",
  },
  {
    value: "OTHER",
    label: "Autre",
  },
];

const faqItems = [
  {
    question: "Je ne vois pas une action attendue dans mon espace",
    answer:
      "Certaines actions apparaissent seulement quand elles sont necessaires : paiement a declarer, quittance disponible, invitation recue ou demande a traiter. Si une action manque, verifiez d'abord le logement ou le contrat concerne.",
  },
  {
    question: "Je ne vois pas mon logement cote locataire",
    answer:
      "Le logement apparait apres invitation ou rattachement par le proprietaire.",
  },
  {
    question: "Un paiement ou une quittance semble incorrect",
    answer:
      "Verifiez le detail du contrat, puis contactez votre proprietaire ou le support.",
  },
];

type SupportPageProps = {
  searchParams?: Promise<{
    sent?: string | string[];
  }>;
};

function getSearchParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SupportPage({ searchParams }: SupportPageProps) {
  await requireCurrentUser();

  const resolvedSearchParams = await searchParams;
  const hasSentRequest =
    getSearchParamValue(resolvedSearchParams?.sent) === "1";

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Support"
        title="Contacter RentFlow"
        description="Une question, un blocage ou un probleme ? Choisissez le moyen de contact qui vous convient."
        actions={
          <Link className={buttonVariants({ variant: "outline" })} href="/">
            Retour RentFlow
          </Link>
        }
      />

      {hasSentRequest ? (
        <InfoAlert title="Votre demande a bien ete enregistree." tone="success">
          <p>
            Nous avons conserve votre demande cote RentFlow. L&apos;envoi email
            reel sera branche plus tard.
          </p>
        </InfoAlert>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <SpotlightCard tone="info">
          <article className="h-full rounded-xl border border-ring/45 bg-ring/10 p-6 text-card-foreground shadow-sm shadow-black/10">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-ring/50 bg-ring/18 text-ring shadow-sm shadow-ring/10">
                <Mail className="size-6" />
              </span>
              <div className="min-w-0 space-y-3">
                <StatusBadge tone="info">Ecrire au support</StatusBadge>
                <h2 className="text-xl font-semibold tracking-normal text-foreground">
                  Ecrire au support RentFlow
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Pour une question urgente ou un probleme precis, vous pouvez
                  nous ecrire directement par email.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-border/80 bg-background/45 p-4">
              <p className="text-sm text-muted-foreground">Email support</p>
              <p className="mt-2 break-all text-lg font-semibold tracking-normal text-foreground">
                {supportEmail}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link className={buttonVariants()} href={supportMailto}>
                <Mail className="size-4" />
                Ecrire un email
              </Link>
              <CopySupportEmailButton email={supportEmail} />
            </div>
          </article>
        </SpotlightCard>

        <SpotlightCard tone="success">
          <article className="h-full rounded-xl border border-primary/45 bg-primary/10 p-6 text-card-foreground shadow-sm shadow-black/10">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/50 bg-primary/18 text-primary shadow-sm shadow-primary/10">
                <Send className="size-6" />
              </span>
              <div className="space-y-3">
                <StatusBadge tone="success">
                  Envoyer une demande depuis l&apos;app
                </StatusBadge>
                <h2 className="text-xl font-semibold tracking-normal text-foreground">
                  Envoyer une demande
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  Decrivez votre probleme. Cette V1 enregistre votre demande
                  cote RentFlow ; l&apos;envoi email reel sera branche plus
                  tard.
                </p>
              </div>
            </div>

            <form
              action={createSupportRequestAction}
              className="mt-6 space-y-4"
            >
              <label className="grid gap-2 text-sm font-medium text-foreground">
                Sujet
                <input
                  className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  maxLength={120}
                  minLength={3}
                  name="subject"
                  placeholder="Exemple : je ne vois pas mon logement"
                  required
                  type="text"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                Type de demande
                <select
                  className="min-h-11 rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  name="category"
                  required
                >
                  {supportCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-medium text-foreground">
                Message
                <textarea
                  className="min-h-36 resize-y rounded-lg border border-border bg-background px-3 py-3 text-sm font-normal leading-6 text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  maxLength={2000}
                  minLength={10}
                  name="message"
                  placeholder="Expliquez ce qui bloque, en ajoutant la page concernee si possible."
                  required
                />
              </label>

              <button className={buttonVariants()} type="submit">
                <Send className="size-4" />
                Envoyer la demande
              </button>
            </form>
          </article>
        </SpotlightCard>
      </section>

      <SpotlightCard tone="default">
        <article className="rounded-xl border border-primary/35 bg-card p-6 text-card-foreground shadow-sm shadow-black/10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-primary/45 bg-gradient-to-br from-primary/28 via-ring/16 to-background text-2xl font-semibold text-primary shadow-lg shadow-primary/10">
              AB
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge tone="success">Un support humain</StatusBadge>
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <UserRound className="size-4" />
                  Fondateur
                </span>
              </div>
              <h2 className="text-xl font-semibold tracking-normal text-foreground">
                Un support humain
              </h2>
              <p className="font-medium text-foreground">Arthur Baspeyras</p>
              <p className="text-sm text-muted-foreground">
                Fondateur de RentFlow
              </p>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                RentFlow est pense pour aider proprietaires et locataires a
                gerer leurs demarches plus simplement. Chaque retour aide a
                ameliorer l&apos;experience.
              </p>
            </div>
          </div>
        </article>
      </SpotlightCard>

      <section className="space-y-4">
        <SectionHeader
          title="FAQ express"
          description="Trois reperes rapides avant de contacter le support."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {faqItems.map((item) => (
            <article
              className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-lg hover:shadow-black/15"
              key={item.question}
            >
              <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-primary/35 bg-primary/16 text-primary">
                <LifeBuoy className="size-5" />
              </div>
              <h3 className="font-semibold tracking-normal text-foreground">
                {item.question}
              </h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </p>
            </article>
          ))}
        </div>
      </section>

      <InfoAlert title="Confidentialite" tone="info">
        <p>
          RentFlow ne vous demandera jamais votre mot de passe. Pour vos
          identifiants, utilisez uniquement l&apos;espace
          d&apos;authentification securise.
        </p>
        <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-foreground">
          <ShieldCheck className="size-4 text-primary" />
          Aucun provider email reel n&apos;est branche dans cette V1.
        </p>
      </InfoAlert>
    </section>
  );
}
