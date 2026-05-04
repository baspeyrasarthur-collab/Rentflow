import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
  roleLabel: string;
};

export function AppShell({ children, roleLabel }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-base font-semibold">
            RentFlow
          </Link>
          <span className="text-sm text-muted-foreground">{roleLabel}</span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
