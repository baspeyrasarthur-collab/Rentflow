import { AppShell } from "@/components/layout/app-shell";
import {
  redirectAfterRoleAccessError,
  requireRole,
} from "@/server/auth/current-user";

export default async function OwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await requireRole(["OWNER", "ADMIN"]);
  } catch (error) {
    await redirectAfterRoleAccessError(error);
  }

  return <AppShell roleLabel="Proprietaire">{children}</AppShell>;
}
