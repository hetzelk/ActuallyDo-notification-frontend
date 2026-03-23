# ActuallyDo-notification-frontend Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-23

## Active Technologies
- TanStack Query cache (server state). No new client-side persistence. (002-tuskdue-recurring-tasks)
- Bash 5.x (deploy scripts), TypeScript 5.x strict (build tooling), Node.js 20+ + AWS CLI v2 (S3, CloudFront, ACM, Route 53), Vite 8 (build), GitHub Actions (CI/CD) (003-per-app-deploy)
- S3 (static asset hosting per app) (003-per-app-deploy)

- TypeScript 5.x (strict mode) on Node.js 20+ + React 19, Vite 6, React Router v7, Tailwind CSS v4, shadcn/ui, TanStack Query v5, React Hook Form, Zod, date-fns, Lucide React, Stripe.js, vite-plugin-pwa (001-notification-platform-ui)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x (strict mode) on Node.js 20+: Follow standard conventions

## Recent Changes
- 003-per-app-deploy: Added Bash 5.x (deploy scripts), TypeScript 5.x strict (build tooling), Node.js 20+ + AWS CLI v2 (S3, CloudFront, ACM, Route 53), Vite 8 (build), GitHub Actions (CI/CD)
- 002-tuskdue-recurring-tasks: Added TypeScript 5.x (strict mode) on Node.js 20+ + React 19, Vite 6, React Router v7, Tailwind CSS v4, shadcn/ui, TanStack Query v5, React Hook Form, Zod, date-fns, Lucide React

- 001-notification-platform-ui: Added TypeScript 5.x (strict mode) on Node.js 20+ + React 19, Vite 6, React Router v7, Tailwind CSS v4, shadcn/ui, TanStack Query v5, React Hook Form, Zod, date-fns, Lucide React, Stripe.js, vite-plugin-pwa

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
