import {
  Download,
  FileText,
  Plus,
  ReceiptText,
  UserPlus,
  WalletCards,
} from "lucide-react";

import { CompactActionPill } from "./compact-action-pill";

const ownerQuickActions = [
  {
    href: "/owner/properties/new",
    icon: <Plus className="size-5" />,
    label: "Ajouter un logement",
    tone: "info" as const,
  },
  {
    href: "/owner/payments",
    icon: <WalletCards className="size-5" />,
    label: "Mettre a jour les loyers",
    tone: "warning" as const,
  },
  {
    href: "/owner/receipts",
    icon: <ReceiptText className="size-5" />,
    label: "Generer une quittance",
    tone: "success" as const,
  },
  {
    href: "/owner/contracts",
    icon: <FileText className="size-5" />,
    label: "Modifier les contrats",
    tone: "info" as const,
  },
  {
    href: "/owner/tenants",
    icon: <UserPlus className="size-5" />,
    label: "Inviter un locataire",
    tone: "success" as const,
  },
  {
    href: "/owner/finances/export",
    icon: <Download className="size-5" />,
    label: "Exporter mes finances",
    tone: "default" as const,
  },
];

export function OwnerQuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      {ownerQuickActions.map((action) => (
        <CompactActionPill key={action.href} {...action} />
      ))}
    </div>
  );
}
