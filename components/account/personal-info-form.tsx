import { buttonVariants } from "@/components/ui/button";
import { InfoAlert, StatusBadge } from "@/components/ui/rentflow";
import { cn } from "@/lib/utils";

type PersonalInfoUser = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  taxResidenceCountry?: string | null;
};

type PersonalInfoFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  isFocused?: boolean;
  user: PersonalInfoUser;
};

const fields: Array<{
  autoComplete?: string;
  className?: string;
  label: string;
  name: keyof PersonalInfoUser;
}> = [
  { label: "Prenom", name: "firstName", autoComplete: "given-name" },
  { label: "Nom", name: "lastName", autoComplete: "family-name" },
  { label: "Telephone", name: "phone", autoComplete: "tel" },
  { label: "Adresse", name: "addressLine1", autoComplete: "street-address" },
  { label: "Complement d'adresse", name: "addressLine2" },
  { label: "Code postal", name: "postalCode", autoComplete: "postal-code" },
  { label: "Ville", name: "city", autoComplete: "address-level2" },
  { label: "Pays", name: "country", autoComplete: "country-name" },
  {
    label: "Pays de residence fiscale",
    name: "taxResidenceCountry",
    className: "sm:col-span-2",
  },
];

export function PersonalInfoForm({
  action,
  isFocused = false,
  user,
}: PersonalInfoFormProps) {
  return (
    <article
      className={cn(
        "rounded-xl border bg-background/45 p-5 text-card-foreground shadow-sm shadow-black/10 transition-all duration-300",
        isFocused
          ? "border-chart-4/75 bg-chart-4/10 shadow-lg shadow-chart-4/10"
          : "border-primary/35",
      )}
      id="personal-info"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold tracking-normal text-foreground">
              Informations personnelles
            </h2>
            <StatusBadge tone="muted">Facultatif</StatusBadge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Ces informations sont facultatives. Elles pourront aider RentFlow a
            preparer certaines donnees utiles pour votre fiscalite locative.
          </p>
        </div>
      </div>

      {isFocused ? (
        <InfoAlert className="mt-4" title="Action ciblee" tone="warning">
          <p>
            Action ciblee : completez les informations utiles a la preparation
            fiscale. Vous pouvez laisser les champs non pertinents vides.
          </p>
        </InfoAlert>
      ) : null}

      <form action={action} className="mt-5 space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <label
              className={cn(
                "grid min-w-0 gap-1.5 text-sm font-medium text-foreground",
                field.className,
              )}
              key={field.name}
            >
              {field.label}
              <input
                autoComplete={field.autoComplete}
                className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/35"
                defaultValue={user[field.name] ?? ""}
                name={field.name}
                type="text"
              />
            </label>
          ))}
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          Vous pouvez laisser les champs vides. RentFlow ne les utilisera que
          lorsqu&apos;ils seront necessaires a une fonctionnalite claire, comme
          la preparation fiscale.
        </p>

        <button className={buttonVariants({ size: "sm" })} type="submit">
          Enregistrer les informations
        </button>
      </form>
    </article>
  );
}
