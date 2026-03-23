# CLI Contracts: Deploy Scripts

**Feature**: 003-per-app-deploy | **Date**: 2026-03-23

## setup.sh — Infrastructure Provisioning

### Usage

```bash
./deploy/setup.sh <app-name>
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `app-name` | Yes | Lowercase alphanumeric + hyphens (e.g., `tuskdue`) |

### Behavior

1. Validates app name format
2. Loads `deploy/{app-name}.env` (exits with error if missing)
3. Checks if infrastructure already exists (idempotent)
4. If new: creates S3 bucket → OAC → ACM cert → waits for validation → CloudFront distribution → bucket policy → Route 53 record
5. If existing: reports status and exits successfully

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Infrastructure provisioned (or already exists) |
| 1 | Invalid app name |
| 2 | Missing config file (`deploy/{app-name}.env`) |
| 3 | AWS API error (after retries) |

### Output (success)

```
[setup] Infrastructure for 'tuskdue' is ready.
  S3 bucket:     tuskdue-frontend
  CloudFront:    d1234abcdef.cloudfront.net
  Domain:        tuskdue.com
  Certificate:   arn:aws:acm:us-east-1:123456789:certificate/abc-123
```

### Output (already exists)

```
[setup] Infrastructure for 'tuskdue' already exists. No changes made.
  S3 bucket:     tuskdue-frontend
  CloudFront:    d1234abcdef.cloudfront.net
  Domain:        tuskdue.com
```

---

## deploy.sh — Build & Deploy

### Usage

```bash
./deploy/deploy.sh <app-name>
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `app-name` | Yes | Lowercase alphanumeric + hyphens (e.g., `tuskdue`) |

### Behavior

1. Validates app name format
2. Loads `deploy/{app-name}.env`
3. Verifies infrastructure exists (S3 bucket + CloudFront distribution)
4. Runs `vite build --config vite.config.{app-name}.ts`
5. Validates build output is non-empty
6. Syncs hashed assets to S3 with 1-year immutable cache headers
7. Copies index.html to S3 with 5-minute cache headers
8. Creates CloudFront invalidation for `/index.html` and `/`
9. Waits for invalidation to complete
10. Reports success with deployment details

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Deployment successful |
| 1 | Invalid app name |
| 2 | Missing config file (`deploy/{app-name}.env`) |
| 3 | Infrastructure not provisioned (run setup.sh first) |
| 4 | Build failed |
| 5 | Empty build output |
| 6 | S3 upload failed |
| 7 | CloudFront invalidation failed or timed out |

### Output (success)

```
[deploy] Building tuskdue...
[deploy] Build complete. Output: dist/tuskdue/ (15 files, 2.3 MB)
[deploy] Uploading assets to s3://tuskdue-frontend/assets/...
[deploy] Uploading index.html to s3://tuskdue-frontend/...
[deploy] Invalidating CloudFront cache...
[deploy] Waiting for invalidation to complete...
[deploy] ✓ Deployment complete for 'tuskdue'
  URL:     https://tuskdue.com
  Commit:  abc1234
  Time:    45s
```

### Output (build failure)

```
[deploy] Building tuskdue...
[deploy] ✗ Build failed. No changes deployed. Previous version remains live.
```

---

## GitHub Actions Workflow — deploy.yml

### Triggers

| Trigger | Condition | Behavior |
|---------|-----------|----------|
| `push` to `main` | Automatic | Detects changed apps via path filters, deploys affected apps |
| `workflow_dispatch` | Manual | Deploys selected app(s) via input dropdown |

### Manual Dispatch Input

| Input | Type | Options | Default |
|-------|------|---------|---------|
| `app` | choice | `tuskdue`, `wrenchdue`, `all` | `all` |

### Path Filters (for push trigger)

| Filter | Paths | Deploys |
|--------|-------|---------|
| `tuskdue` | `src/apps/tuskdue/**`, `deploy/tuskdue.env`, `vite.config.tuskdue.ts` | TuskDue only |
| `wrenchdue` | `src/apps/wrenchdue/**`, `deploy/wrenchdue.env`, `vite.config.wrenchdue.ts` | WrenchDue only |
| `shared` | `src/components/**`, `src/hooks/**`, `src/lib/**`, `src/context/**`, `src/api/**`, `src/index.css` | All apps |

### Concurrency

Each app deploy job has its own concurrency group:
- Group: `deploy-{app-name}`
- `cancel-in-progress: false` (queues, does not cancel)

### Required Secrets/Configuration

| Name | Type | Description |
|------|------|-------------|
| AWS IAM Role ARN | OIDC | Role for `aws-actions/configure-aws-credentials` |
| `permissions.id-token` | `write` | Required for OIDC token exchange |
| `permissions.contents` | `read` | Required for checkout |
