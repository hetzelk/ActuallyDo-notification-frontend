# Deployment Guide

Each app (TuskDue, WrenchDue, etc.) is deployed independently to its own S3 + CloudFront infrastructure. Replace `<app>` below with the app name (e.g., `tuskdue`, `wrenchdue`).

## Prerequisites

- **AWS CLI v2** installed and configured (`aws configure`)
- **Node.js 20+** and npm
- AWS IAM permissions: S3, CloudFront, ACM, Route 53
- A Route 53 hosted zone for the app's domain

## First Deploy

### 1. Update the environment config

Edit `deploy/<app>.env` and replace placeholder values with real ones:

```
VITE_STRIPE_PK=pk_live_...        # Your Stripe publishable key
VITE_VAPID_PUBLIC_KEY=...          # Your VAPID public key for push notifications
```

The domain and API URL should already be set. Verify they're correct.

### 2. Provision infrastructure

```bash
./deploy/setup.sh <app>
```

This creates the S3 bucket, CloudFront distribution, ACM certificate, and Route 53 DNS record. Takes ~5-10 minutes (mostly waiting for ACM certificate validation).

The script is idempotent — safe to re-run if interrupted.

### 3. Deploy the app

```bash
./deploy/deploy.sh <app>
```

This builds the app, uploads assets to S3, and waits for CloudFront cache invalidation to complete.

## Redeploy After Code Changes

```bash
./deploy/deploy.sh <app>
```

That's it. The script rebuilds, uploads new assets, and invalidates the cache. The previous version stays live until the new one is fully uploaded.

If the build fails, nothing is uploaded — the live site is unaffected.

## Apps

| App | Command | Domain |
|-----|---------|--------|
| TuskDue | `./deploy/deploy.sh tuskdue` | tuskdue.com |
| WrenchDue | `./deploy/deploy.sh wrenchdue` | wrenchdue.com |

## Adding a New App

1. Create `deploy/<app>.env` (copy from an existing one, update values)
2. Create `src/apps/<app>/index.html` and `src/apps/<app>/main.tsx`
3. Run `./deploy/setup.sh <app>`
4. Run `./deploy/deploy.sh <app>`

## Automated Deploys (CI/CD)

Pushes to `main` automatically deploy affected apps via GitHub Actions. The workflow detects which files changed and only deploys the relevant app(s). Shared code changes trigger both apps.

To manually deploy from GitHub Actions, use the "Run workflow" button and select the target app.

Requires the `AWS_DEPLOY_ROLE_ARN` secret to be configured in the repo settings.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Infrastructure not provisioned` | Run `./deploy/setup.sh <app>` first |
| `Missing config file` | Create `deploy/<app>.env` |
| `Build failed` | Check TypeScript errors; live site is unaffected |
| `ACM validation stuck` | Verify the DNS CNAME record exists in Route 53 |
| `Invalidation timeout` | Re-run `./deploy/deploy.sh <app>` — it will retry |
