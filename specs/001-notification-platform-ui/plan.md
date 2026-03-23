# Implementation Plan: ActuallyDo Notification Platform UI

**Branch**: `001-notification-platform-ui` | **Date**: 2026-03-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-notification-platform-ui/spec.md`

## Summary

Build the complete frontend for the ActuallyDo notification platform: a multi-app React SPA hosting TuskDue (task reminders) and WrenchDue (vehicle maintenance) under a shared platform shell with authentication, settings, navigation, Stripe payments, push notifications, and PWA support. The frontend communicates with a separate backend API via JWT-authenticated REST calls. The approach uses React 19 + Vite 6 + TypeScript + Tailwind CSS v4 + shadcn/ui with TanStack Query for server state management.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) on Node.js 20+
**Primary Dependencies**: React 19, Vite 6, React Router v7, Tailwind CSS v4, shadcn/ui, TanStack Query v5, React Hook Form, Zod, date-fns, Lucide React, Stripe.js, vite-plugin-pwa
**Storage**: localStorage (auth tokens), TanStack Query cache (server state), Service Worker cache (PWA offline)
**Testing**: Vitest + Testing Library (unit/component), Playwright (E2E), MSW (API mocking)
**Target Platform**: Web (modern browsers: Chrome, Firefox, Safari, Edge). PWA-installable on mobile.
**Project Type**: Single-page web application (SPA)
**Performance Goals**: LCP < 1.5s, initial bundle < 150 KB gzipped, 60fps interactions
**Constraints**: Offline-capable (PWA), mobile-first responsive (640/768/1024px breakpoints), 44px minimum touch targets
**Scale/Scope**: ~20 screens/views, 2 apps (TuskDue + WrenchDue), shared platform layer

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API-Contract First | PASS | All API shapes documented in `overview/api-integration.md`. MSW will mock these for dev/testing. |
| II. Mobile-First Responsive | PASS | Tailwind mobile-first approach with documented breakpoints. All touch targets 44px+. |
| III. Type Safety | PASS | TypeScript strict mode. Zod for form validation. API response types defined as interfaces. |
| IV. Component Simplicity | PASS | Using shadcn/ui primitives. State kept minimal: Context for auth/toasts, TanStack Query for server data. |
| V. Security by Default | PASS | JWT in localStorage with silent refresh. Only VITE_* env vars. No secrets in frontend code. |
| VI. Graceful Degradation | PASS | Skeleton screens for loading. Toast notifications for errors. Optimistic updates for complete/snooze/delete only. |

No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/001-notification-platform-ui/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-routes.md    # Frontend route contracts
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── api/                  # Typed fetch wrapper, auth, settings, app-specific endpoints
│   ├── client.ts         # Base fetch wrapper with auth headers, error parsing
│   ├── auth.ts           # Login, signup, magic-link, token refresh
│   ├── settings.ts       # GET/PUT platform settings
│   ├── tuskdue.ts          # TuskDue task CRUD, complete, snooze, activate
│   └── wrenchdue.ts     # WrenchDue vehicle/maintenance CRUD
├── components/
│   ├── ui/               # shadcn/ui components (Button, Input, Dialog, etc.)
│   ├── layout/           # Shell, Navbar, AppSwitcher, PageContainer
│   ├── auth/             # LoginForm, SignupForm, MagicLinkForm, ProtectedRoute
│   ├── settings/         # ProfileSection, AppPreferences, PushToggle, SubscriptionSection
│   ├── tasks/            # TaskCard, TaskList, AddTaskForm, TaskDetail, SnoozeDropdown
│   ├── vehicles/         # VehicleCard, VehicleList, AddVehicleForm, VehicleDetail
│   ├── maintenance/      # MaintenanceItem, CompletionForm, MaintenanceHistory
│   └── shared/           # UpgradePrompt, EmptyState, ActionResult, TierBadge
├── pages/
│   ├── LoginPage.tsx
│   ├── SignupPage.tsx
│   ├── MagicLinkPage.tsx
│   ├── SettingsPage.tsx
│   ├── ActionResultPage.tsx
│   ├── tuskdue/
│   │   ├── DashboardPage.tsx
│   │   └── TaskDetailPage.tsx
│   └── wrenchdue/
│       ├── DashboardPage.tsx
│       ├── VehicleDetailPage.tsx
│       └── AddVehiclePage.tsx
├── hooks/
│   ├── use-auth.ts       # Auth context consumer, token management
│   ├── use-settings.ts   # TanStack Query wrapper for settings
│   ├── use-tasks.ts      # TanStack Query wrapper for TuskDue tasks
│   ├── use-vehicles.ts   # TanStack Query wrapper for WrenchDue vehicles
│   ├── use-tier.ts       # Derive tier from settings, gate features
│   └── use-toast.ts      # Toast context consumer
├── context/
│   ├── auth-context.tsx  # AuthProvider, token storage, refresh logic
│   └── toast-context.tsx # ToastProvider, toast queue
├── lib/
│   ├── types.ts          # Shared TypeScript interfaces (Task, Vehicle, Settings, etc.)
│   ├── constants.ts      # API base, Stripe key, VAPID key, breakpoints
│   └── utils.ts          # Date formatting, relative time, mileage estimation
├── App.tsx               # Router setup, providers
├── main.tsx              # Entry point
└── index.css             # Tailwind imports

public/
├── manifest.json         # PWA manifest
└── sw.js                 # Service worker (via vite-plugin-pwa)

tests/
├── unit/                 # Vitest: API client, hooks, utils
├── component/            # Testing Library: component behavior
├── e2e/                  # Playwright: critical user flows
└── mocks/                # MSW handlers matching api-integration.md
```

**Structure Decision**: Single SPA project (not separate frontend/backend — backend is in a different repo). Both TuskDue and WrenchDue share the same React app with app-specific route namespaces (`/tuskdue/*`, `/wrenchdue/*`) and shared platform routes (`/login`, `/signup`, `/settings`, `/action-result`).

## Complexity Tracking

No constitution violations to justify.
