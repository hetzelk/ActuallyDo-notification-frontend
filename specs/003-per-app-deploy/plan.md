# Implementation Plan: Per-App Deployment Infrastructure

**Branch**: `003-per-app-deploy` | **Date**: 2026-03-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-per-app-deploy/spec.md`

## Summary

Per-app deployment infrastructure using Bash scripts and AWS CLI to independently provision (S3 + CloudFront + ACM) and deploy each frontend app (TuskDue, WrenchDue, future apps). Includes a one-time `setup.sh` for infrastructure provisioning, a `deploy.sh` for build + upload + cache invalidation, per-app environment configs in `deploy/`, and a GitHub Actions workflow for automated CI/CD with change detection and concurrency control.

## Technical Context

**Language/Version**: Bash 5.x (deploy scripts), TypeScript 5.x strict (build tooling), Node.js 20+
**Primary Dependencies**: AWS CLI v2 (S3, CloudFront, ACM, Route 53), Vite 8 (build), GitHub Actions (CI/CD)
**Storage**: S3 (static asset hosting per app)
**Testing**: Manual script testing + CI dry-run validation
**Target Platform**: AWS (S3 + CloudFront) for hosting; GitHub Actions for CI/CD
**Project Type**: Infrastructure scripts + CI/CD pipeline
**Performance Goals**: Deploy completes in < 5 minutes (SC-002); setup in < 10 minutes (SC-001)
**Constraints**: Scripts must be idempotent (FR-005); zero cross-app impact (FR-009); wait for invalidation (FR-002)
**Scale/Scope**: 2 apps initially (TuskDue, WrenchDue), designed for N apps with no script changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API-Contract First | N/A | No API contracts involved — this is infrastructure tooling |
| II. Mobile-First Responsive Design | N/A | No UI components |
| III. Type Safety | PASS | Scripts are Bash (no TS), but build step uses existing strict TS config |
| IV. Component Simplicity | PASS | Minimal scripts with single responsibilities — no abstractions |
| V. Security by Default | PASS | No secrets in code; uses `VITE_*` env vars; credentials via AWS CLI profiles/env |
| VI. Graceful Degradation | PASS | Scripts handle failures with clear error messages and non-zero exits |
| VII. Per-App Deployment | PASS | Core feature — directly implements this principle |
| Tech Stack Constraints | PASS | Uses existing Vite build; Bash scripts add no new frontend deps |

**Gate result**: PASS — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-per-app-deploy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── cli-contract.md  # Script interface contracts
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
deploy/
├── setup.sh             # One-time infrastructure provisioning per app
├── deploy.sh            # Build + upload + cache invalidation per app
├── lib/
│   ├── common.sh        # Shared functions (validation, logging, AWS helpers)
│   └── config.sh        # Config file loading and VITE_* env injection
├── tuskdue.env          # TuskDue environment configuration
└── wrenchdue.env        # WrenchDue environment configuration

.github/
└── workflows/
    └── deploy.yml       # GitHub Actions workflow (auto + manual deploy)
```

**Structure Decision**: Deploy scripts and per-app configs live in a top-level `deploy/` directory, separate from `src/`. GitHub Actions workflow in `.github/workflows/`. The existing single `vite.config.ts` is parameterized via a `VITE_APP` env var to dynamically set `root` and `build.outDir` per app. Per-app entry points live in `src/apps/{name}/`.

## Post-Design Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. API-Contract First | N/A | No API contracts — infrastructure tooling only |
| II. Mobile-First Responsive Design | N/A | No UI components |
| III. Type Safety | PASS | Vite configs are TypeScript; Bash scripts validated via ShellCheck conventions |
| IV. Component Simplicity | PASS | Two scripts + two shared libs; no premature abstractions |
| V. Security by Default | PASS | OIDC for CI/CD (no long-lived secrets); `VITE_*` only; S3 private via OAC |
| VI. Graceful Degradation | PASS | Distinct exit codes per failure mode; build failures don't affect live site |
| VII. Per-App Deployment | PASS | Independent S3 buckets, CloudFront distributions, and concurrency groups per app |
| Tech Stack Constraints | PASS | No new frontend dependencies added |

**Post-design gate result**: PASS — no violations. Design is consistent with constitution.

## Complexity Tracking

No constitution violations to justify.
