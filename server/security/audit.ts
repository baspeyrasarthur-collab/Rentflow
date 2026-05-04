export type AuditEventInput = {
  userId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
};

export async function recordAuditEvent(input: AuditEventInput) {
  if (process.env.NODE_ENV === "development") {
    console.info("[audit]", input);
  }
}
