import { ClerkProvider } from "@clerk/nextjs";

import { env } from "@/server/config/env";

type RootProvidersProps = {
  children: React.ReactNode;
};

export function RootProviders({ children }: RootProvidersProps) {
  return (
    <ClerkProvider publishableKey={env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      {children}
    </ClerkProvider>
  );
}
