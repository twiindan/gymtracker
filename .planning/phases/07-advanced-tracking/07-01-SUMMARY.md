---
phase: 07-advanced-tracking
plan: 01
subsystem: workout-logging
tags: [rpe, tracking, migration, ui]
dependency:
  requires: []
  provides: [rpe-column, rpe-ui, rpe-persistence, rpe-history-display]
  affects: [sets-table, set-input-component, active-workout-page, workout-detail-page]
tech-stack:
  added: []
  patterns: [inline-input, nullable-column, badge-display]
key-files:
  created:
    - supabase/migrations/005_rpe.sql
  modified:
    - src/db/schema.ts
    - src/components/set-input.tsx
    - src/app/workouts/active/page.tsx
    - src/app/workouts/[id]/page.tsx
decisions:
  - RPE input uses compact number input (w-14) to fit alongside weight/reps
  - RPE only shown for reps/bodyweight tracking types (not duration/distance)
  - RPE displayed as blue badge/pill in history view
  - Null RPE values display as em-dash "—"
metrics:
  duration: ~5 min
  completed: "2026-04-28T10:55:00Z"
---

# Phase 07 Plan 01: RPE Tracking Summary

**One-liner:** Added RPE (Rate of Perceived Exertion) 1-10 tracking per set with database migration, inline input in SetInput, full save flow propagation, and badge display in workout history.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | RPE schema migration and type updates | `5d999f6` | `005_rpe.sql`, `schema.ts` |
| 2 | Inline RPE input in SetInput component | `a6c3928` | `set-input.tsx` |
| 3 | RPE propagation through save flow and history display | `d6ce3cb` | `active/page.tsx`, `[id]/page.tsx` |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: input-validation | `005_rpe.sql` | Database CHECK constraint `(rpe >= 1 AND rpe <= 10)` enforces valid range at DB level (T-07-01 mitigated) |

## Verification

- [x] `npx tsc --noEmit` passes
- [x] `npm run build` succeeds
- [x] Migration `005_rpe.sql` applied with CHECK constraint
- [x] SetInput renders RPE input for reps/bodyweight exercises
- [x] Active workout save flow includes RPE in sets insert
- [x] Workout history detail page displays RPE as blue badge/pill
- [x] Backward compatible: existing sets without RPE show "—"

## Self-Check: PASSED

All files verified present. All commits verified in git log.

- [x] `npx tsc --noEmit` passes
- [x] `npm run build` succeeds
- [x] Migration `005_rpe.sql` applied with CHECK constraint
- [x] SetInput renders RPE input for reps/bodyweight exercises
- [x] Active workout save flow includes RPE in sets insert
- [x] Workout history detail page displays RPE as blue badge/pill
- [x] Backward compatible: existing sets without RPE show "—"
