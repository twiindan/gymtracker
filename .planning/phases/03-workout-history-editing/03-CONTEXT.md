# Phase 3: Workout History & Editing - Context

**Gathered:** 2026-04-26
**Status:** Ready for execution

<domain>
## Phase Boundary

Enable users to review and correct past workout data. The history viewing basics were built in Phase 2 (list and detail pages). Phase 3 adds editing capabilities: change workout metadata, add/remove exercises and sets, edit set values, and delete workouts. No new database tables needed — just UI enhancements and mutations on existing tables.

</domain>

<decisions>
## Implementation Decisions

### State Management
- **D-26:** Editing state is COMPLETELY SEPARATE from active workout state. Reuse the same component patterns but in an isolated editing context. This prevents Pitfall 3.
- **D-27:** Edit mode on detail page toggles between read-only view and editable form.

### Data Model
- **D-28:** Add `deleted_at TIMESTAMPTZ` to workouts table for soft delete.
- **D-29:** History list queries filter: `deleted_at IS NULL`.
- **D-30:** Editing sets updates the existing `sets` table rows directly.
- **D-31:** Adding exercises to a past workout inserts new `workout_exercises` and `sets` records.

### UX
- **D-32:** Inline editing for sets (click to edit, blur to save, or explicit save).
- **D-33:** Confirmation dialog for workout delete.
- **D-34:** Show edit/delete buttons only on detail page, not on list.
- **D-35:** After editing, refresh data from Supabase to show saved state.

### Calendar
- **D-36:** Calendar view is optional/nice-to-have. Implement only if time allows.

### the agent's Discretion
- Edit form layout (inline vs modal vs full-page edit mode)
- Delete confirmation wording
- Date filter presets
- Calendar library choice (or custom implementation)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §Workout Logging — LOG-03 (edit past workouts)
- `.planning/REQUIREMENTS.md` §History & Progress — HIST-01 (view past workouts)
- `.planning/ROADMAP.md` §Phase 3 — Phase goal, success criteria, dependencies

### Research
- `.planning/research/PITFALLS.md` §Pitfall 3 — Editing past workouts corrupts active session state
- `.planning/research/PITFALLS.md` §Pitfall 4 — Misleading progress charts

### Upstream Phase
- `.planning/phases/02-core-workout-logging/02-PLAN.md` — Workout schema, active logger, save flow
- `src/app/workouts/[id]/page.tsx` — Existing read-only detail page
- `src/app/workouts/page.tsx` — Existing history list
- `src/components/set-input.tsx` — Set input component (reusable for editing)
- `src/components/exercise-picker.tsx` — Exercise picker (reusable for adding)

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/workouts/[id]/page.tsx` — Read-only detail page to extend with edit mode
- `src/app/workouts/page.tsx` — History list to extend with filters
- `src/components/set-input.tsx` — Set input component
- `src/components/exercise-picker.tsx` — Exercise picker modal
- `src/db/schema.ts` — Workout, WorkoutExercise, Set types
- `src/db/client.ts` — Supabase client

### Established Patterns
- Client components with 'use client'
- Supabase queries via createBrowserClient
- Tailwind CSS styling
- Local state with useState/useReducer
- Modal overlays for pickers

### Integration Points
- Detail page will reuse ExercisePicker and SetInput
- History list will add filter UI and query modifications
- New migration for deleted_at column

</code_context>

<specifics>
## Specific Ideas

- "Inline edit" for sets — click a set value to edit, blur or Enter to save
- "Soft delete" with recovery — set deleted_at, filter in queries, allow undo
- "Date filter presets" — Last 7 days, 30 days, This year, All time
- "Exercise filter" — Show only workouts containing Bench Press
- "Volume sort" — Find highest volume workouts

</specifics>

<deferred>
## Deferred Ideas

- Calendar heatmap view (v2, CAL-01)
- Edit workout from list (quick edit modal)
- Batch delete workouts
- Export workout data (v2, CONV-04)
- Progress charts (Phase 5)

</deferred>

---

*Phase: 03-workout-history-editing*
*Context gathered: 2026-04-26*
