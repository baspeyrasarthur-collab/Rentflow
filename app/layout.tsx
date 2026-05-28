import type { Metadata } from "next";

import { RootProviders } from "@/components/providers/root-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "RentFlow",
  description: "Socle SaaS de gestion locative automatisee.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full dark antialiased">
      <body className="flex min-h-full flex-col">
        <RootProviders>{children}</RootProviders>
      </body>
    </html>
  );
}
