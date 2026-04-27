---
phase: 1
phase_name: Foundation & Exercise Database
wave: 1
depends_on: []
files_modified:
  - package.json
  - next.config.ts
  - tsconfig.json
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/globals.css
  - src/db/schema.ts
  - src/db/client.ts
  - src/lib/exercises.ts
  - src/app/exercises/page.tsx
  - src/app/exercises/page.module.css
  - src/components/exercise-search.tsx
  - src/components/exercise-search.module.css
  - src/components/exercise-list.tsx
  - src/components/exercise-list.module.css
  - src/components/exercise-card.tsx
  - src/components/exercise-card.module.css
  - src/components/custom-exercise-form.tsx
  - src/components/custom-exercise-form.module.css
  - supabase/migrations/001_exercises.sql
  - scripts/seed-exercises.ts
requirements_addressed: [DB-01, DB-02]
autonomous: true
---

# Phase 1: Foundation & Exercise Database

## Objective

Build the exercise catalog — a searchable database of built-in exercises (seeded from wger) plus the ability to add custom exercises. This is the data foundation that all other phases depend on. No workout logging, history, or routines in this phase.

## Must Haves

1. Supabase database schema with `exercises` table supporting nullable weight/reps, tracking_type enum, and multiple muscle groups
2. Seed script that imports ~200-400 exercises from wger data into Supabase
3. Exercise search page with type-ahead filtering by name and muscle group
4. Custom exercise creation form with validation
5. Built-in exercises are read-only; custom exercises are editable/deletable
6. All weights stored as DECIMAL (not FLOAT) to prevent precision errors

## Plans

### Plan 01: Database Schema & Supabase Setup

**Objective:** Create the Supabase database schema for exercises with all Phase 1 pitfall preventions built in.

**Tasks:**

```xml
<task>
  <id>01-schema</id>
  <title>Create Supabase migration for exercises table</title>
  <read_first>
    - .planning/research/ARCHITECTURE.md (recommended schema)
    - .planning/research/PITFALLS.md (Pitfall 1, 6, 8 prevention)
    - .planning/phases/01-foundation-exercise-database/01-CONTEXT.md (decisions D-01, D-05, D-06, D-08, D-09)
  </read_first>
  <action>
    Create `supabase/migrations/001_exercises.sql` with:

    1. `exercises` table:
       - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
       - `name TEXT NOT NULL UNIQUE`
       - `primary_muscle_group TEXT NOT NULL` (e.g., 'Chest', 'Back', 'Quadriceps')
       - `secondary_muscle_groups TEXT[] DEFAULT '{}'` (array for multiple secondary muscles)
       - `equipment TEXT` (e.g., 'Barbell', 'Dumbbell', 'Machine', 'Bodyweight', 'Cable')
       - `tracking_type TEXT NOT NULL DEFAULT 'reps' CHECK (tracking_type IN ('reps', 'duration', 'distance', 'bodyweight'))`
       - `is_custom BOOLEAN NOT NULL DEFAULT false`
       - `is_active BOOLEAN NOT NULL DEFAULT true` (soft deactivation, never delete built-in)
       - `description TEXT` (optional, from wger)
       - `created_at TIMESTAMPTZ DEFAULT now()`
       - `updated_at TIMESTAMPTZ DEFAULT now()`

    2. Indexes:
       - `CREATE INDEX idx_exercises_name_trgm ON exercises USING gin(name gin_trgm_ops)` (requires pg_trgm extension)
       - `CREATE INDEX idx_exercises_muscle_group ON exercises(primary_muscle_group)`
       - `CREATE INDEX idx_exercises_equipment ON exercises(equipment)`
       - `CREATE INDEX idx_exercises_tracking_type ON exercises(tracking_type)`
       - `CREATE INDEX idx_exercises_is_custom ON exercises(is_custom)`

    3. Enable pg_trgm extension:
       - `CREATE EXTENSION IF NOT EXISTS pg_trgm;`

    4. Row-level security:
       - Since this is single-user, enable RLS but keep it simple:
       - `ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;`
       - `CREATE POLICY "exercises_read_all" ON exercises FOR SELECT USING (true);`
       - `CREATE POLICY "exercises_insert_custom" ON exercises FOR INSERT WITH CHECK (is_custom = true);`
       - `CREATE POLICY "exercises_update_custom" ON exercises FOR UPDATE USING (is_custom = true);`
       - `CREATE POLICY "exercises_delete_custom" ON exercises FOR DELETE USING (is_custom = true);`
       - Built-in exercises (is_custom = false) cannot be INSERT/UPDATE/DELETE by user policies.
  </action>
  <acceptance_criteria>
    - supabase/migrations/001_exercises.sql contains CREATE TABLE exercises with all 11 columns listed above
    - File contains CREATE EXTENSION IF NOT EXISTS pg_trgm
    - File contains at least 4 CREATE INDEX statements including gin_trgm_ops index on name
    - File contains ALTER TABLE exercises ENABLE ROW LEVEL SECURITY
    - File contains 4 RLS policies: select all, insert/update/delete custom only
    - tracking_type column has CHECK constraint with values 'reps', 'duration', 'distance', 'bodyweight'
    - secondary_muscle_groups column is TEXT[] type
    - weight is NOT in this table (stored in sets table in later phases)
  </acceptance_criteria>
</task>

<task>
  <id>02-supabase-client</id>
  <title>Set up Supabase client and database types</title>
  <read_first>
    - .planning/research/STACK.md (Supabase patterns)
    - .planning/phases/01-foundation-exercise-database/01-CONTEXT.md (decision D-01)
    - AGENTS.md (project patterns: @/* path alias, createServerClient)
  </read_first>
  <action>
    1. Install dependencies: `npm install @supabase/supabase-js @supabase/ssr`

    2. Create `src/db/client.ts`:
       - Export `createClient()` function that returns a Supabase client using `createServerClient` from `@supabase/ssr`
       - Read `SUPABASE_URL` and `SUPABASE_ANON_KEY` from environment variables
       - Export `createBrowserClient()` for client components using `createBrowserClient` from `@supabase/ssr`

    3. Create `src/db/schema.ts`:
       - Export TypeScript types matching the exercises table:
         ```typescript
         export type TrackingType = 'reps' | 'duration' | 'distance' | 'bodyweight';

         export interface Exercise {
           id: string;
           name: string;
           primary_muscle_group: string;
           secondary_muscle_groups: string[];
           equipment: string | null;
           tracking_type: TrackingType;
           is_custom: boolean;
           is_active: boolean;
           description: string | null;
           created_at: string;
           updated_at: string;
         }
         ```
       - Export `MUSCLE_GROUPS` constant: `['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Abs', 'Forearms', 'Traps', 'Lats', 'Lower Back', 'Full Body', 'Cardio']`
       - Export `EQUIPMENT_TYPES` constant: `['Barbell', 'Dumbbell', 'Machine', 'Cable', 'Bodyweight', 'Kettlebell', 'Resistance Band', 'Smith Machine', 'EZ Bar', 'Trap Bar', 'Other']`

    4. Create `.env.local.example` with:
       ```
       SUPABASE_URL=your-project-url
       SUPABASE_ANON_KEY=your-anon-key
       ```
  </action>
  <acceptance_criteria>
    - src/db/client.ts exports createClient and createBrowserClient functions
    - src/db/client.ts imports createServerClient and createBrowserClient from @supabase/ssr
    - src/db/schema.ts exports Exercise interface with all 11 fields matching the SQL schema
    - src/db/schema.ts exports TrackingType type union with exactly 4 values
    - src/db/schema.ts exports MUSCLE_GROUPS array with at least 12 muscle groups
    - src/db/schema.ts exports EQUIPMENT_TYPES array with at least 8 equipment types
    - .env.local.example contains SUPABASE_URL and SUPABASE_ANON_KEY
    - package.json includes @supabase/supabase-js and @supabase/ssr dependencies
  </acceptance_criteria>
</task>
```

### Plan 02: Exercise Seed Data

**Objective:** Seed the exercises table with ~200-400 built-in exercises from wger open-source data.

**Tasks:**

```xml
<task>
  <id>03-seed-script</id>
  <title>Create seed script for built-in exercises</title>
  <read_first>
    - .planning/research/FEATURES.md (exercise database requirements)
    - .planning/research/PITFALLS.md (Pitfall 1, 6 prevention)
    - .planning/phases/01-foundation-exercise-database/01-CONTEXT.md (decisions D-03, D-04, D-06)
    - src/db/schema.ts (Exercise type, MUSCLE_GROUPS, EQUIPMENT_TYPES)
  </read_first>
  <action>
    Create `scripts/seed-exercises.ts` that:

    1. Connects to Supabase using the server client
    2. Defines a seed data array of ~200-400 exercises covering all major muscle groups and equipment types
    3. Each exercise object has: name, primary_muscle_group, secondary_muscle_groups (array), equipment, tracking_type, is_custom: false, description
    4. Uses `upsert` on the `name` column to avoid duplicates on re-run
    5. Logs count of inserted/updated exercises
    6. Is idempotent — safe to run multiple times

    Seed data must include at minimum:
    - Chest: Bench Press (Barbell, Dumbbell), Incline Press, Dips, Push-ups, Cable Fly, Pec Deck
    - Back: Deadlift, Pull-ups, Lat Pulldown, Barbell Row, Dumbbell Row, T-Bar Row, Face Pulls
    - Shoulders: Overhead Press (Barbell, Dumbbell), Lateral Raise, Front Raise, Reverse Fly, Upright Row
    - Biceps: Barbell Curl, Dumbbell Curl, Hammer Curl, Preacher Curl, Cable Curl
    - Triceps: Tricep Pushdown, Overhead Tricep Extension, Skull Crushers, Dips, Kickbacks
    - Quadriceps: Squat (Barbell, Front), Leg Press, Leg Extension, Lunges, Bulgarian Split Squat, Hack Squat
    - Hamstrings: Romanian Deadlift, Leg Curl (Seated, Lying), Good Morning, Glute-Ham Raise
    - Glutes: Hip Thrust, Glute Bridge, Cable Kickback, Sumo Squat
    - Calves: Standing Calf Raise, Seated Calf Raise, Donkey Calf Raise
    - Abs: Plank, Crunches, Hanging Leg Raise, Cable Crunch, Ab Wheel Rollout, Russian Twist
    - Full Body: Clean and Jerk, Snatch, Thrusters, Burpees
    - Cardio: Running, Cycling, Rowing, Jump Rope, Swimming (tracking_type: 'duration')
    - Bodyweight: Pull-ups, Push-ups, Dips, Air Squats, Pistol Squats (tracking_type: 'reps' or 'bodyweight')

    Total: at least 80 exercises minimum across all muscle groups. More is better (target 200+).
  </action>
  <acceptance_criteria>
    - scripts/seed-exercises.ts exists and is executable with `npx tsx scripts/seed-exercises.ts`
    - Seed data array contains at least 80 exercise objects
    - Seed data covers all 12+ muscle groups in MUSCLE_GROUPS
    - At least 5 exercises have tracking_type other than 'reps' (e.g., 'duration' for cardio, 'bodyweight' for calisthenics)
    - Script uses upsert (onConflict('name')) to handle re-runs
    - Script logs final count of inserted/updated rows
    - All seed exercises have is_custom: false
    - secondary_muscle_groups is an array (can be empty []) for each exercise
  </acceptance_criteria>
</task>
```

### Plan 03: Exercise Search & Browse UI

**Objective:** Build the exercise catalog page with type-ahead search, muscle group filtering, and exercise display.

**Tasks:**

```xml
<task>
  <id>04-exercise-page</id>
  <title>Create exercise catalog page with search</title>
  <read_first>
    - .planning/phases/01-foundation-exercise-database/01-CONTEXT.md (decisions D-10, D-11, D-12)
    - src/db/schema.ts (Exercise type)
    - src/db/client.ts (Supabase client)
    - AGENTS.md (Next.js patterns: 'use client', @/* alias, CSS Modules)
  </read_first>
  <action>
    1. Create `src/app/exercises/page.tsx` — the main exercise catalog page:
       - Client component ('use client')
       - Fetches all exercises from Supabase on mount
       - Shows a search input at the top
       - Shows muscle group filter buttons below search
       - Shows exercise list below filters
       - Loading state while fetching
       - Empty state when no exercises match

    2. Create `src/app/exercises/page.module.css`:
       - Mobile-first responsive layout
       - Search input: full-width, large tap target (min 44px height)
       - Filter buttons: horizontal scroll on mobile, wrap on desktop
       - Exercise list: card layout with clear spacing

    3. Create `src/components/exercise-search.tsx`:
       - Controlled input with debounced filtering (200ms)
       - Filters exercises by name (case-insensitive substring match)
       - Shows character count / result count
       - Clear button when search has text

    4. Create `src/components/exercise-search.module.css`:
       - Input with search icon
       - Clear button (X) visible only when search has text
       - Result count badge

    5. Create `src/components/exercise-list.tsx`:
       - Accepts filtered exercises array and active muscle group filter
       - Groups exercises by primary_muscle_group when no search active
       - Shows flat list when search is active
       - Renders ExerciseCard for each exercise
       - Empty state message when no results

    6. Create `src/components/exercise-list.module.css`:
       - Group headers with muscle group name and count
       - Card grid layout (1 column mobile, 2 columns tablet+)
  </action>
  <acceptance_criteria>
    - src/app/exercises/page.tsx contains 'use client' directive
    - src/app/exercises/page.tsx imports and uses ExerciseSearch, ExerciseList components
    - src/app/exercises/page.tsx fetches exercises from Supabase using createClient
    - src/components/exercise-search.tsx exports a component that accepts exercises array and onSearch callback
    - src/components/exercise-search.tsx implements debounced filtering (setTimeout or useDebounce)
    - src/components/exercise-list.tsx renders ExerciseCard components
    - src/components/exercise-list.tsx handles empty state with a message
    - All CSS module files exist and are imported by their corresponding components
    - package.json has a script to run seed: "seed": "npx tsx scripts/seed-exercises.ts"
  </acceptance_criteria>
</task>

<task>
  <id>05-exercise-card</id>
  <title>Create exercise card component</title>
  <read_first>
    - src/db/schema.ts (Exercise type)
    - .planning/phases/01-foundation-exercise-database/01-CONTEXT.md (decision D-06)
    - AGENTS.md (CSS Modules pattern)
  </read_first>
  <action>
    Create `src/components/exercise-card.tsx`:
    - Props: `exercise: Exercise`, `onClick?: () => void`
    - Displays: exercise name (bold), primary muscle group (badge), equipment type (small text), tracking type icon
    - Visual distinction for custom exercises (small "Custom" badge)
    - Visual distinction for non-'reps' tracking types (e.g., clock icon for duration)
    - Clickable if onClick provided
    - Accessible: proper button/div semantics, aria-label

    Create `src/components/exercise-card.module.css`:
    - Card with subtle border and hover state
    - Muscle group badge: colored pill with consistent color per muscle group
    - Equipment text: muted color, smaller font
    - Custom badge: distinct color (e.g., purple)
    - Min-height for consistent card sizing
  </action>
  <acceptance_criteria>
    - src/components/exercise-card.tsx exports default React component
    - Component accepts exercise prop typed as Exercise from src/db/schema
    - Component renders exercise name, primary_muscle_group, and equipment
    - Component shows visual indicator when exercise.is_custom is true
    - Component shows visual indicator when tracking_type is not 'reps'
    - src/components/exercise-card.module.css exists and is imported
    - CSS uses CSS Modules class naming (no global classes)
  </acceptance_criteria>
</task>
```

### Plan 04: Custom Exercise CRUD

**Objective:** Allow users to add, edit, and delete their own custom exercises.

**Tasks:**

```xml
<task>
  <id>06-custom-exercise-form</id>
  <title>Create custom exercise creation form</title>
  <read_first>
    - .planning/phases/01-foundation-exercise-database/01-CONTEXT.md (decisions D-06, D-09)
    - src/db/schema.ts (Exercise type, MUSCLE_GROUPS, EQUIPMENT_TYPES)
    - .planning/research/PITFALLS.md (Pitfall 1: flexible data model)
  </read_first>
  <action>
    Create `src/components/custom-exercise-form.tsx`:
    - Form fields:
      - Name (text input, required, min 2 chars, max 50 chars)
      - Primary muscle group (select dropdown from MUSCLE_GROUPS, required)
      - Secondary muscle groups (multi-select checkboxes from MUSCLE_GROUPS, optional)
      - Equipment type (select dropdown from EQUIPMENT_TYPES, optional)
      - Tracking type (radio buttons: Reps, Duration, Distance, Bodyweight; default: Reps)
      - Description (textarea, optional, max 500 chars)
    - Validation: name must be unique (check against existing exercises before submit)
    - Submit button disabled until form is valid
    - Success message on creation
    - Error message on duplicate name or server error
    - Form resets after successful submission

    Create `src/components/custom-exercise-form.module.css`:
    - Form layout: stacked fields on mobile, 2-column on tablet+
    - Large tap targets for mobile (min 44px)
    - Validation error messages in red below fields
    - Submit button: prominent, full-width on mobile
  </action>
  <acceptance_criteria>
    - src/components/custom-exercise-form.tsx exports default React component
    - Form has input for name with required validation
    - Form has select for primary_muscle_group populated from MUSCLE_GROUPS
    - Form has multi-select (checkboxes) for secondary_muscle_groups
    - Form has select for equipment populated from EQUIPMENT_TYPES
    - Form has radio buttons for tracking_type with 4 options: reps, duration, distance, bodyweight
    - Form has optional textarea for description
    - Form checks for duplicate name before submission (queries exercises table)
    - Form inserts with is_custom: true via Supabase
    - Form shows success/error messages
    - src/components/custom-exercise-form.module.css exists and is imported
  </acceptance_criteria>
</task>

<task>
  <id>07-custom-exercise-actions</id>
  <title>Add edit and delete for custom exercises</title>
  <read_first>
    - src/components/exercise-card.tsx
    - src/components/custom-exercise-form.tsx
    - .planning/phases/01-foundation-exercise-database/01-CONTEXT.md (decision D-04: built-in are read-only)
  </read_first>
  <action>
    1. Modify `src/components/exercise-card.tsx`:
       - Add edit and delete buttons visible only when `exercise.is_custom` is true
       - Edit button opens the custom exercise form pre-filled with exercise data
       - Delete button shows confirmation dialog, then deletes from Supabase
       - Built-in exercises show no edit/delete buttons (read-only per D-04)

    2. Add delete functionality to exercise page:
       - Delete uses Supabase DELETE where `id = exercise.id AND is_custom = true`
       - Confirmation: "Delete '{exercise.name}'? This cannot be undone."
       - Optimistic UI: remove from list immediately, revert on error

    3. Add edit functionality:
       - Reuse CustomExerciseForm component in edit mode
       - Pre-fill form with existing exercise data
       - Update uses Supabase UPDATE where `id = exercise.id AND is_custom = true`
       - Success: update list, show success message
  </action>
  <acceptance_criteria>
    - ExerciseCard shows edit and delete buttons only when exercise.is_custom is true
    - Delete triggers a confirmation dialog before executing
    - Delete executes Supabase DELETE with WHERE is_custom = true condition
    - Edit opens CustomExerciseForm pre-filled with existing exercise data
    - Edit executes Supabase UPDATE with WHERE is_custom = true condition
    - Built-in exercises have no visible edit/delete UI
    - Optimistic update on delete (item removed from UI immediately)
  </acceptance_criteria>
</task>
```

### Plan 05: App Shell & Navigation

**Objective:** Set up the Next.js app shell with basic navigation to the exercises page.

**Tasks:**

```xml
<task>
  <id>08-app-shell</id>
  <title>Create Next.js app shell with navigation</title>
  <read_first>
    - AGENTS.md (Next.js 16 patterns, @/* alias, CSS Modules)
    - .planning/phases/01-foundation-exercise-database/01-CONTEXT.md (decision D-02: client-biased)
  </read_first>
  <action>
    1. Initialize Next.js 16 project if not already done:
       - `package.json` with next, react, react-dom, typescript
       - `next.config.ts` with basic config
       - `tsconfig.json` with paths: `"@/*": ["./src/*"]`

    2. Create `src/app/layout.tsx`:
       - Root layout with html lang="en"
       - Metadata: title "GymTracker", description
       - Link to globals.css
       - Navigation header with "GymTracker" logo and "Exercises" link

    3. Create `src/app/page.tsx`:
       - Landing page that redirects to /exercises
       - Or shows a simple dashboard placeholder with link to exercises

    4. Create `src/app/globals.css`:
       - CSS reset / normalize
       - CSS custom properties for colors (prepare for dark mode later)
       - Base typography styles
       - Mobile-first base styles

    5. Create `src/components/header.tsx` and `src/components/header.module.css`:
       - Fixed or sticky header with GymTracker branding
       - Navigation link to /exercises
       - Mobile-responsive (hamburger menu if needed, or simple links for v1)
  </action>
  <acceptance_criteria>
    - package.json has next, react, react-dom, typescript as dependencies
    - package.json has dev script: "dev": "next dev"
    - package.json has build script: "build": "next build"
    - next.config.ts exists
    - tsconfig.json has paths with "@/*": ["./src/*"]
    - src/app/layout.tsx exists with metadata and navigation header
    - src/app/page.tsx exists
    - src/app/globals.css exists with CSS custom properties and base styles
    - src/app/exercises/page.tsx exists (from Plan 03)
    - Navigation header includes link to /exercises
    - `npm run dev` starts without errors
    - `npm run build` completes without errors
  </acceptance_criteria>
</task>
```

## Verification

After all plans execute, the following must be true:

1. **Database:** `supabase/migrations/001_exercises.sql` creates exercises table with nullable fields, tracking_type enum, secondary_muscle_groups array, and DECIMAL-compatible weight column (for future phases)
2. **Seed data:** Running `npm run seed` inserts 80+ exercises covering all major muscle groups
3. **Search:** User can type in search box and see exercises filtered by name in real-time
4. **Browse:** User can tap a muscle group button and see all exercises for that group
5. **Custom exercises:** User can create a custom exercise with name, muscle group, equipment, and tracking type
6. **Read-only built-in:** Built-in exercises cannot be edited or deleted through the UI
7. **Custom CRUD:** Custom exercises can be edited and deleted with confirmation
8. **Type safety:** TypeScript compiles with no errors
9. **Build:** `npm run build` succeeds
10. **Pitfall prevention:**
    - Pitfall 1: Schema supports plank (no weight), running (duration), and bench press (weight+reps) via nullable fields and tracking_type
    - Pitfall 6: Built-in exercises are immutable (RLS policies prevent modification)
    - Pitfall 8: Weight column (future) will use DECIMAL type; no FLOAT in schema

## Threat Model

<threat_model>
## Security Assessment — Phase 1

**Threat surface:** Supabase database, client-side form inputs, seed script

| Threat | Severity | Mitigation |
|--------|----------|------------|
| XSS via custom exercise names | MEDIUM | React auto-escapes text content; never use dangerouslySetInnerHTML with user input |
| SQL injection via search | LOW | Supabase client uses parameterized queries; never concatenate user input into raw SQL |
| Unauthorized modification of built-in exercises | MEDIUM | RLS policies restrict UPDATE/DELETE to is_custom = true rows only |
| Duplicate exercise names | LOW | Unique constraint on name column; client-side check before submit |
| Environment variable leakage | LOW | .env.local in .gitignore; .env.local.example has placeholder values |

**No HIGH severity threats identified for Phase 1.** Phase 1 is read-heavy with minimal user input surface. The RLS policy on exercises table is the primary security control.
</threat_model>
