---
phase: 2
phase_name: Core Workout Logging
depends_on: [01-foundation-exercise-database]
files_modified:
  - supabase/migrations/002_workouts.sql
  - src/db/schema.ts
  - src/db/types.ts
  - src/app/workouts/page.tsx
  - src/app/workouts/active/page.tsx
  - src/components/workout-logger.tsx
  - src/components/set-input.tsx
  - src/components/exercise-picker.tsx
  - src/components/workout-history-list.tsx
  - src/components/workout-detail.tsx
requirements_addressed: [LOG-01, LOG-02, LOG-04]
autonomous: true
---

# Phase 2: Core Workout Logging

## Objective

Build the workout logging experience — the core value proposition of GymTracker. Users must be able to start a free-form workout, add exercises from the catalog, log sets with reps and weight, duplicate sets with one tap, and complete/save the session. This phase addresses Pitfall 3 (state isolation), Pitfall 6 (exercise name snapshots), Pitfall 8 (DECIMAL weight), and Pitfall 9 (logging friction).

## Must Haves

1. Database schema for `workouts`, `workout_exercises`, and `sets` tables
2. Active workout logger UI with large tap targets and minimal friction
3. Exercise picker that reuses the existing exercise catalog
4. Set input with reps, weight, and one-tap "duplicate last set"
5. Workout save as a transactional insert (workout → exercises → sets)
6. Basic workout history list so users can see saved workouts
7. Denormalized `exercise_name` snapshot on `workout_exercises` to prevent Pitfall 6
8. Weight stored as `DECIMAL(8,2)` to prevent Pitfall 8

## Plans

### Plan 01: Workout Database Schema

**Objective:** Create the database schema for workout sessions with all Phase 2 pitfall preventions built in.

**Tasks:**

```xml
<task>
  <id>01-workouts-schema</id>
  <title>Create Supabase migration for workouts, workout_exercises, and sets</title>
  <read_first>
    - .planning/research/ARCHITECTURE.md §Recommended Database Schema
    - .planning/research/PITFALLS.md §Pitfall 3, 6, 8
    - .planning/phases/01-foundation-exercise-database/01-CONTEXT.md (decisions D-06, D-08)
  </read_first>
  <action>
    Create `supabase/migrations/002_workouts.sql` with:

    1. `workouts` table:
       - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
       - `name TEXT` (optional, auto-generated like "Workout - Apr 26")
       - `started_at TIMESTAMPTZ NOT NULL DEFAULT now()`
       - `ended_at TIMESTAMPTZ` (NULL until completed)
       - `notes TEXT`
       - `created_at TIMESTAMPTZ DEFAULT now()`

    2. `workout_exercises` table:
       - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
       - `workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE`
       - `exercise_id UUID REFERENCES exercises(id)`
       - `exercise_name TEXT NOT NULL` — denormalized snapshot (Pitfall 6 prevention)
       - `primary_muscle_group TEXT NOT NULL` — denormalized snapshot
       - `sort_order INT NOT NULL`
       - `notes TEXT`

    3. `sets` table:
       - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
       - `workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE`
       - `set_number INT NOT NULL`
       - `reps INT` — nullable for duration/distance tracking
       - `weight DECIMAL(8,2)` — nullable for bodyweight/duration (Pitfall 8 prevention)
       - `notes TEXT`
       - `created_at TIMESTAMPTZ DEFAULT now()`

    4. Indexes:
       - `CREATE INDEX idx_workouts_started_at ON workouts(started_at DESC)`
       - `CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id)`
       - `CREATE INDEX idx_workout_exercises_exercise ON workout_exercises(exercise_id)`
       - `CREATE INDEX idx_sets_workout_exercise ON sets(workout_exercise_id)`

    5. Row-level security (single-user, open policies):
       - `ALTER TABLE workouts ENABLE ROW LEVEL SECURITY; CREATE POLICY "workouts_all" ON workouts FOR ALL USING (true);`
       - `ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY; CREATE POLICY "workout_exercises_all" ON workout_exercises FOR ALL USING (true);`
       - `ALTER TABLE sets ENABLE ROW LEVEL SECURITY; CREATE POLICY "sets_all" ON sets FOR ALL USING (true);`
  </action>
  <acceptance_criteria>
    - supabase/migrations/002_workouts.sql contains CREATE TABLE for workouts, workout_exercises, and sets
    - workout_exercises has exercise_name and primary_muscle_group as TEXT NOT NULL (denormalized)
    - sets has weight as DECIMAL(8,2) (not FLOAT)
    - All three tables have RLS enabled with open policies
    - At least 4 CREATE INDEX statements exist
    - Foreign keys use ON DELETE CASCADE
  </acceptance_criteria>
</task>

<task>
  <id>02-schema-types</id>
  <title>Update TypeScript types for workout entities</title>
  <read_first>
    - src/db/schema.ts (existing Exercise type)
    - src/db/types.ts (existing Database type)
  </read_first>
  <action>
    1. Update `src/db/schema.ts`:
       - Add `Workout` interface
       - Add `WorkoutExercise` interface
       - Add `Set` interface
       - Add `ActiveWorkout`, `ActiveWorkoutExercise`, `ActiveSet` types for client-side state

    2. Update `src/db/types.ts`:
       - Extend Database type with workouts, workout_exercises, and sets tables
  </action>
  <acceptance_criteria>
    - src/db/schema.ts exports Workout, WorkoutExercise, Set interfaces
    - src/db/schema.ts exports ActiveWorkout, ActiveWorkoutExercise, ActiveSet types
    - src/db/types.ts has Database entries for all three new tables
    - All weight fields use number type (mapped from DECIMAL)
  </acceptance_criteria>
</task>
```

### Plan 02: Active Workout Logger

**Objective:** Build the core workout logging UI — the most important screen in the entire app.

**Tasks:**

```xml
<task>
  <id>03-exercise-picker</id>
  <title>Create exercise picker for adding exercises to a workout</title>
  <read_first>
    - src/components/exercise-search.tsx (existing search component)
    - src/components/exercise-card.tsx (existing card component)
    - .planning/research/PITFALLS.md §Pitfall 9 (logging friction)
  </read_first>
  <action>
    Create `src/components/exercise-picker.tsx`:
    - Modal/dialog that opens over the active workout
    - Reuses ExerciseSearch and ExerciseCard components
    - Shows exercises from Supabase catalog
    - Clicking an exercise adds it to the active workout and closes the picker
    - Already-added exercises are visually indicated
    - Large tap targets, mobile-optimized
    - "Recent exercises" section at top (exercises from last 5 workouts)
  </action>
  <acceptance_criteria>
    - src/components/exercise-picker.tsx exports a modal component
    - Component fetches exercises from Supabase
    - Clicking an exercise calls an onSelect callback with the Exercise
    - Recently used exercises appear at the top
    - Modal closes on selection or backdrop click
  </acceptance_criteria>
</task>

<task>
  <id>04-set-input</id>
  <title>Create set input component with duplicate-last-set</title>
  <read_first>
    - .planning/research/PITFALLS.md §Pitfall 9 (logging friction)
    - src/db/schema.ts (ActiveSet type)
  </read_first>
  <action>
    Create `src/components/set-input.tsx`:
    - Props: `set: ActiveSet`, `onUpdate: (set: ActiveSet) => void`, `onDuplicate: () => void`, `trackingType: TrackingType`
    - Shows set number badge
    - Weight input: numeric, large tap target, defaults to last set's weight
    - Reps input: numeric, large tap target, defaults to last set's reps
    - For duration tracking: time input or numeric seconds
    - For distance tracking: numeric distance input
    - For bodyweight: reps only (no weight field)
    - "Duplicate" button: one tap creates a new set with same weight/reps
    - "Complete" checkbox or swipe to mark set done
    - Delete set button
    - All inputs are large enough for one-handed use (min 44px tap targets)
  </action>
  <acceptance_criteria>
    - src/components/set-input.tsx exports SetInput component
    - Component accepts set, onUpdate, onDuplicate props
    - Weight and reps inputs are type="number" with large tap targets
    - Duplicate button creates a new set with same values
    - Delete button removes the set
    - Bodyweight exercises show only reps input (no weight)
    - Duration exercises show time input instead of reps/weight
  </acceptance_criteria>
</task>

<task>
  <id>05-workout-logger</id>
  <title>Create active workout logger page and state management</title>
  <read_first>
    - .planning/research/PITFALLS.md §Pitfall 3 (state isolation)
    - .planning/research/PITFALLS.md §Pitfall 9 (logging friction)
    - src/db/schema.ts (ActiveWorkout types)
  </read_first>
  <action>
    Create `src/app/workouts/active/page.tsx`:
    - Client component ('use client')
    - Manages active workout state locally (NOT global state — Pitfall 3 prevention)
    - State shape: ActiveWorkout with exercises and sets
    - Shows "Start Workout" screen when no active workout
    - Shows active workout logger when session is in progress
    - Header: elapsed time since workout start, "Finish" button
    - Exercise sections: each exercise shows its sets (SetInput components)
    - "Add Exercise" button opens ExercisePicker
    - "Add Set" button per exercise (creates empty set)
    - Reorder exercises via drag handles or up/down buttons
    - Workout notes textarea
    - Auto-save to localStorage every 30 seconds (recovery if browser crashes)

    Create `src/components/workout-logger.tsx`:
    - Main logger component that renders the active workout UI
    - Handles all set CRUD operations
    - Handles exercise add/remove/reorder
    - Shows empty state when no exercises added yet
  </action>
  <acceptance_criteria>
    - src/app/workouts/active/page.tsx is a client component
    - Page manages workout state with useState/useReducer (no global state)
    - User can add exercises from the catalog
    - User can log sets with reps and weight
    - User can duplicate the last set with one tap
    - User can delete exercises and sets
    - Elapsed timer shows since workout start
    - "Finish Workout" button is visible and prominent
  </acceptance_criteria>
</task>
```

### Plan 03: Workout Save & Basic History

**Objective:** Save completed workouts to the database and provide a basic history view.

**Tasks:**

```xml
<task>
  <id>06-workout-save</id>
  <title>Implement workout save and completion flow</title>
  <read_first>
    - src/db/client.ts (Supabase client)
    - src/db/schema.ts (Workout, WorkoutExercise, Set types)
    - .planning/research/ARCHITECTURE.md §Data Flow
  </read_first>
  <action>
    1. In `src/app/workouts/active/page.tsx`, implement saveWorkout function:
       - Validates: at least one exercise with at least one set
       - Inserts workout record into `workouts` table
       - Inserts workout_exercises records with denormalized names
       - Inserts sets records
       - All in a single Supabase transaction (use RPC or sequential inserts with error handling)
       - Sets `ended_at` to current timestamp
       - Clears localStorage backup
       - Redirects to workout history or detail page

    2. Handle partial saves:
       - If save fails, show error and keep workout active
       - Allow retry

    3. Create auto-naming:
       - Default name: "Workout - {date}" or "Morning Workout - {date}"
       - Allow user to rename before saving
  </action>
  <acceptance_criteria>
    - Clicking "Finish Workout" saves workout to Supabase
    - Workout record has started_at and ended_at timestamps
    - Workout_exercises records include denormalized exercise_name
    - Sets records include reps and weight (DECIMAL)
    - Save fails gracefully with error message
    - After save, user is redirected to history
    - localStorage backup is cleared after successful save
  </acceptance_criteria>
</task>

<task>
  <id>07-history-list</id>
  <title>Create workout history list page</title>
  <read_first>
    - src/db/client.ts
    - src/db/schema.ts (Workout type)
  </read_first>
  <action>
    Create `src/app/workouts/page.tsx`:
    - Client component that fetches workouts from Supabase
    - Lists workouts in reverse chronological order (newest first)
    - Each item shows: date, number of exercises, number of sets, total volume (sum of weight × reps)
    - Clicking a workout opens detail view
    - Empty state for first-time user: "No workouts yet. Start your first workout!"
    - "Start New Workout" button linking to /workouts/active

    Create `src/components/workout-history-list.tsx`:
    - Renders the list of workout cards
    - Shows loading state
    - Shows empty state
  </action>
  <acceptance_criteria>
    - src/app/workouts/page.tsx fetches workouts from Supabase
    - Workouts displayed in reverse chronological order
    - Each workout card shows date, exercise count, set count, total volume
    - Empty state with CTA to start first workout
    - Link to /workouts/active
  </acceptance_criteria>
</task>

<task>
  <id>08-workout-detail</id>
  <title>Create workout detail view</title>
  <read_first>
    - src/db/schema.ts (Workout, WorkoutExercise, Set types)
    - src/components/exercise-card.tsx
  </read_first>
  <action>
    Create `src/app/workouts/[id]/page.tsx`:
    - Client component
    - Fetches single workout with all exercises and sets from Supabase
    - Shows workout header: name, date, duration, notes
    - Shows each exercise with its sets in a table or card layout
    - Set display: set number, weight, reps, volume (weight × reps)
    - Shows total workout volume
    - "Back to History" link
    - Read-only view (editing is Phase 3)
  </action>
  <acceptance_criteria>
    - src/app/workouts/[id]/page.tsx fetches workout by ID
    - Displays workout name, date, duration
    - Displays all exercises with sets
    - Shows volume per set and total volume
    - Read-only (no edit UI)
    - Link back to history list
  </acceptance_criteria>
</task>
```

### Plan 04: App Navigation & Entry Points

**Objective:** Add navigation to workouts and integrate the workout flow into the app shell.

**Tasks:**

```xml
<task>
  <id>09-nav-integration</id>
  <title>Update navigation and add workout entry points</title>
  <read_first>
    - src/components/header.tsx
    - src/app/page.tsx
  </read_first>
  <action>
    1. Update `src/components/header.tsx`:
       - Add "Workouts" link to navigation
       - Highlight active route

    2. Update `src/app/page.tsx`:
       - Change from redirect to /exercises
       - Show simple dashboard: "Start Workout" CTA button, recent workouts preview (last 3), link to exercises

    3. Ensure all new pages are linked and accessible
  </action>
  <acceptance_criteria>
    - Header has "Workouts" navigation link
    - Home page shows "Start Workout" button linking to /workouts/active
    - Home page shows recent workouts preview
    - All routes are accessible and linked
  </acceptance_criteria>
</task>
```

## Verification

After all plans execute, the following must be true:

1. **Database:** `supabase/migrations/002_workouts.sql` creates workouts, workout_exercises, and sets tables with proper indexes and RLS
2. **Schema:** TypeScript types for all new tables exist and compile without errors
3. **Start workout:** User can navigate to /workouts/active and start a free-form workout
4. **Add exercises:** User can add exercises from the catalog to the active workout
5. **Log sets:** User can enter weight and reps for each set
6. **Duplicate set:** User can tap once to duplicate the last set's weight and reps
7. **Complete workout:** User can finish and save the workout to Supabase
8. **History:** User can see a list of past workouts at /workouts
9. **Detail:** User can view a read-only detail page for any past workout
10. **Pitfall prevention:**
    - Pitfall 3: Active workout state is local to the page, not global
    - Pitfall 6: workout_exercises stores denormalized exercise_name snapshot
    - Pitfall 8: weight is DECIMAL(8,2) in database
    - Pitfall 9: Large tap targets, duplicate-last-set button, minimal taps to log

## Threat Model

<threat_model>
## Security Assessment — Phase 2

**Threat surface:** Workout data insertion, client-side state, exercise picker

| Threat | Severity | Mitigation |
|--------|----------|------------|
| XSS via workout notes | LOW | React auto-escapes text content; never use dangerouslySetInnerHTML |
| SQL injection via exercise picker | LOW | Supabase client uses parameterized queries |
| Data loss on browser crash | MEDIUM | Auto-save to localStorage every 30 seconds during active workout |
| Incomplete workout save | LOW | Validate minimum data before save; show error and allow retry |
| Race condition on duplicate set | LOW | Client-side state only; no concurrent editing for single-user app |

**No HIGH severity threats identified for Phase 2.** Phase 2 is primarily client-side state management with single-user constraints.
</threat_model>
