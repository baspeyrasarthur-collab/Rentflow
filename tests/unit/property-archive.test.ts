import { describe, expect, it } from "vitest";

import {
  getBlockingArchiveContractStatuses,
  hasBlockingArchiveContracts,
  isBlockingArchiveContractStatus,
} from "@/server/owner/property-archive";

describe("property archive helpers", () => {
  it("lists contract statuses that block property archival", () => {
    expect(getBlockingArchiveContractStatuses()).toEqual([
      "ACTIVE",
      "SUSPENSION_REQUESTED",
      "SUSPENDED",
    ]);
  });

  it("detects whether blocking contracts exist", () => {
    expect(hasBlockingArchiveContracts(0)).toBe(false);
    expect(hasBlockingArchiveContracts(1)).toBe(true);
  });

  it("detects only active or suspended contract statuses as blocking", () => {
    expect(isBlockingArchiveContractStatus("ACTIVE")).toBe(true);
    expect(isBlockingArchiveContractStatus("SUSPENSION_REQUESTED")).toBe(true);
    expect(isBlockingArchiveContractStatus("SUSPENDED")).toBe(true);
    expect(isBlockingArchiveContractStatus("DRAFT")).toBe(false);
    expect(isBlockingArchiveContractStatus("TERMINATED")).toBe(false);
  });
});
