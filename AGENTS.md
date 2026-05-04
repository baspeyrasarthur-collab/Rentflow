# RentFlow Agent Instructions

## Project overview

RentFlow is a SaaS MVP for rental management between private landlords and tenants. The first launch targets France, but the architecture must stay ready for future international expansion.

Work in small, validated steps. Do not start a major phase until the user has approved it.

## Tech stack

- Next.js App Router
- TypeScript strict
- Tailwind CSS
- shadcn/ui
- Prisma
- PostgreSQL
- Clerk
- Mock providers for payment, KYC, email, and storage

## Repository structure

- `app`: Next.js routes and layouts
- `components`: shared UI and layout components
- `features`: feature-level types, schemas, and UI
- `server`: server-only services, providers, auth, config, and security code
- `prisma`: Prisma schema and migrations
- `emails`: email templates
- `tests`: unit and integration tests

## Coding conventions

- Prefer small, testable changes.
- Use TypeScript strict patterns.
- Use Zod for input validation.
- Keep business logic server-side when permissions or sensitive data are involved.
- Store money as integer cents only. Never use floats for amounts.
- Keep France, EUR, locale, and payment method constants centralized.
- Avoid broad refactors unless they are required for the approved step.

## Security and compliance rules

- Check server-side permissions before any access to owner, tenant, or admin data.
- A landlord must only access their own properties and contracts.
- A tenant must only access their own rental data, payments, mandates, and receipts.
- Admin access must be role-protected.
- Never store a full IBAN or sensitive banking data.
- Store only external provider IDs, statuses, timestamps, provider names, and safe last-four data when available.
- When the schema is available, record sensitive actions through AuditLog.
- Keep consent history explicit for mandates, terms acceptance, payment authorization, suspension, and termination.

## Provider rules

- Keep payment, KYC, email, and storage behind interfaces.
- Use mock providers until the user validates real integrations.
- Do not integrate Stripe, GoCardless, Resend real sending, real KYC, or real storage without approval.
- Webhooks must be signature-verified, idempotent, and stored raw when the schema supports it.
- The app must never hold funds directly.

## Verification commands

Run these before considering an implementation step complete:

- `npm run format`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Definition of done

- The approved scope is implemented and no unrelated feature was added.
- Permissions are enforced on the server for protected data.
- Inputs are validated with Zod where applicable.
- Amounts are stored as integer cents.
- Providers remain abstracted and mock-backed unless real integration was approved.
- Sensitive actions are ready to be audited when AuditLog is available.
- Format, lint, typecheck, tests, and build pass.
