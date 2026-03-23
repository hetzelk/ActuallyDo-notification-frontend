# Quickstart: Per-App Deployment

**Feature**: 003-per-app-deploy | **Date**: 2026-03-23

## Prerequisites

- AWS CLI v2 installed and configured (`aws configure`)
- Node.js 20+ and npm
- Git repository cloned with dependencies installed (`npm install`)
- AWS IAM permissions: S3, CloudFront, ACM, Route 53
- DNS hosted zone for the app's domain in Route 53

## Deploy an Existing App (Most Common)

```bash
# Deploy TuskDue to production
./deploy/deploy.sh tuskdue

# Deploy WrenchDue to production
./deploy/deploy.sh wrenchdue
```

The script builds the app, uploads to S3, and waits for CloudFront cache invalidation to complete.

## Set Up a New App for the First Time

### 1. Create the environment config

```bash
cp deploy/tuskdue.env deploy/newapp.env
# Edit deploy/newapp.env with the new app's domain, API URL, etc.
```

### 2. Create the app entry point

```bash
mkdir -p src/apps/newapp
# Create src/apps/newapp/main.tsx (app entry point)
# Create src/apps/newapp/index.html (HTML template)
```

### 3. Create the Vite config

```bash
# Create vite.config.newapp.ts extending the shared base config
```

### 4. Provision infrastructure

```bash
./deploy/setup.sh newapp
```

This creates the S3 bucket, CloudFront distribution, ACM certificate, and Route 53 record. Takes ~5-10 minutes (mostly waiting for ACM certificate validation).

### 5. Deploy

```bash
./deploy/deploy.sh newapp
```

### 6. Add to CI/CD (optional)

Add the new app's paths to `.github/workflows/deploy.yml`:
- Add a path filter for `src/apps/newapp/**`
- Add a deploy job with concurrency group `deploy-newapp`
- Add the app to the `workflow_dispatch` input choices

## File Structure

```
deploy/
├── setup.sh             # One-time infra provisioning
├── deploy.sh            # Build + upload + invalidate
├── lib/
│   ├── common.sh        # Shared functions
│   └── config.sh        # Config loading
├── tuskdue.env          # TuskDue config
└── wrenchdue.env        # WrenchDue config

.github/workflows/
└── deploy.yml           # CI/CD pipeline

src/apps/
├── tuskdue/
│   ├── main.tsx         # TuskDue entry point
│   └── index.html       # TuskDue HTML template
└── wrenchdue/
    ├── main.tsx         # WrenchDue entry point
    └── index.html       # WrenchDue HTML template

vite.config.tuskdue.ts   # TuskDue build config
vite.config.wrenchdue.ts # WrenchDue build config
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Infrastructure not provisioned` | Run `./deploy/setup.sh {app}` first |
| `Missing config file` | Create `deploy/{app}.env` from template |
| `Build failed` | Check TypeScript errors; previous version remains live |
| `ACM validation stuck` | Verify DNS CNAME record was created in Route 53 |
| `Invalidation timeout` | CloudFront invalidation can take up to 15 min; re-run deploy if needed |
