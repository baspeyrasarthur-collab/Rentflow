import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const tenantDashboardSource = readFileSync(
  join(process.cwd(), "app/(tenant)/tenant/page.tsx"),
  "utf8",
);
const tenantRequestsPageSource = readFileSync(
  join(process.cwd(), "app/(tenant)/tenant/requests/page.tsx"),
  "utf8",
);
const appShellSource = readFileSync(
  join(process.cwd(), "components/layout/app-shell.tsx"),
  "utf8",
);

describe("tenant requests page UI", () => {
  it("adds tenant requests to the tenant navigation", () => {
    expect(appShellSource).toContain(
      '{ href: "/tenant/requests", label: "Demandes", icon: MessageSquare }',
    );
  });

  it("keeps the full tenant request workflow on the dedicated page", () => {
    expect(tenantRequestsPageSource).toContain(
      'title="Demandes au proprietaire"',
    );
    expect(tenantRequestsPageSource).toContain(
      "action={createTenantRequestAction}",
    );
    expect(tenantRequestsPageSource).toContain("Envoyer la demande");
    expect(tenantRequestsPageSource).toContain(
      "action={acknowledgeResolvedTenantRequestAction}",
    );
    expect(tenantRequestsPageSource).toContain(
      "action={acknowledgeRefusedTenantRequestAction}",
    );
  });

  it("keeps tenant request actions on the dashboard without duplicating the request page", () => {
    expect(tenantDashboardSource).not.toContain('title="Demandes recentes"');
    expect(tenantDashboardSource).toContain("/tenant/requests");
    expect(tenantDashboardSource).not.toContain(
      "action={createTenantRequestAction}",
    );
    expect(tenantDashboardSource).not.toContain("Envoyer la demande");
    expect(tenantDashboardSource).toContain(
      "action={acknowledgeResolvedTenantRequestAction}",
    );
    expect(tenantDashboardSource).toContain(
      "action={acknowledgeRefusedTenantRequestAction}",
    );
  });
});
