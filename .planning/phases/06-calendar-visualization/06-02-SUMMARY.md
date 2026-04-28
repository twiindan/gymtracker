---
phase: 06
phase_name: Calendar & Visualization
plan: 02
subsystem: visualization
tags: [muscle-volume, bar-chart, recharts, insights, time-window]
dependency_graph:
  requires: [CAL-01]
  provides: [CAL-02]
  affects: [insights-page]
tech_stack:
  added: [recharts BarChart vertical layout]
  patterns: [client-component, 3-query-aggregation, css-variables, pill-toggle]
key_files:
  created:
    - src/lib/muscle-volume-utils.ts
    - src/components/muscle-volume-chart.tsx
  modified:
    - src/app/insights/page.tsx
decisions:
  - D-06-04: Used type assertions for Supabase select results to satisfy TypeScript (matching calendar-utils.ts pattern)
  - D-06-05: Tooltip formatter uses unknown type for value/name parameters to satisfy Recharts v5+ type constraints
  - D-06-06: Loading skeleton uses randomized bar widths for visual variety (Math.random()) rather than fixed widths
metrics:
  duration_minutes: 12
  completed_date: "2026-04-28"
---

# Phase 06 Plan 02: Muscle Group Volume Tracking Summary

**One-liner:** Horizontal bar chart showing total sets per muscle group with 7d/30d/90d time window toggle, integrated into /insights page below the calendar heatmap.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create muscle volume data fetching utility | `e85bc10` | `src/lib/muscle-volume-utils.ts` |
| 2 | Build MuscleVolumeChart component with Recharts | `551e2cd` | `src/components/muscle-volume-chart.tsx` |
| 3 | Integrate muscle chart into /insights page with time window toggle | `69d84e9` | `src/app/insights/page.tsx` |

## Key Decisions

1. **Type assertions for Supabase queries** — Used `as { id: string }[]` and similar assertions on select results to satisfy TypeScript, matching the existing pattern in `calendar-utils.ts`. The Supabase generated types don't fully cover partial selects.
2. **Tooltip formatter type handling** — Recharts v5+ uses `unknown` for formatter parameters. Used type guards (`typeof value === "number"`) instead of direct casting for safer handling.
3. **Loading skeleton with randomized widths** — Used `Math.random()` for skeleton bar widths to give visual variety during loading, rather than uniform fixed widths.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Supabase type assertions needed for TypeScript**
- **Found during:** Task 1
- **Issue:** Supabase `.select()` returns generic types that don't match the specific columns selected, causing TypeScript errors on property access (e.g., `set.workout_exercise_id` typed as `unknown`)
- **Fix:** Added type assertions matching the existing `calendar-utils.ts` pattern: `(data as { column: type }[]).map(...)`
- **Files modified:** `src/lib/muscle-volume-utils.ts`
- **Commit:** `e85bc10`

**2. [Rule 3 - Blocking] Recharts Tooltip formatter type mismatch**
- **Found during:** Task 2
- **Issue:** Recharts Tooltip `formatter` prop expects `Formatter<ValueType, NameType>` where parameters can be `undefined`, but plan specified `(value: number, name: string)`
- **Fix:** Changed to `(value: unknown, name: unknown)` with type guards for safe conversion
- **Files modified:** `src/components/muscle-volume-chart.tsx`
- **Commit:** `551e2cd`

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information_disclosure | src/lib/muscle-volume-utils.ts | `fetchMuscleVolume` uses existing authenticated Supabase client; RLS policies restrict to user's own data (mitigated per T-06-04) |
| threat_flag: xss | src/components/muscle-volume-chart.tsx | Recharts sanitizes SVG output; muscle_group values come from seeded exercise catalog (trusted data) (mitigated per T-06-07) |

## Known Stubs

None — all features fully implemented and wired.

## Verification Results

- [x] TypeScript compiles without errors (`npx tsc --noEmit` — zero errors)
- [x] Horizontal bar chart renders with Recharts showing sets per muscle group
- [x] Time window toggle (7d/30d/90d) with 30d default
- [x] Bars sorted by total_sets descending
- [x] Only primary_muscle_group counted (secondary excluded)
- [x] Soft-delete filter applied to all queries (`.is("deleted_at", null)`)
- [x] Chart responsive to container width (ResponsiveContainer)
- [x] Empty and loading states handled
- [x] Calendar section unchanged from Plan 1
- [x] No external dependencies added (Recharts already in project)

## Self-Check: PASSED

- [x] `src/lib/muscle-volume-utils.ts` — EXISTS
- [x] `src/components/muscle-volume-chart.tsx` — EXISTS
- [x] `src/app/insights/page.tsx` — MODIFIED
- [x] `.planning/phases/06-calendar-visualization/06-02-SUMMARY.md` — EXISTS
- [x] Commit `e85bc10` — EXISTS
- [x] Commit `551e2cd` — EXISTS
- [x] Commit `69d84e9` — EXISTS
- [x] Commit `3cfde36` — EXISTS
