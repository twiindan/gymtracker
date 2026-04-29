# Phase 09: Convenience & Polish - Context

**Gathered:** 2026-04-29
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers data export functionality — users can export all their GymTracker data (workouts, exercises, routines, scheduled workouts, folders, PRs, RPE) in both JSON and CSV formats. Export is initiated from a Settings page with instant download. This phase does NOT add dark mode, recurring exports, import functionality, or general UI polish — those are deferred.

</domain>

<decisions>
## Implementation Decisions

### Export Scope
- **D-84:** Export includes ALL user data — workouts, exercises, routines, scheduled workouts, routine folders, PRs, RPE data. User owns everything.

### Export Format
- **D-85:** Both JSON and CSV formats available. JSON preserves nested structure; CSV is spreadsheet-friendly.

### Export Placement
- **D-86:** Export lives on a new Settings page (`/settings`). Standard pattern that scales for future settings options.

### Export Trigger
- **D-87:** Instant download — user clicks export, data is generated client-side and downloaded immediately. No async processing needed for personal app scale.

### Export Structure — JSON
- **D-88:** Single JSON file with nested objects. Workouts contain exercises contain sets. Routines, scheduled workouts, and folders are top-level arrays. Clean, importable structure.

### Export Structure — CSV
- **D-89:** Flat denormalized CSV — one row per set, with workout and exercise info repeated per row. Works directly in spreadsheets. Column headers: workout_date, workout_name, exercise_name, set_number, weight, reps, rpe, notes, etc.

### the agent's Discretion
- JSON key naming conventions (camelCase vs snake_case)
- CSV column naming and ordering
- Date format in exports (ISO 8601 recommended)
- Settings page layout and styling
- Whether to include metadata (export timestamp, app version) in the JSON file
- File naming convention for downloads (e.g., `gymtracker-export-2026-04-29.json`)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/ROADMAP.md` §Phase 4: Convenience & Polish — Phase goal, CONV-04 requirement
- `.planning/REQUIREMENTS.md` §CONV-04 — Data export to CSV/JSON for user data ownership

### Existing Code
- `src/db/schema.ts` — All entity types that need to be exported (workouts, exercises, sets, routines, scheduled_workouts, routine_folders)
- `src/db/client.ts` — Supabase client for data fetching
- `src/components/header.tsx` — Existing header to add Settings nav link

### Upstream Phase Decisions
- `.planning/phases/04-routines-workout-templates/04-CONTEXT.md` — Denormalized snapshots (D-38), routines always editable (D-41)
- `.planning/phases/07-advanced-tracking/07-CONTEXT.md` — RPE tracking (D-07-01 through D-07-04)
- `.planning/phases/08-structure-organization/08-CONTEXT.md` — Scheduled workouts (D-70 through D-76), routine folders (D-77 through D-80)

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/db/schema.ts` — All TypeScript types for entities to export. Can reuse for shaping export data.
- `src/db/client.ts` — Supabase client for fetching all user data.
- `src/components/header.tsx` — Existing header component to add Settings link.
- `src/app/layout.tsx` — App layout to add `/settings` route.

### Established Patterns
- Client components with local state (useState/useReducer)
- Supabase queries via createBrowserClient
- Tailwind CSS for styling
- Mobile-first responsive design
- Denormalized snapshots for historical integrity (workout_exercises, routine_exercises)

### Integration Points
- New `/settings` route in `src/app/settings/page.tsx`
- Header nav needs Settings link
- Export utility functions in `src/lib/export-utils.ts` (new file)
- Client-side data fetching and file download (no server-side processing)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for file naming, date formatting, and JSON structure.

</specifics>

<deferred>
## Deferred Ideas

- Dark mode (POL-01) — future phase
- Import functionality — reverse of export, separate phase
- Recurring scheduled exports — not needed for personal app
- General UI polish pass — deferred to keep this phase focused
- Reviewed Todos (not folded): None

</deferred>

---

*Phase: 09-convenience-polish*
*Context gathered: 2026-04-29*
