import { AppShell } from "@/components/layout/app-shell";
import { requireTenantAccess } from "@/server/auth/access";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";

type TenantAccess = Awaited<ReturnType<typeof requireTenantAccess>>;

function getDisplayName(user: TenantAccess["user"]) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return name || user.email;
}

export default async function TenantLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let access: TenantAccess;

  try {
    access = await requireTenantAccess();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }

  return (
    <AppShell
      avatarUrl={access.user.profileImageUrl}
      displayName={getDisplayName(access.user)}
      role="TENANT"
      roleLabel="Locataire"
    >
      {children}
    </AppShell>
  );
}
