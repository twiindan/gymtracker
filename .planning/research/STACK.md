# Technology Stack

**Project:** GymTracker — Personal gym workout tracking web app
**Researched:** 2025-04-23
**Confidence:** HIGH

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.x | UI framework | Current stable. The app is 100% client-side; React's component model and hooks are ideal for interactive workout logging flows. Server Components add zero value here. |
| Vite | 6.x | Build tool / dev server | Faster HMR and leaner than Next.js for a pure SPA. No SSR complexity to fight. `vite-plugin-pwa` gives first-class offline support. Output is static files deployable anywhere. |
| TypeScript | 5.7+ | Type safety | Essential for domain models (Exercise, Workout, Set, Routine). Catches shape mismatches early as the schema evolves. |

**Why Vite over Next.js:**
This is a single-user, offline-first personal app. Next.js App Router brings SSR, caching rules, and server-component boundaries that solve problems we don't have. Vite produces a static SPA with faster cold-start dev server and simpler mental model. Next.js is the wrong abstraction for an app whose entire data layer lives in the browser.

### Data & State

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Dexie.js | 4.x | Client-side database (IndexedDB wrapper) | The standard for structured offline storage in browsers. Provides queries, indexing, transactions, and schema migrations — all things `localStorage` cannot do. Workout history and exercise search need real database capabilities. |
| Zustand | 5.x | Global client state | Minimal boilerplate, no providers, excellent TypeScript support. For a single-user app, Redux Toolkit is overkill. Zustand's `persist` middleware can optionally mirror critical state to `localStorage` as a fallback. |

**Why Dexie.js over alternatives:**
- **localStorage / sessionStorage**: Sync-only, 5-10MB limit, no querying. Unacceptable for workout history search and PR lookups.
- **SQLite (sql.js / wa-sqlite)**: Gives real SQL but ships a ~1MB WASM binary. Overkill for a personal tracker; Dexie's API is simpler and bundle is smaller.
- **PouchDB / RxDB**: Built for sync/replication. Adds complexity we don't need with no server in the architecture.
- **TanStack Store / Signals**: Newer, but Zustand is more mature and has better ecosystem for persistence middleware.

### UI & Styling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility-first CSS | Mobile-first responsive design is non-negotiable for gym use. v4's CSS-first config (no `tailwind.config.js`) is simpler and faster. |
| shadcn/ui | latest | Headless accessible components | Not a dependency — code you own. Perfect for a personal project where you'll want to tweak every interaction. Built on Radix UI primitives for accessibility. |
| Lucide React | 0.x | Icons | Clean, consistent, tree-shakeable. Standard pairing with shadcn/ui. |

### Forms & Validation

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Hook Form | 7.x | Form state management | Minimal re-renders, uncontrolled by default. Critical for snappy mobile forms when logging sets mid-workout. |
| Zod | 3.x | Schema validation | TypeScript-first. Validates workout data shapes at runtime (e.g., weight > 0, reps >= 0). Integrates seamlessly with RHF via `@hookform/resolvers`. |

### Charts & Visualization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Recharts | 2.x | Progress charts | Declarative React API. Perfect for strength-over-time and volume-over-time line charts. Simpler to theme with Tailwind than Chart.js. |

**Why Recharts over Chart.js:**
Chart.js has more chart types but uses an imperative canvas API. Recharts is SVG-based, React-native, and easier to style responsively with Tailwind. For the 2-3 chart types we need (line, maybe bar), Recharts is the pragmatic choice.

### Date Handling

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| date-fns | 4.x | Date manipulation | Tree-shakeable, functional API. Handles workout date grouping ("this week", "last month") and chart axis formatting. |

### PWA / Offline

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| vite-plugin-pwa | 0.21+ | Service worker / manifest generation | One config object generates web manifest, service worker, and offline caching strategy. Makes the app installable on mobile home screens and resilient to gym WiFi dropouts. |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | Vite 6 | Next.js 15 | SSR, caching, and server component complexity are pure overhead for an offline single-user app. |
| Database | Dexie.js | Supabase / Firebase | Requirements explicitly say no auth, no multi-user. Adding a server adds latency, cost, and network dependency for no benefit. |
| State | Zustand | Redux Toolkit | RTK's entity adapters and thunks solve problems at scale. For one user, Zustand's 1KB bundle and zero boilerplate win. |
| Server state | — | TanStack Query | There is no server. Everything is local. TQ would be a no-op. |
| Charts | Recharts | Chart.js | Imperative canvas API harder to integrate with React lifecycle and Tailwind theming. |
| Styling | Tailwind | CSS Modules / MUI | Tailwind's utility classes are faster to iterate on for a solo developer. MUI's design system fights personal-project customization. |

---

## Installation

```bash
# Scaffold
npm create vite@latest gym-tracker -- --template react-ts
cd gym-tracker

# Core
npm install react@^19 react-dom@^19

# Build / dev (already in Vite template)
npm install -D vite@^6 typescript@^5 @types/react @types/react-dom

# Styling
npm install -D tailwindcss@^4 @tailwindcss/vite

# UI Components (shadcn/ui — uses npx, not npm install)
npx shadcn@latest init

# Data
npm install dexie@^4 zustand@^5

# Forms & validation
npm install react-hook-form@^7 zod@^3 @hookform/resolvers

# Charts & dates
npm install recharts@^2 date-fns@^4

# Icons
npm install lucide-react

# PWA
npm install -D vite-plugin-pwa

# Dev quality of life
npm install -D @vite-pwa/assets-generator  # For auto-generating icons
```

---

## Architecture Notes

### Offline-First Data Flow

```
User logs set (weight x reps)
  → Zustand store updates (immediate UI feedback)
  → Dexie.js write (async, IndexedDB)
  → Service worker caches app shell (vite-plugin-pwa)
```

All reads hit Dexie first. There is no "loading state" from a server — the app is always responsive because data is local.

### PWA Strategy

- **App Shell**: Cached on install. App works offline immediately.
- **Runtime caching**: Exercise database JSON cached via service worker.
- **Install prompt**: Users can add to home screen; launches fullscreen like a native app.
- **Periodic background sync** (optional later): If a future version adds cloud backup, Dexie's sync layer can be wired in without changing the core architecture.

### State Separation

| State Type | Tool | Examples |
|------------|------|----------|
| Domain / Cache | Dexie.js | Exercises, workouts, sets, routines, history |
| UI / Session | Zustand | Current workout ID, active timer, filter/search text, chart date range |
| Form | React Hook Form | Log-set form, create-routine form, custom-exercise form |

Keep Dexie as the source of truth for all durable data. Zustand should only hold ephemeral UI state. Never duplicate Dexie data into Zustand — read from IndexedDB and pass via props or RHF.

---

## Confidence Levels

| Recommendation | Confidence | Rationale |
|----------------|------------|-----------|
| React + Vite | HIGH | Vite is the dominant SPA build tool in 2025; React 19 is stable. Verified via official docs and releases. |
| Dexie.js | HIGH | 13k GitHub stars, mature IndexedDB abstraction, purpose-built for offline-first browser apps. |
| Zustand | HIGH | 57k+ stars, de-facto standard for light React state. v5 released and stable. |
| Tailwind 4 + shadcn/ui | HIGH | Tailwind v4 is current (docs verify). shadcn/ui is the most adopted component distribution pattern for 2024-2025. |
| Recharts | MEDIUM-HIGH | Recharts 2.x is widely used. For only 2-3 chart types, risk is low. Could be swapped for Chart.js or TanStack Charts later without touching data layer. |
| React Hook Form + Zod | HIGH | RHF v7 is current stable. Zod is the standard TS validation library. Verified via official sites. |
| vite-plugin-pwa | HIGH | Official Vite ecosystem plugin, maintained by vite-pwa org. Standard for Vite PWAs. |

## Sources

- React docs: https://react.dev/learn (verified current)
- Vite docs: https://vitejs.dev/guide/ (v6.3.0 released April 2026 — verified via GitHub releases)
- Tailwind CSS docs: https://tailwindcss.com/docs/installation (v4.2 verified)
- shadcn/ui docs: https://ui.shadcn.com/docs (verified current)
- Dexie.js docs: https://dexie.org/docs/API-Reference (verified current)
- Zustand GitHub: https://github.com/pmndrs/zustand (v5.0.12 latest, verified)
- React Hook Form: https://react-hook-form.com/ (verified current)
- TanStack Query docs: https://tanstack.com/query/latest (verified to confirm NOT needed)
