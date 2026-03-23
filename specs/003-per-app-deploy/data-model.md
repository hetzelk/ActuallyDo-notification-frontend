# Data Model: Per-App Deployment Infrastructure

**Feature**: 003-per-app-deploy | **Date**: 2026-03-23

## Overview

This feature has no database entities. The "data model" consists of configuration files, AWS resource naming conventions, and script interfaces.

## Entity: App Configuration (`deploy/{app}.env`)

Represents the per-app environment configuration file.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `VITE_APP_NAME` | string | Yes | App identifier (lowercase alphanumeric + hyphens) |
| `VITE_APP_DOMAIN` | string | Yes | Production domain (e.g., `tuskdue.com`) |
| `VITE_API_BASE` | string | Yes | Backend API base URL |
| `VITE_STRIPE_PK` | string | No | Stripe publishable key |
| `VITE_VAPID_PUBLIC_KEY` | string | No | VAPID key for push notifications |
| `VITE_APP_URL` | string | Yes | Full production URL (e.g., `https://tuskdue.com`) |

**Validation**: App name must match `^[a-z0-9][a-z0-9-]*[a-z0-9]$` (lowercase alphanumeric + hyphens, no leading/trailing hyphens).

## Entity: AWS Resource Naming Convention

Each app maps to AWS resources using a consistent naming scheme.

| Resource | Naming Pattern | Example (tuskdue) |
|----------|---------------|-------------------|
| S3 bucket | `{app}-frontend` | `tuskdue-frontend` |
| CloudFront OAC | `{app}-frontend-oac` | `tuskdue-frontend-oac` |
| CloudFront distribution | Alias: `{domain}` | Alias: `tuskdue.com` |
| ACM certificate | Domain: `{domain}` | Domain: `tuskdue.com` |
| Route 53 record | A ALIAS: `{domain}` | A ALIAS: `tuskdue.com` |

## Entity: Build Output

Each app build produces output in a separate directory.

| Path | Description |
|------|-------------|
| `dist/{app}/index.html` | Root HTML document (5-minute cache) |
| `dist/{app}/assets/` | Hashed JS/CSS/images (1-year immutable cache) |

## Relationships

```
App Config (deploy/{app}.env)
  └─ 1:1 ─→ AWS Infrastructure Instance
               ├── S3 Bucket ({app}-frontend)
               ├── CloudFront Distribution (domain alias)
               ├── ACM Certificate (domain)
               ├── OAC ({app}-frontend-oac)
               └── Route 53 Record (domain → CloudFront)
  └─ 1:1 ─→ Vite Config (vite.config.{app}.ts)
               └── Build Output (dist/{app}/)
```
