# Research: ActuallyDo Notification Platform UI

**Feature**: 001-notification-platform-ui
**Date**: 2026-03-22

## R1: React 19 + Vite 6 Project Setup

**Decision**: Use `npm create vite@latest` with React + TypeScript template, then add dependencies incrementally.

**Rationale**: Vite 6 provides fast HMR, native ESM, and optimized builds. React 19 is stable and supports the latest features (use, Server Components — though we won't use RSC in this SPA). The Vite React template sets up the TypeScript config with strict mode.

**Alternatives considered**:
- Next.js: Overkill for an SPA that doesn't need SSR. Backend is separate. Adds unnecessary complexity.
- Create React App: Deprecated. Vite is the modern standard.
- Remix: Similar to Next.js concern — we don't need server-side rendering.

## R2: Tailwind CSS v4 + shadcn/ui Integration

**Decision**: Install Tailwind CSS v4 via `@tailwindcss/vite` plugin. Add shadcn/ui components individually via `npx shadcn@latest add`.

**Rationale**: Tailwind v4 uses CSS-first configuration (no `tailwind.config.js`) and is faster. shadcn/ui provides accessible, unstyled primitives that we own (copied into our codebase, not a dependency). This aligns with the Component Simplicity principle.

**Alternatives considered**:
- Material UI: Opinionated design system, hard to customize. Large bundle.
- Chakra UI: Good but adds runtime CSS-in-JS overhead.
- Headless UI only: shadcn/ui builds on Radix (Headless) but adds sensible defaults.

## R3: TanStack Query v5 for Server State

**Decision**: Use TanStack Query for all API data fetching with query key conventions per resource type.

**Rationale**: Handles caching, background refetching, optimistic updates, and request deduplication. This keeps components simple — they just call hooks. Query keys follow the pattern `['tasks', status]`, `['task', taskId]`, `['settings']`, `['vehicles']`.

**Query key conventions**:
- `['tasks', { status }]` — TuskDue task list by tab
- `['task', taskId]` — Single task detail
- `['settings']` — Platform settings
- `['vehicles']` — WrenchDue vehicle list
- `['vehicle', vehicleId]` — Single vehicle with maintenance items
- `['maintenance-log', vehicleId]` — Maintenance history

**Mutation invalidation rules**:
- Create/delete task → invalidate `['tasks']`
- Complete/snooze task → optimistic update + invalidate `['tasks']`
- Update settings → invalidate `['settings']`
- Create/delete vehicle → invalidate `['vehicles']`

## R4: Authentication Token Management

**Decision**: Store tokens in localStorage. Use a React Context provider for auth state. Silent refresh via `setInterval` when token is within 5 minutes of expiry.

**Rationale**: Cognito JWTs are too large for cookies (>4KB). localStorage is appropriate for SPAs where XSS is the primary concern (mitigated by CSP and React's built-in escaping). The auth context exposes `user`, `login()`, `signup()`, `logout()`, and the current `idToken` for API calls.

**Token refresh flow**:
1. On login/signup: store `id_token`, `access_token`, `refresh_token`, compute `expires_at = Date.now() + expires_in * 1000`
2. On app mount: check if tokens exist and not expired → restore session
3. Background interval: if `expires_at - Date.now() < 300000` (5 min), call Cognito refresh via backend
4. On refresh failure: clear tokens, redirect to `/login`

**Alternatives considered**:
- httpOnly cookies: Can't set from client-side Cognito flow. Would need a BFF (backend-for-frontend).
- In-memory only: Loses session on page reload. Bad UX.

## R5: Routing Architecture

**Decision**: React Router v7 with lazy-loaded route components. Shared layout route wraps authenticated pages.

**Route structure**:
```
/login                    → LoginPage
/signup                   → SignupPage
/login/magic-link         → MagicLinkPage
/action-result            → ActionResultPage
/settings                 → SettingsPage (authenticated)
/tuskdue                    → TuskDue DashboardPage (authenticated, default)
/tuskdue/tasks/:taskId      → TuskDue TaskDetailPage (authenticated)
/wrenchdue               → WrenchDue DashboardPage (authenticated)
/wrenchdue/vehicles/new  → AddVehiclePage (authenticated)
/wrenchdue/vehicles/:id  → VehicleDetailPage (authenticated)
```

**Rationale**: App-specific route prefixes (`/tuskdue`, `/wrenchdue`) keep namespaces clean. Shared routes (`/login`, `/settings`) are at the root level since they serve all apps. Default redirect from `/` goes to the user's primary app (TuskDue by default).

## R6: Form Handling with React Hook Form + Zod

**Decision**: React Hook Form for all forms with Zod schemas for validation. Auto-save forms use `watch()` + debounce.

**Rationale**: React Hook Form is performant (uncontrolled inputs, minimal re-renders). Zod provides runtime type validation that mirrors TypeScript types. The combination handles both submit-based forms (login, signup, add task) and auto-save forms (task detail, settings).

**Auto-save pattern**:
```
1. useForm with defaultValues from API
2. watch() to detect changes
3. useDebouncedCallback (500ms) triggers mutation
4. Show "Saved" indicator on mutation success
5. Show error toast on mutation failure, revert field
```

## R7: Stripe Integration (Client-Side)

**Decision**: Use `@stripe/stripe-js` for `redirectToCheckout`. No server-side checkout session creation needed — use Stripe's client-only Checkout.

**Rationale**: The backend handles webhook events to update tier. The frontend only needs to redirect to Stripe with the correct price ID and user metadata. This keeps the frontend simple.

**Price IDs**: Configured via environment variables or constants. Three plans: monthly ($3), yearly ($24), lifetime ($49).

## R8: PWA with vite-plugin-pwa

**Decision**: Use `vite-plugin-pwa` with `workbox-precaching` for asset caching and custom service worker for push notifications.

**Rationale**: vite-plugin-pwa auto-generates the manifest and service worker. Workbox handles cache strategies. The custom service worker addition handles push notification display and click-to-open routing.

**Cache strategy**:
- Precache: all static assets (JS, CSS, fonts, icons)
- Runtime cache: API responses with NetworkFirst strategy (show cached data when offline)
- Offline fallback: cached shell with "You're offline" banner

## R9: MSW for API Mocking

**Decision**: MSW v2 with handlers matching every endpoint in `overview/api-integration.md`. Used in development (browser) and tests (Node).

**Rationale**: MSW intercepts at the network level, so the app code doesn't know it's mocked. This ensures the typed fetch wrapper and TanStack Query hooks are tested with realistic data. Handlers return the exact response shapes from the API docs.
