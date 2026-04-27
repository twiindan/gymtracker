---
phase: 3
phase_name: Workout History & Editing
depends_on: [02-core-workout-logging]
files_modified:
  - src/app/workouts/[id]/page.tsx
  - src/app/workouts/page.tsx
  - src/components/workout-detail.tsx
  - src/components/workout-history-list.tsx
  - src/components/workout-edit-form.tsx
  - src/components/set-input.tsx
  - src/components/exercise-picker.tsx
requirements_addressed: [HIST-01, LOG-03]
autonomous: true
---

# Phase 3: Workout History & Editing

## Objective

Enable users to review and correct past workout data. This is critical for data accuracy — users make mistakes (wrong weight, missed sets, wrong exercise) and need a way to fix them without creating a new workout. This phase addresses Pitfall 3 (state isolation between editing and active logging) and enhances the history viewing experience.

## Must Haves

1. Edit workout metadata: name, date, notes
2. Add/remove exercises from a past workout
3. Edit set values (weight, reps) inline
4. Add/remove sets from past workouts
5. Delete workout with confirmation
6. Soft delete support (`is_deleted` flag or use `deleted_at`)
7. Enhanced history list with filtering by date range
8. History list shows more summary stats (duration, volume per workout)

## Plans

### Plan 01: Workout Edit Mode

**Objective:** Add full edit capabilities to the workout detail page.

**Tasks:**

```xml
<task>
  <id>01-edit-metadata</id>
  <title>Add workout metadata editing (name, date, notes)</title>
  <read_first>
    - src/app/workouts/[id]/page.tsx (existing detail page)
    - src/db/schema.ts (Workout type)
    - .planning/research/PITFALLS.md §Pitfall 3 (state isolation)
  </read_first>
  <action>
    Update `src/app/workouts/[id]/page.tsx`:
    
    1. Add edit mode toggle (Edit / Save / Cancel buttons)
    2. In edit mode:
       - Name: text input
       - Date: datetime-local input for started_at
       - Notes: textarea
    3. On save:
       - Update workout record in Supabase
       - Refresh data from database
       - Exit edit mode
    4. On cancel:
       - Revert to original values
       - Exit edit mode
    5. Keep edit state local to this page (never touches active workout state)
  </action>
  <acceptance_criteria>
    - Workout detail page has "Edit" button
    - Edit mode shows editable inputs for name, date, notes
    - Save persists changes to Supabase
    - Cancel reverts changes
    - Edit state is local to the page component
  </acceptance_criteria>
</task>

<task>
  <id>02-edit-exercises-sets</id>
  <title>Add exercise and set editing to workout detail</title>
  <read_first>
    - src/app/workouts/active/page.tsx (active workout patterns)
    - src/components/set-input.tsx
    - src/components/exercise-picker.tsx
    - src/db/schema.ts (Set, WorkoutExercise types)
  </read_first>
  <action>
    Update `src/app/workouts/[id]/page.tsx`:
    
    1. In edit mode, allow adding exercises:
       - Reuse ExercisePicker component
       - Insert new workout_exercise record into Supabase
       - Refresh data
       
    2. In edit mode, allow removing exercises:
       - Delete button on each exercise
       - Cascade delete sets (ON DELETE CASCADE handles this)
       - Confirmation dialog
       
    3. In edit mode, allow editing sets:
       - Reuse SetInput component (or create read-only/edit variants)
       - Update set record in Supabase on change
       - Handle set_number resequencing after delete
       
    4. In edit mode, allow adding sets:
       - "Add Set" button per exercise
       - Insert new set record
       
    5. In edit mode, allow deleting sets:
       - Delete button on each set
       - Resequence set_numbers after delete
  </action>
  <acceptance_criteria>
    - Can add exercises to a past workout
    - Can remove exercises from a past workout
    - Can edit weight and reps of existing sets
    - Can add sets to an exercise
    - Can delete sets from an exercise
    - Set numbers are resequenced after delete
    - All changes persist to Supabase
  </acceptance_criteria>
</task>
```

### Plan 02: Workout Delete & Soft Delete

**Objective:** Allow users to delete workouts with soft delete for data recovery.

**Tasks:**

```xml
<task>
  <id>03-soft-delete</id>
  <title>Implement soft delete for workouts</title>
  <read_first>
    - src/app/workouts/[id]/page.tsx
    - src/app/workouts/page.tsx
  </read_first>
  <action>
    1. Update `workouts` table:
       - Add `deleted_at TIMESTAMPTZ` column (nullable, default null)
       - Create migration `003_soft_delete.sql`
       
    2. Update history list query:
       - Filter out workouts where `deleted_at IS NOT NULL`
       
    3. Add delete button to workout detail:
       - Confirmation dialog: "Delete this workout? This cannot be undone."
       - On confirm: set `deleted_at = now()`
       - Redirect to history list
       
    4. Add "Deleted Workouts" view (optional, can be deferred):
       - Show recently deleted workouts
       - Allow restore within 30 days
  </action>
  <acceptance_criteria>
    - deleted_at column added to workouts table
    - History list filters out deleted workouts
    - Delete button shows confirmation dialog
    - Delete sets deleted_at timestamp
    - Redirect after delete
  </acceptance_criteria>
</task>
```

### Plan 03: Enhanced History List

**Objective:** Improve the workout history list with better filtering and stats.

**Tasks:**

```xml
<task>
  <id>04-history-filters</id>
  <title>Add date filtering and search to workout history</title>
  <read_first>
    - src/app/workouts/page.tsx (existing history list)
    - src/db/schema.ts (Workout type)
  </read_first>
  <action>
    Update `src/app/workouts/page.tsx`:
    
    1. Add date range filter:
       - "Last 7 days", "Last 30 days", "This year", "All time" buttons
       - Query filter based on started_at
       
    2. Add exercise filter:
       - Dropdown to filter workouts that include a specific exercise
       - Requires JOIN query
       
    3. Add sort options:
       - Date (newest first) — default
       - Volume (highest first)
       - Duration (longest first)
       
    4. Show weekly/monthly summary:
       - Total workouts this week
       - Total volume this week
       - Average workout duration
  </action>
  <acceptance_criteria>
    - Date range filters work
    - Exercise filter works
    - Sort options work
    - Weekly summary stats shown
  </acceptance_criteria>
</task>
```

### Plan 04: Calendar View (Optional)

**Objective:** Add a calendar view for visual workout history.

**Tasks:**

```xml
<task>
  <id>05-calendar-view</id>
  <title>Create calendar view of workout history</title>
  <read_first>
    - src/app/workouts/page.tsx
    - .planning/REQUIREMENTS.md §Calendar & Visualization
  </read_first>
  <action>
    Create `src/app/workouts/calendar/page.tsx`:
    
    1. Month-view calendar
    2. Days with workouts highlighted
    3. Click day to see workout(s) for that day
    4. Navigation: previous/next month
    5. Today indicator
    
    This is a nice-to-have for v1. If time-constrained, defer to v2.
  </action>
  <acceptance_criteria>
    - Calendar shows current month
    - Days with workouts are highlighted
    - Clicking a day shows workout details
    - Can navigate between months
  </acceptance_criteria>
</task>
```

## Verification

After all plans execute, the following must be true:

1. **Edit workout:** User can edit name, date, and notes of any past workout
2. **Edit exercises:** User can add/remove exercises from a past workout
3. **Edit sets:** User can change weight/reps, add/remove sets
4. **Delete:** User can delete a workout with confirmation (soft delete)
5. **History filters:** User can filter history by date range and exercise
6. **State isolation:** Editing a past workout never affects the active workout state
7. **TypeScript:** `npm run build` succeeds with zero errors

## Threat Model

<threat_model>
## Security Assessment — Phase 3

**Threat surface:** Workout data mutation, edit permissions, soft delete

| Threat | Severity | Mitigation |
|--------|----------|------------|
| Accidental data loss | MEDIUM | Soft delete (deleted_at) instead of hard delete; confirmation dialogs |
| Concurrent edit conflicts | LOW | Single-user app; no concurrent editing possible |
| XSS via workout notes | LOW | React auto-escapes text content |
| SQL injection | LOW | Supabase parameterized queries |

**No HIGH severity threats identified for Phase 3.**
</threat_model>
