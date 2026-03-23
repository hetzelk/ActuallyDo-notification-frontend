# Tasks: Per-App Deployment Infrastructure

**Input**: Design documents from `/specs/003-per-app-deploy/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/cli-contract.md, quickstart.md

**Tests**: Not requested — test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and shared script libraries

- [x] T001 Create `deploy/` directory structure with `deploy/lib/` subdirectory
- [x] T002 [P] Create shared validation, logging, and AWS helper functions in `deploy/lib/common.sh` — includes `validate_app_name()` (regex `^[a-z0-9][a-z0-9-]*[a-z0-9]$`), `log_info()`, `log_error()`, `log_success()`, and `require_command()` for checking AWS CLI availability
- [x] T003 [P] Create environment config loader in `deploy/lib/config.sh` — includes `load_config()` to source `deploy/{app}.env`, `export_vite_vars()` using `set -a/+a`, and `get_config_value()` for reading individual values like `VITE_APP_DOMAIN`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Multi-app Vite build setup and per-app environment configurations that MUST be complete before any deployment scripts can work

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Parameterize `vite.config.ts` to read `VITE_APP` environment variable — dynamically set `root` to `src/apps/${app}/`, `build.outDir` to `dist/${app}/`, preserve existing `@` alias resolving to top-level `src/`, and keep React + Tailwind CSS plugins. Fall back to current behavior when `VITE_APP` is not set.
- [x] T005 [P] Create TuskDue entry point at `src/apps/tuskdue/index.html` and `src/apps/tuskdue/main.tsx` — HTML references `./main.tsx`, main.tsx bootstraps TuskDue app importing shared components from `@/`
- [x] T006 [P] Create WrenchDue entry point at `src/apps/wrenchdue/index.html` and `src/apps/wrenchdue/main.tsx` — same structure as TuskDue, bootstraps WrenchDue app
- [x] T007 [P] Create TuskDue environment config at `deploy/tuskdue.env` with fields: `VITE_APP_NAME`, `VITE_APP_DOMAIN`, `VITE_API_BASE`, `VITE_STRIPE_PK`, `VITE_VAPID_PUBLIC_KEY`, `VITE_APP_URL` per data-model.md schema
- [x] T008 [P] Create WrenchDue environment config at `deploy/wrenchdue.env` with same field structure as `deploy/tuskdue.env`
- [x] T009 Add per-app npm scripts to `package.json`: `dev:tuskdue`, `dev:wrenchdue`, `build:tuskdue`, `build:wrenchdue`, `build:all` — using `VITE_APP={name}` prefix before vite commands

**Checkpoint**: Foundation ready — per-app builds work locally via `npm run build:tuskdue`

---

## Phase 3: User Story 1 — Deploy a New App for the First Time (Priority: P1) 🎯 MVP

**Goal**: A developer can provision AWS infrastructure for a named app and deploy it for the first time using two scripts: `setup.sh` and `deploy.sh`

**Independent Test**: Run `./deploy/setup.sh tuskdue` and verify S3 bucket, CloudFront distribution, ACM certificate, and Route 53 record are created. Then run `./deploy/deploy.sh tuskdue` and verify the app is accessible at its domain.

### Implementation for User Story 1

- [x] T010 [US1] Implement S3 bucket provisioning in `deploy/setup.sh` — source `deploy/lib/common.sh` and `deploy/lib/config.sh`, validate app name, load config, create private S3 bucket (`{app}-frontend`), block all public access via `put-public-access-block`
- [x] T011 [US1] Add Origin Access Control creation to `deploy/setup.sh` — create OAC named `{app}-frontend-oac` with sigv4 signing protocol and `s3` origin type
- [x] T012 [US1] Add ACM certificate provisioning to `deploy/setup.sh` — request certificate in `us-east-1` for the app's domain, create DNS validation CNAME in Route 53 via `change-resource-record-sets` with UPSERT, wait for certificate validation with `aws acm wait certificate-validated`
- [x] T013 [US1] Add CloudFront distribution creation to `deploy/setup.sh` — create distribution config JSON with: S3 origin via OAC, HTTPS redirect, ACM certificate, custom error responses (403→/index.html, 404→/index.html for SPA routing), HTTP/2+3, domain alias. Use `CallerReference` with timestamp for idempotency.
- [x] T014 [US1] Add S3 bucket policy and Route 53 DNS record to `deploy/setup.sh` — set bucket policy allowing CloudFront service principal with source ARN condition, create Route 53 A ALIAS record pointing to CloudFront (hosted zone ID `Z2FDTNDATAQYW2`)
- [x] T015 [US1] Add idempotency checks to `deploy/setup.sh` — check each resource before creating: `head-bucket` for S3, `list-certificates` by domain for ACM, `list-origin-access-controls` by name for OAC, `list-distributions` by alias for CloudFront. Skip creation if exists, report existing infrastructure details. Output summary per cli-contract.md format.
- [x] T016 [US1] Implement build and validation step in `deploy/deploy.sh` — source shared libs, validate app name, load config, verify infrastructure exists (check S3 bucket + CloudFront distribution ID), run `VITE_APP={app} npx vite build`, validate `dist/{app}/` is non-empty, exit with distinct error codes per cli-contract.md (1=invalid name, 2=missing config, 3=no infra, 4=build failed, 5=empty output)
- [x] T017 [US1] Add S3 upload with differentiated cache headers to `deploy/deploy.sh` — sync `dist/{app}/assets/` to `s3://{app}-frontend/assets/` with `Cache-Control: public, max-age=31536000, immutable` and `--delete` flag, then copy `dist/{app}/index.html` to `s3://{app}-frontend/index.html` with `Cache-Control: public, max-age=300, s-maxage=300`. Upload assets before index.html.
- [x] T018 [US1] Add CloudFront invalidation with wait and deployment reporting to `deploy/deploy.sh` — create invalidation for `/index.html` and `/`, wait for completion with `aws cloudfront wait invalidation-completed`, report success with URL, commit hash (`git rev-parse --short HEAD`), and elapsed time per cli-contract.md output format

**Checkpoint**: User Story 1 complete — `./deploy/setup.sh tuskdue` provisions infrastructure, `./deploy/deploy.sh tuskdue` builds and deploys the app

---

## Phase 4: User Story 2 — Redeploy an Existing App After Code Changes (Priority: P1)

**Goal**: A developer can safely redeploy any app after code changes. Build failures abort without affecting the live site. Deploying one app does not affect another.

**Independent Test**: Make a visible code change, run `./deploy/deploy.sh tuskdue`, verify the change is live. Then introduce a build error, run deploy again, verify the script exits with error and the previous version remains live.

### Implementation for User Story 2

- [x] T019 [US2] Add graceful build failure handling to `deploy/deploy.sh` — capture build exit code, on failure print clear error message (`Build failed. No changes deployed. Previous version remains live.`), exit with code 4 without uploading anything (FR-004)
- [x] T020 [US2] Add empty build output detection to `deploy/deploy.sh` — after successful build, verify `dist/{app}/index.html` exists and `dist/{app}/assets/` is non-empty, exit with code 5 and clear error if empty
- [x] T021 [US2] Add exponential backoff retry for transient AWS API failures to `deploy/lib/common.sh` — implement `retry_with_backoff()` function (max 3 retries, 2s/4s/8s delays) and use it in `deploy/deploy.sh` for S3 sync and CloudFront invalidation calls, and in `deploy/setup.sh` for AWS resource creation calls

**Checkpoint**: User Stories 1 AND 2 complete — deployments are safe, idempotent, and isolated per app

---

## Phase 5: User Story 3 — Automated Deployment on Code Push (Priority: P2)

**Goal**: Pushing code to main automatically detects which app(s) changed and deploys only those apps. Manual dispatch allows deploying any specific app on demand.

**Independent Test**: Push a change to a TuskDue-specific file on main, verify only TuskDue is deployed via GitHub Actions. Push a change to shared code, verify both apps are deployed.

### Implementation for User Story 3

- [x] T022 [US3] Create `.github/workflows/deploy.yml` with triggers and permissions — `push` to `main` branch + `workflow_dispatch` with `app` choice input (`tuskdue`, `wrenchdue`, `all`), set `permissions: { id-token: write, contents: read }`
- [x] T023 [US3] Add change detection job to `.github/workflows/deploy.yml` — use `dorny/paths-filter` with filters: `tuskdue` (`src/apps/tuskdue/**`, `deploy/tuskdue.env`), `wrenchdue` (`src/apps/wrenchdue/**`, `deploy/wrenchdue.env`), `shared` (`src/components/**`, `src/hooks/**`, `src/lib/**`, `src/context/**`, `src/api/**`, `src/index.css`). Output boolean per app.
- [x] T024 [US3] Add TuskDue deploy job to `.github/workflows/deploy.yml` — conditional on `changes.outputs.tuskdue == 'true' || changes.outputs.shared == 'true' || github.event.inputs.app == 'tuskdue' || github.event.inputs.app == 'all'`, concurrency group `deploy-tuskdue` with `cancel-in-progress: false`, use `aws-actions/configure-aws-credentials` with OIDC `role-to-assume`, checkout code, `npm ci`, run `./deploy/deploy.sh tuskdue`
- [x] T025 [US3] Add WrenchDue deploy job to `.github/workflows/deploy.yml` — same structure as TuskDue job with `wrenchdue` substituted, concurrency group `deploy-wrenchdue`

**Checkpoint**: Automated deployments work — pushes to main trigger selective deploys, manual dispatch works for on-demand deploys

---

## Phase 6: User Story 4 — Add a New Niche App to the Platform (Priority: P3)

**Goal**: A new app can be provisioned and deployed using the existing scripts with zero modifications to deployment tooling — only configuration (env file, entry point, workflow dispatch options).

**Independent Test**: Create a `deploy/gardendue.env` and minimal `src/apps/gardendue/` entry point, run `./deploy/setup.sh gardendue` and `./deploy/deploy.sh gardendue`, verify it works identically to existing apps.

### Implementation for User Story 4

- [x] T026 [US4] Validate generic script behavior by adding onboarding documentation as comments in `deploy/setup.sh` and `deploy/deploy.sh` — add header comments explaining how to add a new app (create env file, create entry point, run setup, run deploy), verify no app-specific hardcoding exists in scripts
- [x] T027 [US4] Add new app onboarding instructions to `.github/workflows/deploy.yml` — add comments explaining how to add a new app's deploy job (copy existing job, update app name, add paths-filter entry, add to workflow_dispatch choices)

**Checkpoint**: All 4 user stories complete — scripts are generic, documented, and any new app can be onboarded

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final hardening and validation

- [x] T028 [P] Set executable permissions on all deploy scripts (`chmod +x deploy/setup.sh deploy/deploy.sh`) and ensure proper shebang lines (`#!/usr/bin/env bash`) and `set -euo pipefail` in all `.sh` files
- [x] T029 Validate end-to-end flow against quickstart.md — verify all documented commands, file paths, and troubleshooting steps match actual implementation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001) for directory structure — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion — setup.sh and deploy.sh need shared libs, Vite config, env files
- **US2 (Phase 4)**: Depends on Phase 3 (US1) — hardening requires the base deploy.sh to exist
- **US3 (Phase 5)**: Depends on Phase 3 (US1) — CI/CD calls deploy.sh which must exist
- **US4 (Phase 6)**: Depends on Phases 3-5 — validates that all scripts are generic
- **Polish (Phase 7)**: Depends on all prior phases

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **US2 (P1)**: Depends on US1 — adds error handling to scripts created in US1
- **US3 (P2)**: Depends on US1 — workflow calls `deploy.sh` created in US1
- **US4 (P3)**: Depends on US1, US3 — validates scripts + workflow are generic

### Within Each User Story

- Scripts before validation
- Core implementation before edge case handling
- Local scripts (US1, US2) before CI/CD automation (US3)

### Parallel Opportunities

- T002 and T003 can run in parallel (different files in `deploy/lib/`)
- T005, T006, T007, T008 can all run in parallel (different files, no dependencies)
- T024 and T025 can run in parallel (different jobs in same workflow file, but same file — sequential recommended)
- T026 and T027 can run in parallel (different files)
- T028 and T029 can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```
# After T004 (vite.config.ts), launch all entry points + configs in parallel:
Task T005: "Create src/apps/tuskdue/index.html and main.tsx"
Task T006: "Create src/apps/wrenchdue/index.html and main.tsx"
Task T007: "Create deploy/tuskdue.env"
Task T008: "Create deploy/wrenchdue.env"
```

## Parallel Example: Phase 1 (Setup)

```
# After T001 (directory structure), launch shared libs in parallel:
Task T002: "Create deploy/lib/common.sh"
Task T003: "Create deploy/lib/config.sh"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T009)
3. Complete Phase 3: User Story 1 (T010-T018)
4. **STOP and VALIDATE**: Run `./deploy/setup.sh tuskdue` and `./deploy/deploy.sh tuskdue` against a real AWS account
5. Deploy if ready — the app is live

### Incremental Delivery

1. Setup + Foundational → Multi-app Vite builds work locally
2. US1 → First app deployed to production (MVP!)
3. US2 → Deployments are hardened with error handling and retries
4. US3 → Automated CI/CD on push to main
5. US4 → Verified generic, documented onboarding for future apps
6. Polish → Executable permissions, quickstart validation

### Sequential Execution (Recommended)

This feature has sequential dependencies (US2→US1, US3→US1, US4→US1+US3), so sequential execution in priority order is the natural approach:

1. Phase 1 → Phase 2 → Phase 3 (US1) → Phase 4 (US2) → Phase 5 (US3) → Phase 6 (US4) → Phase 7

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All scripts use Bash + AWS CLI per research.md decision R1-R5
- AWS resource naming follows data-model.md conventions
- Script interfaces follow contracts/cli-contract.md specifications
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
