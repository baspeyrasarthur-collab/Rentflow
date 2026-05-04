import { AppShell } from "@/components/layout/app-shell";
import {
  redirectAfterRoleAccessError,
  requireRole,
} from "@/server/auth/current-user";

export default async function TenantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await requireRole(["TENANT", "ADMIN"]);
  } catch (error) {
    await redirectAfterRoleAccessError(error);
  }

  return <AppShell roleLabel="Locataire">{children}</AppShell>;
}
