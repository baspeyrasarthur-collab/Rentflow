import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen bg-background">
      <section className="mx-auto flex w-full max-w-5xl flex-col justify-center gap-8 px-6 py-16">
        <div className="max-w-3xl space-y-5">
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            RentFlow MVP
          </p>
          <h1 className="text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
            Socle technique pret pour construire la gestion locative.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground">
            Cette initialisation pose les bases Next.js, Prisma, Clerk et les
            providers mock. Les parcours metier seront ajoutes par petites
            etapes validees.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/owner" className={buttonVariants()}>
            Espace proprietaire
          </Link>
          <Link
            href="/tenant"
            className={buttonVariants({ variant: "outline" })}
          >
            Espace locataire
          </Link>
          <Link
            href="/admin"
            className={buttonVariants({ variant: "outline" })}
          >
            Administration
          </Link>
        </div>
      </section>
    </main>
  );
}
