# Tasks: ActuallyDo Notification Platform UI

**Input**: Design documents from `/specs/001-notification-platform-ui/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and tooling

- [ ] T001 Initialize Vite 6 + React 19 + TypeScript project in repository root
- [ ] T002 Install and configure Tailwind CSS v4 via `@tailwindcss/vite` plugin in vite.config.ts
- [ ] T003 [P] Install shadcn/ui and add base components (Button, Input, Dialog, Dropdown, Tabs, Toast, Skeleton) in src/components/ui/
- [ ] T004 [P] Install and configure React Router v7 with route definitions in src/App.tsx
- [ ] T005 [P] Install and configure TanStack Query v5 with QueryClientProvider in src/App.tsx
- [ ] T006 [P] Install React Hook Form + Zod + date-fns + Lucide React dependencies
- [ ] T007 [P] Create .env.example with VITE_API_BASE, VITE_STRIPE_PK, VITE_VAPID_PUBLIC_KEY, VITE_APP_URL
- [ ] T008 [P] Configure Vitest + Testing Library in vitest.config.ts and test setup file
- [ ] T009 [P] Configure ESLint + Prettier for TypeScript + React

**Checkpoint**: Dev server runs, all tooling configured, empty shell renders.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T010 Create typed API fetch wrapper with auth headers, JSON parsing, and error handling in src/api/client.ts
- [ ] T011 [P] Define all shared TypeScript interfaces (AuthTokens, AuthState, PlatformSettings, AppSettings, ApiError) in src/lib/types.ts
- [ ] T012 [P] Define TuskDue types (Task, TaskListResponse, CreateTaskRequest, UpdateTaskRequest, SnoozeRequest, ActivateRequest) in src/lib/types.ts
- [ ] T013 [P] Define WrenchDue types (Vehicle, MaintenanceItem, MaintenanceLogEntry, CreateVehicleRequest, LogCompletionRequest, UpdateMileageRequest) in src/lib/types.ts
- [ ] T014 [P] Create constants file with API_BASE, BREAKPOINTS, SNOOZE_OPTIONS, TIER_LIMITS in src/lib/constants.ts
- [ ] T015 [P] Create utility functions (formatRelativeDate, formatDate, calculateEstimatedMileage, getTaskGroup) in src/lib/utils.ts
- [ ] T016 Create AuthContext provider with token storage, login/logout, silent refresh logic in src/context/auth-context.tsx
- [ ] T017 Create ToastContext provider with toast queue, auto-dismiss, and toast types in src/context/toast-context.tsx
- [ ] T018 Create useAuth hook consuming AuthContext in src/hooks/use-auth.ts
- [ ] T019 [P] Create useToast hook consuming ToastContext in src/hooks/use-toast.ts
- [ ] T020 Create ProtectedRoute component that redirects to /login if unauthenticated in src/components/auth/ProtectedRoute.tsx
- [ ] T021 Create Shell layout component with Navbar placeholder and PageContainer in src/components/layout/Shell.tsx
- [ ] T022 Wire up React Router with public routes (/login, /signup, /login/magic-link, /action-result) and authenticated layout route wrapping protected routes in src/App.tsx
- [ ] T023 [P] Set up MSW with base request handlers for auth endpoints in tests/mocks/handlers.ts
- [ ] T024 [P] Create Toast UI component (top-right positioned, success/error/info/warning variants, auto-dismiss) in src/components/ui/Toast.tsx

**Checkpoint**: Foundation ready — auth context works, API client configured, routing in place, types defined.

---

## Phase 3: User Story 1 - Sign Up and First Login (Priority: P1) MVP

**Goal**: Users can create an account and log in with email/password

**Independent Test**: Navigate to /signup, create account, verify redirect to dashboard with authenticated session

### Implementation for User Story 1

- [ ] T025 [P] [US1] Create auth API functions (signup, login, refreshToken) in src/api/auth.ts
- [ ] T026 [P] [US1] Create Zod schemas for login form (email, password) and signup form (email, password, confirmPassword) in src/lib/schemas.ts
- [ ] T027 [US1] Create LoginForm component with email/password fields, validation, error states, loading spinner in src/components/auth/LoginForm.tsx
- [ ] T028 [US1] Create SignupForm component with email/password/confirm fields, validation, error states in src/components/auth/SignupForm.tsx
- [ ] T029 [US1] Create LoginPage with centered card layout, LoginForm, links to signup and magic link in src/pages/LoginPage.tsx
- [ ] T030 [US1] Create SignupPage with centered card layout, SignupForm, link to login in src/pages/SignupPage.tsx
- [ ] T031 [US1] Implement post-signup auto-login flow in SignupForm (call login after successful signup, store tokens, redirect to dashboard)
- [ ] T032 [US1] Create a minimal TuskDue DashboardPage placeholder (authenticated landing page) in src/pages/tuskdue/DashboardPage.tsx
- [ ] T033 [US1] Add MSW handlers for POST /platform/auth/signup and POST /platform/auth/login in tests/mocks/handlers.ts

**Checkpoint**: User can sign up, auto-login, and land on authenticated dashboard. Can log in with existing credentials. Token refresh works silently.

---

## Phase 4: User Story 2 - Magic Link Authentication (Priority: P2)

**Goal**: Users can log in via passwordless 6-digit code flow

**Independent Test**: Navigate to /login/magic-link, enter email, enter code, verify redirect to dashboard

### Implementation for User Story 2

- [X] T034 [P] [US2] Add magic link API functions (requestMagicLink, verifyMagicLink) in src/api/auth.ts
- [X] T035 [US2] Create MagicLinkRequestForm component with email field and submit button in src/components/auth/MagicLinkRequestForm.tsx
- [X] T036 [US2] Create MagicLinkVerifyForm component with 6-digit code input, auto-submit, resend with 60s cooldown in src/components/auth/MagicLinkVerifyForm.tsx
- [X] T037 [US2] Create MagicLinkPage with two-step flow (request → verify), back-to-login link in src/pages/MagicLinkPage.tsx
- [X] T038 [US2] Add MSW handlers for POST /platform/auth/magic-link and POST /platform/auth/magic-link/verify in tests/mocks/handlers.ts

**Checkpoint**: Full passwordless login flow works end-to-end.

---

## Phase 5: User Story 3 - TuskDue Task Management (Priority: P1) MVP

**Goal**: Users can view, add, complete, and snooze tasks across Active/Backlog/Completed tabs

**Independent Test**: Log in, add a task with due date, verify it appears in Active tab, mark done, verify it moves to Completed

### Implementation for User Story 3

- [X] T039 [P] [US3] Create TuskDue task API functions (listTasks, createTask, completeTask, snoozeTask, activateTask, deleteTask) in src/api/tuskdue.ts
- [X] T040 [P] [US3] Create useTasks hook with TanStack Query for task list by status, including optimistic updates for complete/snooze/delete in src/hooks/use-tasks.ts
- [X] T041 [P] [US3] Create Zod schema for add-task form (title required, notes optional, due_date optional) in src/lib/schemas.ts
- [X] T042 [US3] Create TaskCard component with completion circle, title, subtitle (overdue/due today/snoozed/upcoming), Done button, Snooze dropdown in src/components/tasks/TaskCard.tsx
- [X] T043 [US3] Create SnoozeDropdown component with 1/3/7 day options and disabled Custom Pro option in src/components/tasks/SnoozeDropdown.tsx
- [X] T044 [US3] Create TaskList component rendering TaskCard array with visual grouping (overdue/due today/snoozed/upcoming sections) in src/components/tasks/TaskList.tsx
- [X] T045 [US3] Create AddTaskForm component with title, notes, due date picker, cancel/submit in src/components/tasks/AddTaskForm.tsx
- [X] T046 [US3] Create BacklogTaskCard component with title, added date, Activate button (opens date picker), overflow menu in src/components/tasks/BacklogTaskCard.tsx
- [X] T047 [US3] Create CompletedTaskCard component with checkmark, title (muted), completed date in src/components/tasks/CompletedTaskCard.tsx
- [X] T048 [US3] Build TuskDue DashboardPage with tab navigation (Active/Backlog/Completed), task counts, FAB for add task on mobile, inline add button on desktop in src/pages/tuskdue/DashboardPage.tsx
- [X] T049 [US3] Create EmptyState component for each tab (no tasks yet, no backlog, no completions) in src/components/shared/EmptyState.tsx
- [X] T050 [US3] Add skeleton loading states for task list in src/components/tasks/TaskListSkeleton.tsx
- [X] T051 [US3] Add MSW handlers for all TuskDue task endpoints (GET list, POST create, POST complete, POST snooze, POST activate, DELETE) in tests/mocks/handlers.ts

**Checkpoint**: Full task management works — add, complete, snooze, activate, delete across all three tabs.

---

## Phase 6: User Story 4 - Task Detail and Editing (Priority: P2)

**Goal**: Users can view and edit task details with auto-save

**Independent Test**: Click a task, edit title, verify change persists after navigating away and back

### Implementation for User Story 4

- [X] T052 [P] [US4] Create useTask hook for single task fetch via TanStack Query in src/hooks/use-task.ts
- [X] T053 [US4] Create TaskDetail component with editable title, notes, due date picker, notify toggle, status line, Mark as Done, Snooze, Delete buttons in src/components/tasks/TaskDetail.tsx
- [X] T054 [US4] Implement auto-save with React Hook Form watch() + 500ms debounce + "Saved" indicator in TaskDetail
- [X] T055 [US4] Create TaskDetailPage with back navigation, delete confirmation dialog, routing in src/pages/tuskdue/TaskDetailPage.tsx
- [X] T056 [US4] Add MSW handlers for GET /apps/tuskdue/tasks/:id and PUT /apps/tuskdue/tasks/:id in tests/mocks/handlers.ts
- [X] T057 [US4] Add route for /tuskdue/tasks/:taskId in src/App.tsx and make TaskCard clickable to navigate to detail

**Checkpoint**: Task detail view with auto-save, delete, complete, snooze all working.

---

## Phase 7: User Story 5 - Platform Settings (Priority: P2)

**Goal**: Users can configure timezone, reminder time, app preferences, and view subscription status

**Independent Test**: Navigate to /settings, change timezone, verify "Saved" confirmation appears

### Implementation for User Story 5

- [X] T058 [P] [US5] Create settings API functions (getSettings, updateSettings) in src/api/settings.ts
- [X] T059 [P] [US5] Create useSettings hook with TanStack Query for settings fetch and mutation with debounced auto-save in src/hooks/use-settings.ts
- [X] T060 [US5] Create ProfileSection component with read-only email, timezone searchable dropdown, reminder time picker, auto-save in src/components/settings/ProfileSection.tsx
- [X] T061 [US5] Create AppPreferenceCard component with enable/disable toggle, frequency dropdown, preferred day dropdown, tier badge in src/components/settings/AppPreferenceCard.tsx
- [X] T062 [US5] Create AppPreferencesSection component rendering AppPreferenceCard for each registered app in src/components/settings/AppPreferencesSection.tsx
- [X] T063 [US5] Create SubscriptionSection component with free/pro states, pricing buttons, manage/cancel for Pro in src/components/settings/SubscriptionSection.tsx
- [X] T064 [US5] Create EmailDisabledBanner warning component for bounced emails in src/components/settings/EmailDisabledBanner.tsx
- [X] T065 [US5] Build SettingsPage assembling all settings sections with section headings in src/pages/SettingsPage.tsx
- [X] T066 [US5] Add MSW handlers for GET /platform/settings and PUT /platform/settings in tests/mocks/handlers.ts

**Checkpoint**: Settings page fully functional with auto-save, all sections rendering correctly.

---

## Phase 8: User Story 6 - Free Tier Limits and Upgrade Prompts (Priority: P2)

**Goal**: Free-tier users see task count indicators and upgrade prompts at limit boundaries

**Independent Test**: Create 15 active tasks, attempt to create a 16th, verify upgrade prompt appears

### Implementation for User Story 6

- [X] T067 [P] [US6] Create useTier hook deriving tier from settings, exposing isFree/isPro and limit checks in src/hooks/use-tier.ts
- [X] T068 [US6] Create UpgradePrompt component with context-specific messaging and upgrade button in src/components/shared/UpgradePrompt.tsx
- [X] T069 [US6] Create TierBadge component showing "Free" or "Pro" with appropriate styling in src/components/shared/TierBadge.tsx
- [X] T070 [US6] Add free-tier task counter to Active tab header ("Active (12 of 15)") with warning color at 13+ in DashboardPage
- [X] T071 [US6] Add 403 limit_reached handling to AddTaskForm and activate flow — show UpgradePrompt on limit
- [X] T072 [US6] Update SnoozeDropdown to show locked "Custom... Pro" option for free-tier users
- [X] T073 [US6] Add Pro teaser card below Active tab task list for free-tier users (heads-up feature promo) in src/components/tasks/ProTeaser.tsx

**Checkpoint**: Free-tier limits visible and enforced in UI, upgrade prompts show at boundaries.

---

## Phase 9: User Story 7 - Stripe Payment and Pro Upgrade (Priority: P3)

**Goal**: Users can upgrade to Pro via Stripe Checkout and see updated tier on return

**Independent Test**: Click upgrade button, complete Stripe Checkout (test mode), verify tier badge changes to "Pro"

### Implementation for User Story 7

- [ ] T074 [US7] Install @stripe/stripe-js and create Stripe checkout helper with price IDs and metadata in src/lib/stripe.ts
- [ ] T075 [US7] Wire pricing buttons in SubscriptionSection to Stripe redirectToCheckout with user_id and app_id metadata
- [ ] T076 [US7] Handle ?payment=success return URL in SettingsPage — re-fetch settings after 2-3s delay to reflect tier update
- [ ] T077 [US7] Handle ?payment=cancelled return URL in SettingsPage — show info toast, no action needed

**Checkpoint**: Full payment flow works — upgrade, return, tier updated.

---

## Phase 10: User Story 8 - Action Result Pages (Priority: P2)

**Goal**: Email action link redirects show correct confirmation screens

**Independent Test**: Navigate to /action-result?status=success&message=Task%20completed, verify success screen renders

### Implementation for User Story 8

- [X] T078 [P] [US8] Create ActionResultSuccess component with green checkmark, "Done!" heading, dynamic message in src/components/shared/ActionResult.tsx
- [X] T079 [P] [US8] Create ActionResultAlreadyUsed component with amber icon, "Already processed" heading in src/components/shared/ActionResult.tsx
- [X] T080 [P] [US8] Create ActionResultExpired component with gray clock, "Link expired" heading in src/components/shared/ActionResult.tsx
- [X] T081 [P] [US8] Create ActionResultError component with red warning, "Something went wrong" heading in src/components/shared/ActionResult.tsx
- [X] T082 [US8] Build ActionResultPage reading status and message from query params, rendering the correct variant in src/pages/ActionResultPage.tsx

**Checkpoint**: All four action result states render correctly from query params.

---

## Phase 11: User Story 9 - WrenchDue Vehicle Dashboard (Priority: P3)

**Goal**: Users can view vehicles, add new vehicles, and update odometer readings

**Independent Test**: Navigate to WrenchDue dashboard, add a vehicle, verify it appears in the vehicle list

### Implementation for User Story 9

- [ ] T083 [P] [US9] Create WrenchDue vehicle API functions (listVehicles, createVehicle, getVehicle, updateVehicle, deleteVehicle, updateMileage) in src/api/wrenchdue.ts
- [ ] T084 [P] [US9] Create useVehicles hook with TanStack Query for vehicle list in src/hooks/use-vehicles.ts
- [ ] T085 [P] [US9] Create Zod schemas for add-vehicle form and mileage update form in src/lib/schemas.ts
- [ ] T086 [US9] Create VehicleCard component with name, estimated mileage, status summary (overdue/coming up/all clear), update mileage and view details buttons in src/components/vehicles/VehicleCard.tsx
- [ ] T087 [US9] Create VehicleList component rendering VehicleCard array in src/components/vehicles/VehicleList.tsx
- [ ] T088 [US9] Create AddVehicleForm component with year, make, model, nickname, odometer, weekly miles fields in src/components/vehicles/AddVehicleForm.tsx
- [ ] T089 [US9] Create MileageCheckInModal with odometer input (pre-filled estimate), optional weekly estimate update in src/components/vehicles/MileageCheckInModal.tsx
- [ ] T090 [US9] Build WrenchDue DashboardPage with vehicle list, add vehicle button (with free-tier lock), empty state in src/pages/wrenchdue/DashboardPage.tsx
- [ ] T091 [US9] Build AddVehiclePage with AddVehicleForm, redirect to vehicle detail on success in src/pages/wrenchdue/AddVehiclePage.tsx
- [ ] T092 [US9] Add MSW handlers for all WrenchDue vehicle endpoints in tests/mocks/handlers.ts

**Checkpoint**: Vehicle dashboard works — list, add, update mileage.

---

## Phase 12: User Story 10 - WrenchDue Maintenance Logging (Priority: P3)

**Goal**: Users can view maintenance items by urgency and log completions

**Independent Test**: Open vehicle detail, click "Log as done" on an item, fill form, verify item moves to All Clear

### Implementation for User Story 10

- [ ] T093 [P] [US10] Add maintenance API functions (listItems, createItem, updateItem, deleteItem, logCompletion, getLog) to src/api/wrenchdue.ts
- [ ] T094 [P] [US10] Create useVehicle hook for single vehicle + items fetch in src/hooks/use-vehicle.ts
- [ ] T095 [US10] Create MaintenanceItem component with name, last completed line, interval line, "Log as done" button, overflow menu in src/components/maintenance/MaintenanceItem.tsx
- [ ] T096 [US10] Create MaintenanceList component grouping items by urgency (Overdue/Coming Up/All Clear) with section headers in src/components/maintenance/MaintenanceList.tsx
- [ ] T097 [US10] Create CompletionForm modal with date, mileage, cost (Pro only), shop (Pro only), notes in src/components/maintenance/CompletionForm.tsx
- [ ] T098 [US10] Create MaintenanceHistory component with log entries (date, item, mileage, cost/shop for Pro) in src/components/maintenance/MaintenanceHistory.tsx
- [ ] T099 [US10] Build VehicleDetailPage with vehicle header, maintenance tabs (Active/History), stale mileage warning, edit vehicle link in src/pages/wrenchdue/VehicleDetailPage.tsx
- [ ] T100 [US10] Add routes for /wrenchdue, /wrenchdue/vehicles/new, /wrenchdue/vehicles/:id in src/App.tsx
- [ ] T101 [US10] Add MSW handlers for maintenance item and log endpoints in tests/mocks/handlers.ts

**Checkpoint**: Full vehicle detail with maintenance tracking — view items, log completions, view history.

---

## Phase 13: User Story 11 - Push Notifications (Priority: P3)

**Goal**: Users can enable/disable push notifications from settings

**Independent Test**: Enable push toggle, accept browser permission, verify subscription sent to backend

### Implementation for User Story 11

- [ ] T102 [US11] Create PushNotificationSection component with enable/disable toggle, status indicator, browser-blocked message in src/components/settings/PushNotificationSection.tsx
- [ ] T103 [US11] Implement push subscription flow — request browser permission, get subscription from service worker, send to backend via PUT /platform/settings
- [ ] T104 [US11] Implement push unsubscribe flow — unsubscribe from browser, send null push_subscription to backend
- [ ] T105 [US11] Add PushNotificationSection to SettingsPage

**Checkpoint**: Push notification toggle works with browser permission and backend sync.

---

## Phase 14: User Story 12 - PWA Installation (Priority: P3)

**Goal**: App is installable as PWA with offline support and push notification handling

**Independent Test**: Open app in Chrome, verify install prompt, install, verify standalone mode

### Implementation for User Story 12

- [ ] T106 [US12] Install and configure vite-plugin-pwa in vite.config.ts with manifest, icons, and workbox precaching
- [ ] T107 [US12] Create service worker with push notification display handler and click-to-open routing
- [ ] T108 [US12] Create OfflineBanner component shown when navigator.onLine is false in src/components/shared/OfflineBanner.tsx
- [ ] T109 [US12] Add offline detection to Shell layout, show OfflineBanner when offline

**Checkpoint**: App installable, shows cached data offline with banner, push notifications display.

---

## Phase 15: Polish & Cross-Cutting Concerns

**Purpose**: Navigation, app switching, responsive refinements, keyboard shortcuts

- [ ] T110 Build Navbar component with app logo (links to dashboard), settings gear icon, user dropdown (Settings, Switch App, Sign Out) in src/components/layout/Navbar.tsx
- [ ] T111 Create AppSwitcher component showing enabled apps with icons, current app highlighted in src/components/layout/AppSwitcher.tsx
- [ ] T112 Wire Navbar and AppSwitcher into Shell layout
- [ ] T113 Add keyboard shortcuts for TuskDue desktop: "n" (new task), Esc (close modal), 1/2/3 (switch tabs), "?" (help) in src/hooks/use-keyboard-shortcuts.ts
- [ ] T114 [P] Responsive pass — verify all pages at 640/768/1024px breakpoints, fix any overflow or touch target issues
- [ ] T115 [P] Add dark mode support via Tailwind dark: variant with system preference detection
- [ ] T116 [P] Lazy-load settings, task detail, and WrenchDue pages via React.lazy() in src/App.tsx
- [ ] T117 Run quickstart.md verification checklist (dev server, signup/login, routing, tests, typecheck, build size)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1 Auth)** + **Phase 5 (US3 Tasks)**: Both P1, can run sequentially after Phase 2. US1 first (auth needed for everything).
- **Phase 4 (US2 Magic Link)**: After Phase 3 (builds on auth components)
- **Phase 6 (US4 Task Detail)**: After Phase 5 (extends task management)
- **Phase 7 (US5 Settings)**: After Phase 2 (independent of task phases)
- **Phase 8 (US6 Free Tier)**: After Phase 5 + Phase 7 (needs tasks + settings)
- **Phase 9 (US7 Stripe)**: After Phase 7 (extends settings)
- **Phase 10 (US8 Action Results)**: After Phase 2 (independent simple page)
- **Phase 11-12 (US9-10 WrenchDue)**: After Phase 2 (independent of TuskDue)
- **Phase 13-14 (US11-12 Push/PWA)**: After Phase 7 (extends settings)
- **Phase 15 (Polish)**: After all desired story phases complete

### Parallel Opportunities

- T003-T009 (Setup): All can run in parallel
- T011-T015 (Types/constants): All can run in parallel
- T039-T041 (TuskDue API/hooks/schemas): Can run in parallel
- T078-T081 (Action result variants): All can run in parallel
- T083-T085 (WrenchDue API/hooks/schemas): All can run in parallel
- T114-T116 (Polish items): Can run in parallel

---

## Implementation Strategy

### MVP First (User Stories 1 + 3)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Auth)
4. Complete Phase 5: User Story 3 (Task Management)
5. **STOP and VALIDATE**: Sign up → add task → complete task works end-to-end
6. Deploy if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 (Auth) → Users can sign up and log in
3. US3 (Tasks) → Core TuskDue task management (MVP!)
4. US8 (Action Results) → Email action links work
5. US4 (Task Detail) → Task editing
6. US5 (Settings) → User preferences
7. US6 (Free Tier) → Monetization gates
8. US2 (Magic Link) → Passwordless auth
9. US7 (Stripe) → Payment flow
10. US9-10 (WrenchDue) → Second app
11. US11-12 (Push/PWA) → Progressive enhancements
12. Polish → Nav, keyboard shortcuts, dark mode, lazy loading

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- WrenchDue tasks (US9-10) can be built with MSW mocks since backend isn't ready yet
