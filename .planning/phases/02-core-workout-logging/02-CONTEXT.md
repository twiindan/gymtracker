# Phase 2: Core Workout Logging - Context

**Gathered:** 2026-04-26
**Status:** Ready for execution

<domain>
## Phase Boundary

Build the core workout logging experience. Users start a free-form workout, add exercises from the catalog, log sets with reps and weight, duplicate sets with one tap, and complete/save the session. No routines, no editing past workouts, no charts — just fast logging.

</domain>

<decisions>
## Implementation Decisions

### State Management
- **D-10:** Active workout state is LOCAL to the page component (useState/useReducer). NO global state. This prevents Pitfall 3 (editing past workouts corrupting active session).
- **D-11:** Auto-save active workout to localStorage every 30 seconds for crash recovery.
- **D-12:** Clear localStorage backup only after successful Supabase save.

### Data Model
- **D-13:** Denormalized exercise snapshot: `workout_exercises` stores `exercise_name` and `primary_muscle_group` at time of workout. Prevents Pitfall 6 (renames breaking history).
- **D-14:** Weight stored as `DECIMAL(8,2)` in database. Prevents Pitfall 8 (floating-point errors).
- **D-15:** Reps and weight are nullable on `sets` table to support duration/distance/bodyweight exercises.
- **D-16:** No `users` table — single-user app, open RLS policies.

### UX / Logging Friction
- **D-17:** Default weight and reps to the last set's values when adding a new set.
- **D-18:** "Duplicate last set" is one tap — the primary speed feature.
- **D-19:** Large tap targets (min 44px) for all interactive elements.
- **D-20:** Exercise picker shows recent exercises first (from last 5 workouts).
- **D-21:** Keyboard-friendly: Tab moves between weight and reps inputs.

### Navigation
- **D-22:** Home page becomes a simple dashboard with "Start Workout" CTA.
- **D-23:** /workouts — history list
- **D-24:** /workouts/active — active workout logger
- **D-25:** /workouts/[id] — read-only workout detail

### the agent's Discretion
- Exact localStorage backup format and key
- Exercise picker UI layout (modal vs slide-over vs inline)
- Set input layout (row vs card vs table)
- Workout auto-naming convention
- Recent exercises query logic

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Workout Logging — LOG-01, LOG-02, LOG-04
- `.planning/ROADMAP.md` §Phase 2 — Phase goal, success criteria, dependencies

### Research
- `.planning/research/ARCHITECTURE.md` §Recommended Database Schema — workouts, workout_exercises, sets tables
- `.planning/research/ARCHITECTURE.md` §Pattern 1: Hierarchical Session Model
- `.planning/research/PITFALLS.md` §Pitfall 3 — Editing past workouts corrupts active session state
- `.planning/research/PITFALLS.md` §Pitfall 6 — Exercise identity crisis (denormalized snapshot)
- `.planning/research/PITFALLS.md` §Pitfall 8 — Floating-point weight display errors
- `.planning/research/PITFALLS.md` §Pitfall 9 — Workout logging friction (too many taps)

### Upstream Phase
- `.planning/phases/01-foundation-exercise-database/01-PLAN.md` — Exercise catalog, schema, seed data
- `src/db/schema.ts` — Exercise, TrackingType types
- `src/components/exercise-search.tsx` — Reusable search component
- `src/components/exercise-card.tsx` — Reusable exercise card

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/schema.ts` — Exercise, TrackingType, MUSCLE_GROUPS, EQUIPMENT_TYPES
- `src/db/client.ts` — createBrowserClient for Supabase
- `src/db/types.ts` — Database type (needs extension for new tables)
- `src/components/exercise-search.tsx` — Debounced search input
- `src/components/exercise-card.tsx` — Exercise display card with muscle badges
- `src/components/exercise-list.tsx` — Grouped exercise list
- `src/components/header.tsx` — App header with navigation

### Established Patterns
- Client components with 'use client' directive
- Supabase queries via createBrowserClient
- Tailwind CSS for styling
- CSS custom properties in globals.css
- Mobile-first responsive design

### Integration Points
- Exercise picker will reuse ExerciseSearch and ExerciseCard
- Workout logger will query exercises table for picker
- Workout save will insert into workouts, workout_exercises, and sets tables
- Header needs new "Workouts" link

</code_context>

<specifics>
## Specific Ideas

- "One-tap duplicate set" — the #1 speed feature for logging
- "Recent exercises first" — reduce search friction for common movements
- "Auto-save to localStorage" — recover from browser crashes mid-workout
- "Denormalized exercise_name snapshot" — historical workouts keep original names even if exercise is renamed
- "DECIMAL weight" — never deal with 22.5000000001 kg

</specifics>

<deferred>
## Deferred Ideas

- Edit past workouts — Phase 3 (Workout History & Editing)
- Routines / templates — Phase 4
- Progress charts and PRs — Phase 5
- RPE tracking — v2 (ADV-01)
- Exercise notes per set — v2 (ADV-03)
- Workout streak counter — v2 (ADV-04)
- Rest timer — explicitly out of scope per PROJECT.md

</deferred>

---

*Phase: 02-core-workout-logging*
*Context gathered: 2026-04-26*
