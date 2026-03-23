# Research: Per-App Deployment Infrastructure

**Feature**: 003-per-app-deploy | **Date**: 2026-03-23

## R1: Multi-App Vite Build Strategy

**Decision**: Single parameterized `vite.config.ts` using a `VITE_APP` environment variable to select the app.

**Rationale**: All apps share the same plugins (React, Tailwind), aliases, and build pipeline — only the entry point and output directory differ. A single config with dynamic `root` avoids duplicating shared settings across per-app config files. The `VITE_APP` env var keeps `--mode` free for its standard purpose (development/production).

**Approach**:
- Create `src/apps/{name}/index.html` and `src/apps/{name}/main.tsx` per app
- Single `vite.config.ts` reads `VITE_APP` env var to set `root` to `src/apps/{app}/` and `build.outDir` to `dist/{app}/`
- Build via `VITE_APP=tuskdue vite build`
- The `@` alias still resolves to top-level `src/` for shared code imports
- Add npm scripts: `build:tuskdue`, `build:wrenchdue`, `dev:tuskdue`, `dev:wrenchdue`

**Alternatives considered**:
- Separate config files per app (`vite.config.tuskdue.ts`): Works but duplicates shared plugin/alias setup across files
- Vite `--mode` flag for app selection: Conflicts with standard mode usage (development/production/staging) and `.env` file loading
- Vite multi-page mode (`build.rollupOptions.input`): Designed for MPA, not separate SPAs with independent routing
- Turborepo/Nx workspaces: Overkill for 2-3 apps sharing a single `src/` directory

## R2: S3 + CloudFront Infrastructure (setup.sh)

**Decision**: S3 with Origin Access Control (OAC) + CloudFront + ACM certificates.

**Rationale**: OAC is the current AWS recommendation (OAI is legacy). Keeps S3 fully private — only CloudFront can access it. ACM provides free SSL certificates with auto-renewal.

**Approach**:
1. **S3 bucket**: Private bucket (no website hosting), all public access blocked
2. **OAC**: Create Origin Access Control for CloudFront → S3 access
3. **ACM certificate**: Request in us-east-1 (required for CloudFront), DNS validation via Route 53
4. **CloudFront distribution**: Points to S3 via OAC, custom error response 403→/index.html (SPA routing), HTTPS redirect, HTTP/2+3
5. **Bucket policy**: Allow CloudFront service principal with source ARN condition
6. **Route 53**: A record ALIAS to CloudFront distribution (works at zone apex)

**Idempotency patterns**:
| Resource | Check | Action if exists |
|----------|-------|------------------|
| S3 bucket | `head-bucket` exit code | Skip creation |
| ACM cert | `list-certificates` filtered by domain | Reuse existing ARN |
| OAC | `list-origin-access-controls` by name | Reuse existing ID |
| CloudFront | `list-distributions` by alias | Skip or update with ETag |
| Route 53 | N/A | `UPSERT` is inherently idempotent |

**Key gotchas**:
- ACM cert MUST be in us-east-1 regardless of bucket region
- S3 REST endpoint returns 403 (not 404) for missing objects with OAC — handle both in custom error responses
- Use `CallerReference` with timestamp for CloudFront create idempotency
- CloudFront update requires ETag from `get-distribution-config`

## R3: Deploy Script Strategy (deploy.sh)

**Decision**: Build app, sync assets with appropriate cache headers, invalidate CloudFront and wait.

**Rationale**: Upload order matters — assets first, then index.html — to prevent referencing non-existent assets. Waiting for invalidation ensures the deploy script reports success only when changes are fully live.

**Approach**:
1. Validate app name (lowercase alphanumeric + hyphens)
2. Load environment config from `deploy/{app}.env`
3. Check infrastructure exists (S3 bucket + CloudFront distribution)
4. Build app: `vite build --config vite.config.{app}.ts`
5. Validate build output is non-empty
6. Upload hashed assets with `Cache-Control: public, max-age=31536000, immutable`
7. Upload index.html with `Cache-Control: public, max-age=300`
8. Create CloudFront invalidation for `/index.html` and `/`
9. Wait for invalidation to complete: `aws cloudfront wait invalidation-completed`

## R4: GitHub Actions CI/CD Pipeline

**Decision**: Single workflow with `dorny/paths-filter` for change detection, per-app concurrency groups, OIDC credentials.

**Rationale**: `dorny/paths-filter` is the most mature path-based filter action. Built-in `concurrency` with `cancel-in-progress: false` queues deployments naturally. OIDC eliminates long-lived AWS secrets.

**Approach**:
1. **Triggers**: `push` to main + `workflow_dispatch` with app choice input
2. **Change detection job**: `dorny/paths-filter` with filters:
   - `tuskdue`: `src/apps/tuskdue/**`, `deploy/tuskdue.env`
   - `wrenchdue`: `src/apps/wrenchdue/**`, `deploy/wrenchdue.env`
   - `shared`: `src/components/**`, `src/hooks/**`, `src/lib/**`, `src/context/**`, `src/api/**`
3. **Deploy jobs** (one per app): Conditional on change detection OR manual dispatch
   - `concurrency: { group: deploy-{app}, cancel-in-progress: false }` — queues, doesn't cancel
4. **AWS credentials**: `aws-actions/configure-aws-credentials` with OIDC role
5. **Permissions**: `id-token: write`, `contents: read`

**Alternatives considered**:
- `tj-actions/changed-files`: Returns file lists instead of boolean filters — more complex than needed
- Custom `git diff`: Must handle edge cases (first push, force push, merge commits)
- Separate workflows per app: Duplicates logic; harder to maintain
- Access key secrets: Long-lived, less secure than OIDC

## R5: Per-App Environment Configuration

**Decision**: `.env`-style files in `deploy/` directory, loaded by deploy script and injected as `VITE_*` vars at build time.

**Rationale**: Vite natively reads `VITE_*` environment variables and exposes them via `import.meta.env`. Loading from a file before the build step is simpler than managing GitHub Actions env files per app.

**Example `deploy/tuskdue.env`**:
```
VITE_APP_NAME=tuskdue
VITE_APP_DOMAIN=tuskdue.com
VITE_API_BASE=https://api.tuskdue.com
VITE_STRIPE_PK=pk_live_xxx
VITE_VAPID_PUBLIC_KEY=xxx
VITE_APP_URL=https://tuskdue.com
```

The deploy script sources this file (`set -a; source deploy/{app}.env; set +a`) before running `vite build`, making all variables available to Vite's `import.meta.env`.
