import { AppShell } from "@/components/layout/app-shell";
import {
  redirectAfterRoleAccessError,
  requireRole,
} from "@/server/auth/current-user";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    await requireRole(["ADMIN"]);
  } catch (error) {
    await redirectAfterRoleAccessError(error);
  }

  return <AppShell roleLabel="Administration">{children}</AppShell>;
}
