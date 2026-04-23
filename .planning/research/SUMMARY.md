# Project Research Summary

**Project:** GymTracker
**Domain:** Personal gym workout tracking web application
**Researched:** 2025-04-23
**Confidence:** MEDIUM-HIGH

## Executive Summary

GymTracker is a single-user, offline-first personal workout logging application. After surveying open-source implementations, commercial competitors (Strong, Hevy, Boostcamp), and domain-specific technical literature, a clear consensus emerges: successful workout trackers are built around a hierarchical data model (Workout → Exercise → Sets) with minimal business logic and maximum emphasis on low-friction data entry. The complexity lies in modeling exercise performance over time, not in multi-user orchestration or real-time collaboration.

**The primary architectural tension uncovered is the stack choice.** One research stream strongly recommends a Vite-based SPA with Dexie.js (IndexedDB) for fully offline, zero-backend operation — arguing that Next.js SSR and Supabase add pure overhead for a single-user app with no auth. The other stream assumes Next.js + Supabase (PostgreSQL) as the foundation. The project currently operates within a Next.js 16 + Supabase repository, creating a decision point: either leverage the existing infrastructure with a client-heavy architecture (treating Next.js as a static host + minimal API), or migrate to the recommended Vite SPA stack for a simpler mental model and true offline-first behavior. For roadmap purposes, we assume the Next.js path is retained but with a strong client-side bias: workout data lives in the browser (Dexie.js/IndexedDB) with optional Supabase persistence for backup, and pages use client components for all interactive logging flows.

Key risks center on data model rigidity (e.g., exercises that use duration instead of reps), ambiguous "Personal Record" definitions that demotivate users, and logging friction that causes abandonment mid-workout. The research provides clear prevention strategies for each.

## Key Findings

### Recommended Stack

The recommended stack prioritizes developer velocity, offline resilience, and minimal bundle size for a solo developer building a personal tool. React 19 provides the component model; Vite 6 provides faster HMR and simpler deployment than Next.js for a pure SPA; Dexie.js wraps IndexedDB with queries and migrations that localStorage cannot provide; and Zustand handles ephemeral UI state without Redux's boilerplate. Tailwind CSS v4 and shadcn/ui give a mobile-first, accessible component layer. React Hook Form + Zod ensure snappy form validation mid-workout. Recharts delivers declarative SVG charts, and vite-plugin-pwa makes the app installable and offline-capable.

> **⚠️ Stack Conflict:** `STACK.md` explicitly rejects Next.js + Supabase as over-engineering for this domain. `ARCHITECTURE.md` describes a Next.js + Supabase monolith. The existing codebase uses Next.js 16 + Supabase. This is the #1 decision for Phase 1.

**Core technologies:**
- **React 19.x** — UI framework; hooks ideal for interactive logging flows.
- **Vite 6.x** — Build tool; faster dev server and simpler than Next.js for a SPA. `vite-plugin-pwa` enables offline support.
- **TypeScript 5.7+** — Type safety for domain models (Exercise, Workout, Set, Routine).
- **Dexie.js 4.x** — Client-side IndexedDB wrapper; essential for querying workout history and PR lookups offline.
- **Zustand 5.x** — Global client state; minimal boilerplate, no providers.
- **Tailwind CSS 4.x** — Mobile-first responsive styling; CSS-first config in v4.
- **shadcn/ui** — Headless accessible components built on Radix UI; own the code.
- **React Hook Form 7.x + Zod 3.x** — Form state and validation; uncontrolled inputs for snappy mobile UX.
- **Recharts 2.x** — Declarative SVG charts for strength/volume over time.
- **date-fns 4.x** — Tree-shakeable date manipulation for grouping and axis formatting.
- **vite-plugin-pwa 0.21+** — Service worker, manifest, and offline caching.

### Expected Features

**Must have (table stakes):**
- Exercise logging (sets × reps × weight) — core purpose; must be fast mid-workout.
- Workout history / calendar view — users need to see what they did and when.
- Built-in exercise database with search — ~200-400 exercises covers 95% of gym work.
- Custom exercises — name + muscle group + equipment type.
- Personal records (PRs) per exercise — max weight, max reps, estimated 1RM.
- Basic progress charts (strength over time) — #1 retention driver.
- Workout routines / templates — structured training requires repeating patterns.
- Free-form / ad-hoc workouts — not every day follows a plan.
- Edit past workouts — users make mistakes.
- Exercise notes per set/workout — form tweaks, pain points, context.

**Should have (competitive):**
- Muscle group volume tracking — see which muscles are getting attention.
- RPE (Rate of Perceived Exertion) tracking — autoregulation for smarter training.
- Estimated 1RM calculation — compare strength across rep ranges.
- Workout streak / consistency counter — gamification drives habit formation.
- Plate calculator — bar weight + target → plate breakdown.
- Warm-up set calculator — automate warm-up pyramid.
- Superset / circuit support — group exercises sharing rest periods.
- Data export (CSV/JSON) — user data ownership; builds trust.
- Auto-progression suggestions — "last time 185×8, try 190×8."
- Dark mode — standard modern expectation.
- Offline support / PWA — gym WiFi is often terrible.

**Defer (v2+):**
- Muscle heat map / body visualization — high complexity, novelty over utility.
- Auto-progression — requires mature routine system first.
- Periodization / deload weeks — domain expertise needed; niche use.
- Data import from Strong/Hevy — single user starting fresh; no existing data.

### Architecture Approach

The canonical architecture across surveyed apps is a **data-heavy, logic-light** hierarchical model. The app separates exercise definitions (catalog) from workout instances (history), and further separates routines (templates) from workouts (executions). All reads and writes flow through a normalized relational schema: `workouts → workout_exercises → sets`. This mirrors the user's mental model and enables flexible querying at any level. For a single user, PostgreSQL on Supabase is over-provisioned but acceptable if the existing infrastructure is retained; IndexedDB/Dexie.js is the pragmatic choice for true offline-first behavior.

**Major components:**
1. **Exercise Catalog** — Stores built-in + custom exercise definitions (name, muscle group, equipment). Read-heavy, rarely changes.
2. **Routine Builder** — Defines reusable workout templates (exercises, order, target sets/reps).
3. **Workout Logger** — Active session capture: records actual sets, reps, weight. Write-heavy during use.
4. **Workout History** — Queries past workouts with filtering (by date, exercise, routine). Read-heavy.
5. **Progress Analytics** — Calculates PRs, volume trends, strength curves over time. Derived data.
6. **Dashboard** — Aggregated view: today's planned workout, recent history, PR highlights.

### Critical Pitfalls

1. **Overly rigid exercise data model** — Making weight/reps mandatory breaks bodyweight exercises (planks) and timed holds. Avoid by: making fields nullable, supporting a `tracking_type` enum (`reps`, `duration`, `distance`, `bodyweight`), and allowing multiple muscle groups per exercise.
2. **Ambiguous "Personal Record" definition** — `MAX(weight)` alone is misleading if reps drop from 12 to 6. Avoid by: tracking PRs per metric (max weight, max reps at weight, highest estimated 1RM, highest volume) and displaying the formula used.
3. **Editing past workouts corrupts active session state** — Reusing the same global state for "active" and "historical" editing causes data loss. Avoid by: maintaining two distinct state containers (`activeWorkout` vs `editingWorkout`), using immutable updates, and never mutating active state from history.
4. **Misleading progress charts** — Volume drops when weight increases and reps fall, demotivating users. Avoid by: plotting multiple metrics (1RM, volume, max weight), using moving averages/trend lines, and adding context tooltips.
5. **Logging friction (too many taps)** — Users abandon apps that take longer to log than to rest. Avoid by: defaulting to last session's values, using large tap targets, supporting "duplicate last set" with one tap, and optimizing for one-handed use.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation
**Rationale:** Everything depends on the data model. Get the schema right before any UI, or migrations become painful.
**Delivers:** Database schema (Dexie.js or Supabase), exercise catalog with seed data, custom exercise CRUD, basic search.
**Addresses:** Exercise database, custom exercises, exercise search (from FEATURES.md).
**Avoids:** Overly rigid data model (Pitfall 1), exercise identity crisis (Pitfall 6), floating-point weight errors (Pitfall 8), no data export (Pitfall 7).

### Phase 2: Core Logging
**Rationale:** Free-form logging must work before any structure. Users need to log a set in under 30 seconds or they quit.
**Delivers:** Free-form workout creation, active workout logger UI, set input (reps, weight, notes), workout completion/save, "duplicate last set."
**Addresses:** Exercise logging, free-form workouts, exercise notes (from FEATURES.md).
**Avoids:** Editing past workouts corrupts active session (Pitfall 3), logging friction (Pitfall 9).

### Phase 3: History & Retrieval
**Rationale:** Users make mistakes and need to fix them. History also generates the data needed for analytics.
**Delivers:** Workout list / history page, workout detail view, edit past workouts, calendar heatmap view, soft-delete (archive).
**Addresses:** Workout history, edit past workouts (from FEATURES.md).
**Avoids:** Date/time logic errors (Pitfall 5), misleading charts by ensuring data integrity first (Pitfall 4).

### Phase 4: Structure
**Rationale:** Routines are a convenience layer on top of free-form logging. They should not block v1, but once logging works, templates improve consistency.
**Delivers:** Routine builder (create templates), start workout from routine, routine management (CRUD), "copy previous workout."
**Addresses:** Workout routines / templates (from FEATURES.md).
**Avoids:** Assuming routines are static (Pitfall 10).

### Phase 5: Insights
**Rationale:** Charts and PRs require data. Building them before users have logged workouts produces empty states and kills motivation.
**Delivers:** Personal records calculation (max weight, max reps, estimated 1RM, volume), progress charts per exercise, dashboard with stats.
**Addresses:** Personal records, basic progress charts, estimated 1RM, muscle group volume tracking (from FEATURES.md).
**Avoids:** Ambiguous PR definition (Pitfall 2), misleading progress charts (Pitfall 4).

### Phase Ordering Rationale

- **Schema first:** All components depend on `exercises`, `workouts`, `workout_exercises`, and `sets`. The schema must support nullable weight/reps and multiple muscle groups from day one.
- **Free-form before routines:** Users can start tracking immediately. Routine builder is a convenience layer, not a blocker.
- **History before analytics:** You need data before visualization. Empty charts are demotivating.
- **Routines before deep analytics:** Routines are optional for v1, but if included, they should exist before auto-progression or periodization (both deferred).
- **Pitfall-driven sequencing:** Phase 1 addresses 5 of the 10 critical pitfalls by focusing on data model correctness. Phase 2 addresses UX-killing logging friction.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Foundation):** Stack decision — Vite SPA + Dexie.js vs Next.js + Supabase. This is a project-level pivot that must be resolved before writing code. If Next.js is retained, research how to best integrate Dexie.js/IndexedDB as the primary data layer with optional Supabase sync.
- **Phase 5 (Insights):** Chart performance and data aggregation strategies. Recharts is recommended, but research may be needed on time-bucketed queries and moving-average calculations if datasets grow large.

Phases with standard patterns (skip research-phase):
- **Phase 2 (Core Logging):** Workout logging UX patterns are well-documented across Strong, Hevy, and open-source trackers. Standard form + list patterns apply.
- **Phase 3 (History):** Calendar and list views are established UI patterns. No novel domain research needed.
- **Phase 4 (Structure):** Routine/template builders follow standard CRUD + reordering patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | STACK.md makes a strong evidence-based case for Vite+Dexie.js, but ARCHITECTURE.md assumes Next.js+Supabase and the existing repo uses Next.js. Requires a project-level decision. |
| Features | HIGH | Well-surveyed from commercial apps (Strong, Hevy, Boostcamp) and open-source projects (MyFit, wger). Table stakes are universally consistent. |
| Architecture | HIGH | Data model (Workout → Exercise → Sets) is canonical across 4+ surveyed implementations. Component boundaries are clear. |
| Pitfalls | MEDIUM-HIGH | Derived from real open-source issue trackers and schema migration histories. Limited by lack of access to commercial app post-mortems. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Stack decision (Vite vs Next.js):** The biggest open question. If Next.js is retained, the architecture must be heavily client-biased (no SSR for workout pages, Dexie.js as source of truth). If migrating to Vite, factor in the cost of moving away from existing Supabase migrations and auth utilities.
- **Unit system (kg vs lbs):** Not explicitly decided. Research recommends storing in one standard unit (kg) and converting for display. Needs validation with target user preference.
- **Exercise seed data source:** No decision on which open-source exercise database to seed from (wger API, custom JSON, etc.). Needs quick validation during Phase 1.
- **User research gap:** All findings are competitive/technical analysis. No direct user interviews or usability studies. Logging friction estimates are based on domain inference, not observed behavior.
- **PWA scope:** `STACK.md` recommends PWA from the start; `FEATURES.md` defers offline/PWA. Decide whether v1 requires service worker caching or if it's a v2 enhancement.

## Sources

### Primary (HIGH confidence)
- **STACK.md** — Official docs verification for React 19, Vite 6, Tailwind 4, Dexie.js, Zustand v5, React Hook Form, Zod.
- **ARCHITECTURE.md** — MyFit (WhyAsh5114/MyFit) comprehensive Prisma schema and architecture document.
- **FEATURES.md** — Strong App (strong.app), Boostcamp (boostcamp.app), wger open-source project.

### Secondary (MEDIUM confidence)
- **PITFALLS.md** — MyFit open issues, fit-forge migrations, MyFit Prisma schema evolution, Cashew issue patterns (analogous personal tracking app).
- **BodyProgress** (karthironald/BodyProgress) — iOS/CoreData implementation showing simpler hierarchy.
- **reactgym** (zupzup/reactgym) — Older React/Flux web implementation.

### Tertiary (LOW confidence)
- **donnfelker/workout-tracker** — Basic Node/Mongo JSON API (outdated, 2012).
- **CNET "Best Workout Apps 2026"** — General market context.
- **Muscle & Fitness "Best Apps for Tracking Strength Workouts"** — General market context.

---
*Research completed: 2025-04-23*
*Ready for roadmap: yes*
