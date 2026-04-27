# Phase 1: Foundation & Exercise Database - Context

**Gathered:** 2025-04-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the exercise catalog — a searchable database of ~200-400 built-in exercises (seeded from wger) plus the ability to add custom exercises. This is the data foundation that all other phases depend on. No workout logging, history, or routines in this phase.

</domain>

<decisions>
## Implementation Decisions

### Stack
- **D-01:** Next.js + Supabase — keep existing repo structure. Supabase PostgreSQL as the data layer. This preserves the option for cross-device sync later.
- **D-02:** Client-biased architecture — workout pages should use client components since SSR adds no value for a single-user app.

### Exercise Seed Data
- **D-03:** Seed from wger open-source API (~500 exercises with muscle groups, equipment types, and descriptions). Import into Supabase as seed data.
- **D-04:** Built-in exercises are read-only — users cannot edit or delete them. Custom exercises are separate.

### Unit System
- **D-05:** Store all weight in kilograms (kg). Display in kg. No unit conversion in v1.

### Exercise Data Model
- **D-06:** Full exercise model: name, primary muscle group, secondary muscle groups (array), equipment type, tracking type enum (`reps`, `duration`, `distance`, `bodyweight`).
- **D-07:** Tracking type determines what fields are relevant during logging (e.g., `duration` exercises don't need reps).
- **D-08:** Weight stored as decimal (not float) to prevent precision errors that break PR detection.
- **D-09:** Custom exercises are user-created entries with the same schema as built-in exercises, flagged as `is_custom: true`.

### Search Experience
- **D-10:** Type-ahead text search that filters exercises by name as the user types.
- **D-11:** Browse by muscle group — users can tap a muscle group to see all exercises for that area.
- **D-12:** Recent/frequent exercises shown at the top — tracks which exercises the user logs most often.

### the agent's Discretion
- Supabase table naming conventions and index strategy
- Exact wger API integration approach (one-time import vs ongoing sync)
- Search implementation details (client-side filtering vs Supabase full-text search)
- Loading state and empty state UI patterns

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Exercise Database — DB-01 (built-in database with search), DB-02 (custom exercises)
- `.planning/ROADMAP.md` §Phase 1 — Phase goal, success criteria, dependencies

### Research
- `.planning/research/STACK.md` — Stack recommendations, Next.js context, Supabase patterns
- `.planning/research/FEATURES.md` §Table Stakes — Exercise database and search requirements
- `.planning/research/ARCHITECTURE.md` §Component Responsibilities — Exercise catalog component, data model
- `.planning/research/PITFALLS.md` §Pitfall 1 — Overly rigid exercise data model prevention
- `.planning/research/PITFALLS.md` §Pitfall 6 — Exercise identity crisis
- `.planning/research/PITFALLS.md` §Pitfall 8 — Floating-point weight storage errors

### Project Context
- `.planning/PROJECT.md` — Core value, constraints, key decisions

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- No existing code — greenfield project in GymTracker directory

### Established Patterns
- Parent directory (TomaElDesvio) uses Next.js 16 with App Router, Supabase via `@supabase/ssr`, CSS Modules, and `@/*` path alias. These patterns may inform this project if the user wants consistency.

### Integration Points
- Supabase migrations directory will be created for database schema
- Next.js app directory structure needs to be scaffolded

</code_context>

<specifics>
## Specific Ideas

- "Use wger as the exercise source" — open-source database with ~500 exercises
- "Store weight in kg" — consistent unit, no conversion needed in v1
- "Full exercise model with tracking types" — prevents rigid schema that breaks for planks, timed holds, etc.
- "Type-ahead + browse by muscle + recents" — fast exercise finding mid-workout

</specifics>

<deferred>
## Deferred Ideas

- Calendar heatmap view of workout days — Phase 3 (History)
- Muscle group volume tracking — Phase 5 (Insights) or v2
- Exercise notes per set — v2 (ADV-03)
- Data export/import — v2 (CONV-04)
- PWA / offline support — v2 (POL-02)

</deferred>

---

*Phase: 01-foundation-exercise-database*
*Context gathered: 2025-04-23*
