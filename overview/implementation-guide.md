# Frontend Implementation Guide

Decisions and conventions for building the TuskDue and WrenchDue frontends.

---

## 1. Tech Stack

| Layer | Choice |
|-------|--------|
| **Framework** | React 19 + Vite 6 |
| **Language** | TypeScript (strict mode) |
| **Routing** | React Router v7 |
| **Styling** | Tailwind CSS v4 + shadcn/ui |
| **Server state** | TanStack Query v5 (React Query) |
| **Client state** | React Context + useReducer (auth, toasts) |
| **Forms** | React Hook Form + Zod |
| **API client** | Native fetch with typed wrapper (adds auth headers, error parsing) |
| **Icons** | Lucide React |
| **Date handling** | date-fns |
| **Testing** | Vitest + Testing Library + Playwright (E2E) |
| **PWA** | vite-plugin-pwa |

---

## 2. Project Structure

Separate repo per app (`tuskdue-web`, `wrenchdue-web`), same structure:

```
src/
  api/          — typed fetch wrapper, auth, settings, app-specific endpoints
  components/   — ui/ (shadcn), layout/, auth/, settings/, tasks/ (or vehicles/)
  pages/        — route-level components
  hooks/        — use-auth, use-settings, use-tasks, use-tier, use-toast
  context/      — auth-context, toast-context
  lib/          — types, constants, utils
```

---

## 3. State Management

- **Auth tokens**: React Context + localStorage (not cookies — Cognito JWTs are too large)
- **Server data (tasks, settings, vehicles)**: TanStack Query with query key conventions
- **Optimistic updates**: complete, snooze, delete tasks; NOT create (need server ID) or activate (may 403)
- **Token refresh**: background refresh when < 5 min to expiry; redirect to login on failure

---

## 4. Design Tokens

- **Component library**: shadcn/ui primitives (Button, Input, Dialog, Dropdown, Tabs, Toast, Skeleton)
- **Font**: Inter
- **Border radius**: 8px (`rounded-lg`)
- **Max content width**: 672px (`max-w-2xl`)
- **Touch targets**: minimum 44x44px
- **Breakpoints**: 640px (mobile), 768px (tablet), 1024px (desktop)
- **Mobile-first**: base styles for mobile, `sm:`/`md:`/`lg:` for larger
- **Dark mode**: Tailwind `dark:` variant, toggle via class strategy, default to system preference

---

## 5. Testing

- **Unit (Vitest)**: API client, hooks, utility functions, component behavior
- **E2E (Playwright)**: critical flows — signup, task CRUD, snooze/complete, free tier limit, settings, magic link, action result pages
- **API mocking**: MSW (Mock Service Worker) with response shapes matching `api-integration.md`

---

## 6. Environment Variables

```
VITE_API_BASE           — backend API URL
VITE_STRIPE_PK          — Stripe publishable key
VITE_VAPID_PUBLIC_KEY   — VAPID public key for push notifications
VITE_APP_URL            — this app's URL (for redirects)
```

---

## 7. Build & Deployment

- **Build**: `vite build` → static files in `dist/`
- **Host**: S3 + CloudFront per app
- **SPA routing**: CloudFront custom error response — 403/404 → `/index.html` with 200
- **Cache**: hashed assets (1 year), `index.html` (5 minutes)
- **CI/CD**: GitHub Actions — `npm ci` → `build` → `test` → S3 sync → CloudFront invalidation
- **CORS**: backend already allows `localhost:3000`; also allow `localhost:5173` (Vite default) or use Vite proxy

---

## 8. Shared Code Between Apps

Auth, settings, and platform UI are identical across apps. **Copy shared modules** (not a shared package) — the surface is small. Extract to a shared package only if a third app is added.

Shared: api/client, api/auth, api/settings, auth-context, auth components, settings components, action-result page.

---

## 9. Accessibility

- Keyboard navigable (tab order, Enter/Space)
- ARIA labels on icon-only buttons
- Color never sole indicator (pair with text/icons)
- Focus ring visible (`focus-visible:ring-2`)
- Form errors via `aria-live="polite"`
- Modals trap focus
- Touch targets 44x44px minimum

---

## 10. Performance

- Lazy-load settings and detail pages (`React.lazy()`)
- Skeleton screens (not spinners) during loading
- Initial bundle target: < 150 KB gzipped
- LCP target: < 1.5s
