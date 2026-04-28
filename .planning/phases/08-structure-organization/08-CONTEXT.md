# Phase 08: Structure & Organization - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers two features: (1) scheduled workouts — users can plan future workouts on a calendar and start them with one tap, and (2) routine folders — users can organize routines hierarchically into folders and subfolders. This phase does NOT add recurring schedule patterns, data export, or dark mode.

</domain>

<decisions>
## Implementation Decisions

### Scheduled Workouts — Data Model
- **D-70:** New `scheduled_workouts` table, separate from `workouts`. Clean separation between planning and logging.
- **D-71:** Minimal fields: `id` (uuid, PK), `name` (text), `scheduled_date` (date), `routine_id` (uuid, nullable FK to routines), `notes` (text, nullable), `created_at` (timestamptz).
- **D-72:** No recurring support in this phase. Each scheduled workout is a single entry.
- **D-73:** Past scheduled workouts that weren't completed are kept as "skipped" — dimmed/grayed out in the UI. Maintains full planning history.

### Scheduled Workouts — Interaction
- **D-74:** Clicking a scheduled workout opens the active workout page pre-populated (same pattern as "start from routine"). The scheduled entry stays in DB and is marked as fulfilled.
- **D-75:** Users create scheduled workouts via a quick add form: pick date, pick routine (optional), name it.

### Scheduled-to-Actual Linkage
- **D-76:** Add `scheduled_workout_id` (uuid, nullable FK) to the `workouts` table. When a scheduled workout is started and completed, this links the actual workout back to the schedule entry.

### Routine Folders — Data Model
- **D-77:** New `routine_folders` table: `id` (uuid, PK), `name` (text), `parent_id` (uuid, nullable self-referential FK), `created_at` (timestamptz).
- **D-78:** Folders support nesting via `parent_id`. Max 2-3 levels deep.
- **D-79:** Routines table gets a nullable `folder_id` FK to `routine_folders`.

### Routine Folders — UX
- **D-80:** Users assign routines to folders via drag-and-drop reordering in folder view, plus a dropdown picker when creating or editing a routine.

### Scheduled Workouts — Visibility
- **D-81:** Dedicated `/schedule` page for viewing and managing scheduled workouts.
- **D-82:** Extend the existing `calendar-heatmap.tsx` component to show scheduled workouts as a different color/overlay on the heatmap.
- **D-83:** Home dashboard shows upcoming scheduled workouts as a small "Up next" section.

### the agent's Discretion
- Exact UI styling for skipped vs upcoming scheduled workouts
- Drag-and-drop library choice (no DnD library currently in project)
- How many upcoming scheduled workouts to show on home dashboard
- Folder icon and visual hierarchy styling
- Whether to show routine count per folder in the list view

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 3: Structure & Organization — Phase goal, success criteria, deferred sources
- `.planning/REQUIREMENTS.md` — No specific v2 requirements numbered yet; this phase creates CAL-01 extension and new scheduling capability

### Existing Code
- `src/components/calendar-heatmap.tsx` — Existing heatmap component to extend with scheduled overlay
- `src/lib/calendar-utils.ts` — Calendar data utilities to extend for scheduled data
- `src/app/routines/page.tsx` — Existing routines list to add folder grouping
- `src/app/routines/[id]/page.tsx` — Routine detail to add folder assignment
- `src/db/schema.ts` — All entity types (routines, workouts tables to extend)
- `src/db/client.ts` — Supabase client
- `src/app/page.tsx` — Home dashboard to add "Up next" section

### Upstream Phase Decisions
- `.planning/phases/04-routines-workout-templates/04-CONTEXT.md` — Routines always editable (D-41), independent workouts (D-43), denormalized snapshots (D-38)
- `.planning/phases/06-calendar-visualization/CONTEXT.md` — Calendar heatmap implementation, Recharts usage

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/calendar-heatmap.tsx` — GitHub-style heatmap, already handles workout date aggregation. Can extend to show scheduled workout indicators.
- `src/lib/calendar-utils.ts` — Date aggregation utilities. Can add scheduled workout query helpers.
- `src/components/exercise-picker.tsx` — Reusable for routine selection in the quick add form.
- `src/app/workouts/active/page.tsx` — Active workout logger with pre-population from routine_id URL param. Same pattern for scheduled workout start.
- `src/db/schema.ts` — Existing routines and workouts types. Need new ScheduledWorkout and RoutineFolder types.

### Established Patterns
- Client components with local state (useState/useReducer)
- Supabase queries via createBrowserClient
- Tailwind CSS for styling
- Mobile-first responsive design
- Denormalized snapshots for historical integrity
- Nullable FK columns for optional relationships

### Integration Points
- New `/schedule` route in `src/app/schedule/page.tsx`
- `workouts` table needs `scheduled_workout_id` column (migration)
- `routines` table needs `folder_id` column (migration)
- Two new tables: `scheduled_workouts` and `routine_folders`
- Home dashboard (`src/app/page.tsx`) needs upcoming scheduled workout query
- Routines list page needs folder grouping UI

</code_context>

<specifics>
## Specific Ideas

- Scheduled workouts should feel like a lightweight planning tool — not a full calendar app
- "Up next" on home should be glanceable: show the next 1-2 upcoming scheduled workouts
- Folder nesting should support training programs like "Push/Pull/Legs > Week 1 > Day A"
- Quick add form should be fast: date picker + routine dropdown + name field, done

</specifics>

<deferred>
## Deferred Ideas

- Recurring scheduled workouts (daily, weekly, monthly patterns) — future phase
- Auto-reschedule missed workouts — future enhancement
- Routine folder sharing/import — out of scope for personal app
- Schedule notifications/reminders — requires PWA or push notifications

</deferred>

---

*Phase: 08-structure-organization*
*Context gathered: 2026-04-28*
