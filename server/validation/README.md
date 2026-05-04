# Validation conventions

Use shared Zod schemas from `server/validation` for server inputs, provider DTOs, and server actions.

Keep validation close to the trust boundary. Never rely on client-side validation for permissions or sensitive data.
