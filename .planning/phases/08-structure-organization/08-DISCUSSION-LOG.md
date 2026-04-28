# Phase 08: Structure & Organization - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the Q&A.

**Date:** 2026-04-28
**Phase:** 08-structure-organization
**Mode:** discuss
**Areas discussed:** Scheduled workout model, Scheduled-to-actual linkage, Routine folder structure, Scheduled visibility

## Discussion Q&A

### Scheduled workout model

| Question | Answer | Notes |
|----------|--------|-------|
| How should scheduled workouts be stored? | Separate table | Clean separation between planning and logging |
| What fields should the table have? | Minimal fields | name, scheduled_date, routine_id (optional), notes, created_at |
| Should recurring patterns be supported? | No recurring | Keep it simple for this phase |
| What happens when user clicks to start? | Pre-populate active workout | Same pattern as "start from routine" |
| How should users create scheduled workouts? | Quick add form | Date picker + routine dropdown + name |
| What happens to missed scheduled workouts? | Keep as skipped | Dimmed/grayed out, maintains planning history |

### Scheduled-to-actual linkage

| Question | Answer | Notes |
|----------|--------|-------|
| How should scheduled link to actual workouts? | FK on workout table | `scheduled_workout_id` added to workouts table |

### Routine folder structure

| Question | Answer | Notes |
|----------|--------|-------|
| How should folders be structured in DB? | Separate folders table | `routine_folders` with routines getting `folder_id` FK |
| Should folders support nesting? | Nested folders | Max 2-3 levels deep |
| How should nested folders be represented? | parent_id on folders | Self-referential FK on `routine_folders` |
| How should users assign routines to folders? | Drag-and-drop + dropdown | DnD in folder view, dropdown when editing routine |

### Scheduled visibility

| Question | Answer | Notes |
|----------|--------|-------|
| Where should users see scheduled workouts? | Dedicated schedule page | New `/schedule` route |
| What should the schedule page look like? | Extend existing calendar heatmap | Show scheduled as different color/overlay |
| Should home dashboard show schedule info? | Show upcoming on home | Small "Up next" section |

## Deferred Ideas

- Recurring scheduled workouts (daily, weekly, monthly patterns)
- Auto-reschedule missed workouts
- Routine folder sharing/import
- Schedule notifications/reminders

---

*Phase: 08-structure-organization*
*Discussion completed: 2026-04-28*
