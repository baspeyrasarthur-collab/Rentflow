const blockingArchiveContractStatuses = [
  "ACTIVE",
  "SUSPENSION_REQUESTED",
  "SUSPENDED",
] as const;

export function getBlockingArchiveContractStatuses() {
  return blockingArchiveContractStatuses;
}

export function isBlockingArchiveContractStatus(status: string) {
  return blockingArchiveContractStatuses.some(
    (blockingStatus) => blockingStatus === status,
  );
}

export function hasBlockingArchiveContracts(count: number) {
  return count > 0;
}
