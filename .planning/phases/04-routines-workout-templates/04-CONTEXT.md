# Phase 4: Routines & Workout Templates - Context

**Gathered:** 2026-04-26
**Status:** Ready for execution

<domain>
## Phase Boundary

Build the routine/template system. Users create reusable workout templates with exercises, target sets, and target reps. They can start workouts from routines (pre-populated) or copy previous workouts. Routines are editable at any time — logged workouts remain immutable snapshots.

</domain>

<decisions>
## Implementation Decisions

### Data Model
- **D-37:** `routines` table: id, name, description, created_at, updated_at
- **D-38:** `routine_exercises` table: id, routine_id, exercise_id, exercise_name (denormalized), primary_muscle_group (denormalized), sort_order, target_sets, target_reps_min, target_reps_max, notes
- **D-39:** `workouts.routine_id` added as nullable FK — NULL means free-form workout
- **D-40:** Denormalized exercise snapshot on routine_exercises (same pattern as workout_exercises)

### Routine Behavior
- **D-41:** Routines are ALWAYS editable. No locking after first use. (Pitfall 10 prevention)
- **D-42:** Editing a routine does NOT modify past workouts that used it.
- **D-43:** Starting from a routine creates a free-form workout pre-populated with routine data. The workout is independent once created.
- **D-44:** Copying a workout creates a completely new workout with copied data. Original is untouched.

### UX
- **D-45:** Routine builder uses same ExercisePicker as active workout
- **D-46:** Target sets/reps are optional hints, not enforced constraints
- **D-47:** "Start from Routine" is a convenience, not a requirement — free-form logging always available
- **D-48:** Copy workout button on detail page and optionally on list cards

### the agent's Discretion
- Routine card layout and design
- How many recent routines to show on home page
- Whether to show target reps as a range or single value
- Copy workout naming convention

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Routines & Structure — RTN-01, RTN-02, RTN-03
- `.planning/ROADMAP.md` §Phase 4 — Phase goal, success criteria, dependencies

### Research
- `.planning/research/ARCHITECTURE.md` §Recommended Database Schema — routines, routine_exercises tables
- `.planning/research/PITFALLS.md` §Pitfall 10 — Assuming routines are static
- `.planning/research/FEATURES.md` §Convenience Features — "Repeat last workout"

### Upstream Phase
- `.planning/phases/03-workout-history-editing/03-PLAN.md` — Workout editing, soft delete
- `src/app/workouts/active/page.tsx` — Active workout logger
- `src/app/workouts/[id]/page.tsx` — Workout detail
- `src/components/exercise-picker.tsx` — Exercise picker modal
- `src/db/schema.ts` — Exercise, Workout, WorkoutExercise types

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/workouts/active/page.tsx` — Active workout state management
- `src/app/workouts/[id]/page.tsx` — Workout detail with edit mode
- `src/components/exercise-picker.tsx` — Exercise picker modal
- `src/db/schema.ts` — All entity types
- `src/db/client.ts` — Supabase client
- `src/components/header.tsx` — App header

### Established Patterns
- Client components with local state
- Supabase inserts with type assertions (as never)
- Modal overlays for pickers
- Denormalized snapshots for historical integrity
- URL params for pre-population (e.g., routine_id)

### Integration Points
- Routine builder will reuse ExercisePicker
- Start from routine will pre-populate active workout state
- Copy workout will fetch existing workout and create new active state
- Navigation needs new "Routines" link

</code_context>

<specifics>
## Specific Ideas

- "Start from Routine" pre-populates active workout with exercises and empty sets
- "Copy Previous Workout" pre-populates with actual weight/reps for quick repeat
- "Recent Routines" on home page for one-tap starts
- Routine cards show exercise count and muscle groups
- Editable routines: users can fix templates without losing history

</specifics>

<deferred>
## Deferred Ideas

- Scheduled workouts / calendar integration (v2)
- Routine folders/categories (v2)
- Share routines (social — out of scope)
- Auto-progression based on routine (v2)
- Periodization / deload (v2)

</deferred>

---

*Phase: 04-routines-workout-templates*
*Context gathered: 2026-04-26*
