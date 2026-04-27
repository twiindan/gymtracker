---
phase: 4
phase_name: Routines & Workout Templates
depends_on: [03-workout-history-editing]
files_modified:
  - supabase/migrations/004_routines.sql
  - src/db/schema.ts
  - src/db/types.ts
  - src/app/routines/page.tsx
  - src/app/routines/[id]/page.tsx
  - src/app/routines/new/page.tsx
  - src/components/routine-builder.tsx
  - src/components/routine-card.tsx
  - src/app/workouts/active/page.tsx
requirements_addressed: [RTN-01, RTN-02, RTN-03]
autonomous: true
---

# Phase 4: Routines & Workout Templates

## Objective

Build the routine/template system that allows users to create reusable workout templates, start workouts from them, and copy previous workouts. This is a convenience layer on top of free-form logging — it should not block users who prefer ad-hoc workouts. This phase addresses Pitfall 10 (static routines) by making routines fully editable.

## Must Haves

1. Database schema for `routines` and `routine_exercises` tables
2. Routine builder UI for creating and editing templates
3. Routine list page showing all saved routines
4. Start workout from routine (pre-populates active workout)
5. Copy previous workout to create a new workout or routine
6. Routines are editable at any time (Pitfall 10 prevention)
7. Logged workouts remain immutable snapshots

## Plans

### Plan 01: Routine Database Schema

**Objective:** Create the database schema for routines and routine_exercises.

**Tasks:**

```xml
<task>
  <id>01-routines-schema</id>
  <title>Create Supabase migration for routines and routine_exercises</title>
  <read_first>
    - .planning/research/ARCHITECTURE.md §Recommended Database Schema
    - .planning/research/PITFALLS.md §Pitfall 10 (static routines)
    - src/db/schema.ts (existing Exercise, Workout types)
  </read_first>
  <action>
    Create `supabase/migrations/004_routines.sql` with:

    1. `routines` table:
       - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
       - `name TEXT NOT NULL`
       - `description TEXT`
       - `created_at TIMESTAMPTZ DEFAULT now()`
       - `updated_at TIMESTAMPTZ DEFAULT now()`

    2. `routine_exercises` table:
       - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
       - `routine_id UUID REFERENCES routines(id) ON DELETE CASCADE`
       - `exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE`
       - `exercise_name TEXT NOT NULL` — denormalized snapshot
       - `primary_muscle_group TEXT NOT NULL` — denormalized snapshot
       - `sort_order INT NOT NULL`
       - `target_sets INT DEFAULT 3`
       - `target_reps_min INT`
       - `target_reps_max INT`
       - `notes TEXT`

    3. Update `workouts` table:
       - Add `routine_id UUID REFERENCES routines(id)` — nullable, NULL for free-form

    4. Indexes:
       - `CREATE INDEX idx_routine_exercises_routine ON routine_exercises(routine_id)`
       - `CREATE INDEX idx_workouts_routine ON workouts(routine_id)`

    5. Row-level security:
       - `ALTER TABLE routines ENABLE ROW LEVEL SECURITY; CREATE POLICY "routines_all" ON routines FOR ALL USING (true);`
       - `ALTER TABLE routine_exercises ENABLE ROW LEVEL SECURITY; CREATE POLICY "routine_exercises_all" ON routine_exercises FOR ALL USING (true);`
  </action>
  <acceptance_criteria>
    - supabase/migrations/004_routines.sql contains CREATE TABLE for routines and routine_exercises
    - routine_exercises has denormalized exercise_name and primary_muscle_group
    - workouts table has routine_id column (nullable)
    - RLS policies exist for both new tables
    - Indexes exist for routine_exercises(routine_id) and workouts(routine_id)
  </acceptance_criteria>
</task>

<task>
  <id>02-schema-types</id>
  <title>Update TypeScript types for routines</title>
  <read_first>
    - src/db/schema.ts
    - src/db/types.ts
  </read_first>
  <action>
    1. Update `src/db/schema.ts`:
       - Add `Routine` interface
       - Add `RoutineExercise` interface
       - Update `Workout` interface to include `routine_id`

    2. Update `src/db/types.ts`:
       - Extend Database type with routines and routine_exercises tables
  </action>
  <acceptance_criteria>
    - src/db/schema.ts exports Routine and RoutineExercise interfaces
    - Workout interface includes routine_id field
    - src/db/types.ts has Database entries for routines and routine_exercises
  </acceptance_criteria>
</task>
```

### Plan 02: Routine Builder

**Objective:** Build the UI for creating and editing workout routines.

**Tasks:**

```xml
<task>
  <id>03-routine-builder</id>
  <title>Create routine builder form</title>
  <read_first>
    - src/components/exercise-picker.tsx
    - src/db/schema.ts (Routine, RoutineExercise types)
    - .planning/research/PITFALLS.md §Pitfall 10 (editable routines)
  </read_first>
  <action>
    Create `src/app/routines/new/page.tsx`:
    - Client component
    - Form with: name (required), description (optional)
    - Exercise list with add/remove/reorder
    - Each exercise shows: name, target_sets, target_reps_min/max inputs
    - Reuse ExercisePicker for adding exercises
    - Save button inserts routine + routine_exercises to Supabase
    - Validation: at least one exercise, name is required

    Create `src/app/routines/[id]/page.tsx`:
    - Read-only detail view of a routine
    - Shows all exercises with their targets
    - "Start Workout" button (links to /workouts/active with routine pre-populated)
    - "Edit" button (reuse routine builder in edit mode)
    - "Delete" button with confirmation
  </action>
  <acceptance_criteria>
    - src/app/routines/new/page.tsx allows creating new routines
    - Can add exercises from catalog
    - Can set target sets and reps for each exercise
    - Can reorder exercises
    - Can delete exercises
    - Save persists to Supabase
    - src/app/routines/[id]/page.tsx shows routine details
    - Has "Start Workout" button
  </acceptance_criteria>
</task>

<task>
  <id>04-routine-list</id>
  <title>Create routine list page</title>
  <read_first>
    - src/app/exercises/page.tsx (existing list pattern)
    - src/db/schema.ts (Routine type)
  </read_first>
  <action>
    Create `src/app/routines/page.tsx`:
    - Client component fetching routines from Supabase
    - Grid/list of routine cards
    - Each card shows: name, description preview, exercise count
    - "New Routine" button linking to /routines/new
    - Click card to view detail
    - Empty state: "No routines yet. Create your first workout template!"
  </action>
  <acceptance_criteria>
    - src/app/routines/page.tsx fetches and displays routines
    - Shows routine name, description, exercise count
    - Links to detail page and new routine form
    - Empty state with CTA
  </acceptance_criteria>
</task>
```

### Plan 03: Start Workout from Routine

**Objective:** Allow users to start a workout pre-populated from a routine template.

**Tasks:**

```xml
<task>
  <id>05-start-from-routine</id>
  <title>Implement "Start Workout from Routine" flow</title>
  <read_first>
    - src/app/workouts/active/page.tsx (active workout state)
    - src/db/schema.ts (RoutineExercise, ActiveWorkout types)
    - .planning/research/ARCHITECTURE.md §Data Flow
  </read_first>
  <action>
    Update `src/app/workouts/active/page.tsx`:

    1. Add support for starting from a routine:
       - Accept URL param: `/workouts/active?routine_id=xxx`
       - If routine_id provided, fetch routine_exercises from Supabase
       - Pre-populate active workout with exercises from routine
       - Set target sets as default number of sets
       - Name the workout: "{Routine Name} - {date}"

    2. Update routine detail page:
       - "Start Workout" button links to `/workouts/active?routine_id={id}`

    3. Update home page:
       - Show "Start from Routine" section with recent routines
  </action>
  <acceptance_criteria>
    - Visiting /workouts/active?routine_id=xxx pre-populates workout with routine exercises
    - Sets are created based on target_sets count
    - Exercise names are denormalized from routine
    - Routine detail page has "Start Workout" button
    - Active workout can still add/remove exercises freely
  </acceptance_criteria>
</task>
```

### Plan 04: Copy Previous Workout

**Objective:** Allow users to copy a previous workout to start a new one.

**Tasks:**

```xml
<task>
  <id>06-copy-workout</id>
  <title>Implement "Copy Previous Workout" feature</title>
  <read_first>
    - src/app/workouts/[id]/page.tsx (workout detail)
    - src/app/workouts/active/page.tsx
    - .planning/research/FEATURES.md §Convenience Features
  </read_first>
  <action>
    1. Update `src/app/workouts/[id]/page.tsx`:
       - Add "Copy as New Workout" button
       - Button links to `/workouts/active?copy_from={workout_id}`

    2. Update `src/app/workouts/active/page.tsx`:
       - Accept URL param: `/workouts/active?copy_from=xxx`
       - If copy_from provided:
         - Fetch the original workout with exercises and sets
         - Create new active workout with same exercises
         - Pre-fill sets with same weight/reps as original
         - Name: "Copy of {original name}"
       - User can then modify before saving

    3. Update history list:
       - Add "Copy" action to each workout card (or in detail)
  </action>
  <acceptance_criteria>
    - Workout detail has "Copy as New Workout" button
    - Copy creates new active workout with same exercises and set values
    - User can modify before saving
    - Original workout is not modified
  </acceptance_criteria>
</task>
```

### Plan 05: Navigation Integration

**Objective:** Add routines to app navigation and home page.

**Tasks:**

```xml
<task>
  <id>07-nav-routines</id>
  <title>Update navigation and home for routines</title>
  <read_first>
    - src/components/header.tsx
    - src/app/page.tsx
  </read_first>
  <action>
    1. Update `src/components/header.tsx`:
       - Add "Routines" link to navigation

    2. Update `src/app/page.tsx`:
       - Add "Routines" section showing recent/most-used routines
       - "Start from Routine" quick actions

    3. Update `src/app/workouts/page.tsx`:
       - Add "Start from Routine" button linking to /routines
  </action>
  <acceptance_criteria>
    - Header has "Routines" navigation link
    - Home page shows routines section
    - Workouts list has link to routines
  </acceptance_criteria>
</task>
```

## Verification

After all plans execute, the following must be true:

1. **Database:** `supabase/migrations/004_routines.sql` creates routines and routine_exercises tables
2. **Create routine:** User can create a routine with name, exercises, and target sets/reps
3. **Edit routine:** User can edit an existing routine at any time
4. **List routines:** User can see all routines at /routines
5. **Start from routine:** User can start a workout pre-populated from a routine
6. **Copy workout:** User can copy a previous workout as a new workout
7. **Navigation:** Routines are accessible from header and home page
8. **Pitfall prevention:** Routines remain editable after workouts are logged; logged workouts are immutable
9. **TypeScript:** `npm run build` succeeds with zero errors

## Threat Model

<threat_model>
## Security Assessment — Phase 4

**Threat surface:** Routine creation, workout copying, template mutation

| Threat | Severity | Mitigation |
|--------|----------|------------|
| XSS via routine names | LOW | React auto-escapes text content |
| SQL injection | LOW | Supabase parameterized queries |
| Race condition on routine edit | LOW | Single-user app; last write wins is acceptable |
| Copy workout data loss | LOW | Copy creates new records; original is untouched |

**No HIGH severity threats identified for Phase 4.**
</threat_model>
