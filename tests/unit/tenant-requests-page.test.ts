import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const tenantDashboardSource = readFileSync(
  join(process.cwd(), "app/(tenant)/tenant/page.tsx"),
  "utf8",
);
const tenantDashboardViewSource = readFileSync(
  join(process.cwd(), "components/tenant/tenant-dashboard-view.tsx"),
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
    expect(tenantDashboardViewSource).not.toContain(
      'title="Demandes recentes"',
    );
    expect(tenantDashboardViewSource).toContain("/tenant/requests");
    expect(tenantDashboardSource).not.toContain(
      "action={createTenantRequestAction}",
    );
    expect(tenantDashboardViewSource).not.toContain("Envoyer la demande");
    expect(tenantDashboardSource).toContain(
      "acknowledgeResolvedTenantRequestAction",
    );
    expect(tenantDashboardSource).toContain(
      "acknowledgeRefusedTenantRequestAction",
    );
    expect(tenantDashboardViewSource).toContain(
      "serverActions.acknowledgeResolvedTenantRequest",
    );
    expect(tenantDashboardViewSource).toContain(
      "serverActions.acknowledgeRefusedTenantRequest",
    );
  });
});
