# Implementation Plan: TuskDue Recurring Tasks

**Branch**: `002-tuskdue-recurring-tasks` | **Date**: 2026-03-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-tuskdue-recurring-tasks/spec.md`

## Summary

Add recurring/repeating task support to the TuskDue frontend: recurrence configuration UI in the add/edit task forms, recurrence indicators on task cards, enhanced completion toasts showing next occurrence dates, and a delete confirmation dialog that distinguishes between "delete this only" and "delete and stop recurrence." The backend handles auto-creation of next occurrences — the frontend sends recurrence metadata and displays what the API returns.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) on Node.js 20+
**Primary Dependencies**: React 19, Vite 6, React Router v7, Tailwind CSS v4, shadcn/ui, TanStack Query v5, React Hook Form, Zod, date-fns, Lucide React
**Storage**: TanStack Query cache (server state). No new client-side persistence.
**Testing**: Vitest + Testing Library (unit/component), MSW (API mocking), Playwright (E2E)
**Target Platform**: Web (modern browsers). PWA-installable on mobile.
**Project Type**: Single-page web application (SPA) — frontend feature addition
**Performance Goals**: No new bundle > 5 KB gzipped for recurrence UI. No perceptible latency increase.
**Constraints**: Mobile-first responsive, 44px touch targets, API-contract-first (MSW mocks until backend ready)
**Scale/Scope**: ~5 new/modified components, 1 new Zod schema, extended Task type, updated MSW handlers

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API-Contract First | PASS | New recurrence fields will be documented in contracts/api-recurrence.md before implementation. MSW mocks will match these shapes. Backend API does not exist yet — frontend defines the expected contract. |
| II. Mobile-First Responsive | PASS | Recurrence UI will be inline within existing mobile-first forms. No new pages — recurrence config is a collapsible section within AddTaskForm and TaskDetailPage. |
| III. Type Safety | PASS | RecurrenceRule interface will be defined in types.ts. Zod schema will validate recurrence form inputs. No `any` types. |
| IV. Component Simplicity | PASS | RecurrenceConfig is a single new component used in 2 places (add form, detail view). No premature abstractions. Delete confirmation extends existing Dialog. |
| V. Security by Default | PASS | No new auth flows. Recurrence data sent via existing authenticated fetch wrapper. |
| VI. Graceful Degradation | PASS | Recurrence fields are optional on the Task type (backward compatible with tasks that have no recurrence). Completion toast gracefully falls back if no next_occurrence in response. |

No violations. All gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/002-tuskdue-recurring-tasks/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── api-recurrence.md # Recurrence API contract extensions
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── api/
│   └── tuskdue.ts              # Extended: recurrence fields in create/update, delete with stop_recurrence param
├── components/
│   ├── tasks/
│   │   ├── AddTaskForm.tsx    # Extended: RecurrenceConfig section (shown when due_date is set)
│   │   ├── TaskCard.tsx       # Extended: recurrence indicator icon (Repeat from Lucide)
│   │   ├── TaskDetail.tsx     # Extended: RecurrenceConfig section for editing
│   │   ├── RecurrenceConfig.tsx  # NEW: frequency selector, interval, end condition
│   │   └── DeleteTaskDialog.tsx  # NEW: recurring task delete options dialog
│   └── ui/                    # Existing shadcn/ui primitives (no new ones expected)
├── hooks/
│   └── use-tasks.ts           # Extended: useDeleteTask mutation updated for stop_recurrence
├── lib/
│   ├── types.ts               # Extended: RecurrenceRule, RecurrenceEndCondition, Task.recurrence
│   ├── schemas.ts             # Extended: recurrenceSchema Zod validation
│   └── utils.ts               # Extended: getRecurrenceLabel() display helper
├── pages/
│   └── tuskdue/
│       └── DashboardPage.tsx  # Extended: completion toast shows next due date
└── mocks/
    └── handlers.ts            # Extended: MSW handlers for recurrence in task CRUD + complete
```

**Structure Decision**: This is a feature addition to an existing SPA. No new directories needed — all changes extend existing files or add 2 new components in existing directories.

## Complexity Tracking

No violations to justify. All changes follow existing patterns.
