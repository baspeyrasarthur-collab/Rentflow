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
  let user: Awaited<ReturnType<typeof requireRole>>;

  try {
    user = await requireRole(["ADMIN"]);
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }

  return (
    <AppShell role={user.role} roleLabel="Administration">
      {children}
    </AppShell>
  );
}
