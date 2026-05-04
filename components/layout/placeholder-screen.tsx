type PlaceholderScreenProps = {
  title: string;
  description: string;
};

export function PlaceholderScreen({
  title,
  description,
}: PlaceholderScreenProps) {
  return (
    <section className="max-w-3xl space-y-3">
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        RentFlow
      </p>
      <h1 className="text-3xl font-semibold tracking-normal">{title}</h1>
      <p className="text-base leading-7 text-muted-foreground">{description}</p>
    </section>
  );
}
