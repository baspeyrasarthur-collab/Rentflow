import { AppShell } from "@/components/layout/app-shell";
import { requireOwnerAccess } from "@/server/auth/access";
import { redirectAfterRoleAccessError } from "@/server/auth/current-user";

type OwnerAccess = Awaited<ReturnType<typeof requireOwnerAccess>>;

function getDisplayName(user: OwnerAccess["user"]) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

  return name || user.email;
}

export default async function OwnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let access: OwnerAccess;

  try {
    access = await requireOwnerAccess();
  } catch (error) {
    return redirectAfterRoleAccessError(error);
  }

  return (
    <AppShell
      avatarUrl={access.user.profileImageUrl}
      currentPlan={access.ownerProfile.plan}
      displayName={getDisplayName(access.user)}
      role="OWNER"
      roleLabel="Proprietaire"
    >
      {children}
    </AppShell>
  );
}
