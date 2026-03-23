<!--
Sync Impact Report
- Version change: 1.0.0 → 1.1.0
- Modified principles: None
- Added sections: Core Principles VII (Per-App Deployment)
- Removed sections: None
- Templates requiring updates:
  - .specify/templates/plan-template.md ✅ no changes needed (generic)
  - .specify/templates/spec-template.md ✅ no changes needed (generic)
  - .specify/templates/tasks-template.md ✅ no changes needed (generic)
- Follow-up TODOs: None
-->

# ActuallyDo Notification Frontend Constitution

## Core Principles

### I. API-Contract First

All frontend development MUST be driven by the documented API contracts in `overview/api-integration.md`. No UI component may assume request/response shapes that differ from the documented contracts. When the backend API is unavailable during development, use MSW (Mock Service Worker) with responses matching the documented shapes exactly. Any API discrepancy discovered during integration MUST be filed as an issue rather than silently worked around in the frontend.

### II. Mobile-First Responsive Design

All UI MUST be designed mobile-first using Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`). Base styles target mobile viewports (< 640px). Touch targets MUST be minimum 44x44px. Breakpoints follow the documented standard: 640px (mobile), 768px (tablet), 1024px (desktop). Layouts MUST be single-column on mobile and progressively enhanced for wider viewports. Color MUST never be the sole indicator of state — always pair with text or icons.

### III. Type Safety

TypeScript strict mode MUST be enabled. All API response types MUST be defined as TypeScript interfaces matching the documented response shapes in `overview/api-integration.md`. No use of `any` type except where third-party library types are genuinely unavailable. Zod schemas MUST validate forms and API inputs. Shared types (auth tokens, settings, error responses) MUST be defined once and imported — never duplicated.

### IV. Component Simplicity

Start with the simplest working implementation. No premature abstraction — extract shared components only when genuinely used in 3+ places. Prefer shadcn/ui primitives over custom implementations. No wrapper components that add no behavior. State MUST live at the lowest possible level: local state in components, TanStack Query for server state, React Context only for auth and toasts. Every component MUST have a single clear responsibility.

### V. Security by Default

Auth tokens MUST be stored in localStorage with expiry tracking. The `id_token` MUST be attached to all authenticated requests via the typed fetch wrapper. Token refresh MUST happen silently before expiry (< 5 min remaining). On refresh failure, redirect to login immediately — never surface expired tokens to the user. No secrets (API keys, Stripe secret keys) may exist in frontend code. Only publishable keys (`VITE_*` env vars) are permitted.

### VI. Graceful Degradation

Every API call MUST handle loading, success, and error states. Loading states MUST use skeleton screens, not spinners, for initial page loads. Errors MUST show user-friendly messages (never raw error codes or stack traces). Network failures MUST show toast notifications with retry guidance. Optimistic updates are permitted for complete, snooze, and delete operations. Create and activate operations MUST wait for server confirmation (need server-generated IDs or may 403).

### VII. Per-App Deployment

This repository hosts multiple frontend apps (TuskDue, WrenchDue, and future niche apps). Each app MUST be independently deployable to its own hosting infrastructure. App names MUST map to infrastructure using the convention `{app-name}.actuallydo.com`. All deployments MUST go through version-controlled scripts or CI/CD pipelines — no manual console uploads. Hashed/fingerprinted assets MUST use long-lived cache headers (1 year); root HTML documents MUST use short-lived cache headers (5 minutes). Deploying one app MUST NOT affect any other app's availability, cache, or configuration. Environment configuration MUST use `VITE_*` environment variables per app — no hardcoded values. App names MUST contain only lowercase alphanumeric characters and hyphens. Setup scripts MUST be idempotent — re-running for an existing app MUST NOT create duplicate resources.

## Tech Stack Constraints

The following technology choices are fixed and MUST NOT be substituted:

| Layer | Choice | Justification |
|-------|--------|---------------|
| Framework | React 19 + Vite 6 | Fast builds, modern React features |
| Language | TypeScript (strict) | Type safety across API boundary |
| Routing | React Router v7 | Standard SPA routing |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first, accessible primitives |
| Server state | TanStack Query v5 | Cache, background refresh, optimistic updates |
| Client state | React Context + useReducer | Auth tokens, toast notifications only |
| Forms | React Hook Form + Zod | Validation, performance |
| API client | Native fetch (typed wrapper) | No unnecessary dependencies |
| Icons | Lucide React | Consistent, tree-shakeable |
| Dates | date-fns | Lightweight, immutable |
| Testing | Vitest + Testing Library + Playwright | Unit, component, E2E |

Adding new dependencies MUST be justified — prefer the existing stack. No jQuery, Axios, Moment.js, or CSS-in-JS libraries.

## Development Workflow

### Multi-App Repository Structure

This repository hosts multiple apps (TuskDue, WrenchDue, and future apps) under a shared codebase. Shared platform code (auth, settings, layout, action results) MUST be co-located and imported — not duplicated per app. Each app MUST have its own route namespace and page components.

### Commit Discipline

Each commit MUST represent a single logical change (one component, one hook, one page). Commits MUST pass TypeScript compilation (`tsc --noEmit`) and linting. Commit messages MUST follow conventional commits format (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`).

### Testing Expectations

- Unit tests (Vitest): API client, hooks, utility functions
- Component tests (Testing Library): interaction behavior, not implementation details
- E2E tests (Playwright): critical user flows (signup, login, task CRUD, settings)
- API mocking: MSW with documented response shapes from `overview/api-integration.md`

## Governance

This constitution governs all development in the ActuallyDo notification frontend repository. All code contributions MUST comply with these principles. When a principle conflicts with a specific feature requirement, document the conflict and the resolution chosen. Amendments to this constitution require incrementing the version: MAJOR for principle removals/redefinitions, MINOR for new principles or expanded guidance, PATCH for wording clarifications.

**Version**: 1.1.0 | **Ratified**: 2026-03-22 | **Last Amended**: 2026-03-23
