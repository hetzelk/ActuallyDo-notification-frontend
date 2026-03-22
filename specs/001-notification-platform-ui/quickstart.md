# Quickstart: ActuallyDo Notification Platform UI

**Feature**: 001-notification-platform-ui
**Date**: 2026-03-22

## Prerequisites

- Node.js 20+
- npm 10+
- A running instance of the ActuallyDo notification backend (or MSW mocks for development)

## Setup

```bash
# Clone the repository
git clone <repo-url>
cd ActuallyDo-notification-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Edit .env.local with your values:
# VITE_API_BASE=https://your-api-gateway-url.amazonaws.com
# VITE_STRIPE_PK=pk_test_...
# VITE_VAPID_PUBLIC_KEY=your-vapid-key
# VITE_APP_URL=http://localhost:5173
```

## Development

```bash
# Start dev server (port 5173)
npm run dev

# Run with API mocking (MSW - no backend needed)
npm run dev:mock
```

## Testing

```bash
# Unit + component tests
npm test

# Watch mode
npm run test:watch

# E2E tests (requires dev server running)
npm run test:e2e

# Type checking
npm run typecheck
```

## Build

```bash
# Production build
npm run build

# Preview production build locally
npm run preview
```

## Verification Checklist

After setup, verify each of these works:

1. `npm run dev` starts without errors on `http://localhost:5173`
2. Navigate to `/signup` — form renders with email, password, confirm password fields
3. Navigate to `/login` — form renders with email, password fields
4. Navigate to `/nagme` (unauthenticated) — redirects to `/login`
5. `npm test` passes all unit/component tests
6. `npm run typecheck` exits with no errors
7. `npm run build` produces output in `dist/` under 150 KB gzipped (JS)

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE` | Yes | Backend API base URL | `https://abc123.execute-api.us-east-1.amazonaws.com` |
| `VITE_STRIPE_PK` | For payments | Stripe publishable key | `pk_test_...` |
| `VITE_VAPID_PUBLIC_KEY` | For push | VAPID public key for push notifications | `BEl62i...` |
| `VITE_APP_URL` | For redirects | This app's public URL | `https://app.nagme.com` |

## Project Structure Overview

```
src/
├── api/          — Typed API client with auth headers
├── components/   — UI components (shadcn/ui, layout, feature-specific)
├── pages/        — Route-level page components
├── hooks/        — Custom React hooks (auth, data fetching, tier)
├── context/      — React Context providers (auth, toast)
├── lib/          — Types, constants, utilities
├── App.tsx       — Router and provider setup
└── main.tsx      — Entry point
```
