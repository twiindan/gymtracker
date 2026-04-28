---
phase: 06
phase_name: Calendar & Visualization
plan: 01
subsystem: visualization
tags: [calendar, heatmap, svg, insights, visualization]
dependency_graph:
  requires: []
  provides: [CAL-01]
  affects: [header-navigation]
tech_stack:
  added: [native Date API, custom SVG]
  patterns: [client-component, single-query-aggregation, css-variables]
key_files:
  created:
    - src/lib/calendar-utils.ts
    - src/components/calendar-heatmap.tsx
    - src/app/insights/page.tsx
  modified:
    - src/components/header.tsx
decisions:
  - D-06-01: Used native Date API instead of date-fns (plan requirement, no external deps)
  - D-06-02: Custom SVG instead of react-calendar-heatmap (plan requirement, CSS import issues with Next.js)
  - D-06-03: Type assertion `{ started_at: string }[]` for Supabase select result to satisfy TypeScript
metrics:
  duration_minutes: 8
  completed_date: "2026-04-28"
---

# Phase 06 Plan 01: Calendar Heatmap Summary

**One-liner:** GitHub-style SVG calendar heatmap showing 365 days of workout activity on a new /insights page, with 4-level color intensity, hover tooltips, and soft-delete filtering.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create calendar utility functions | `40a12da` | `src/lib/calendar-utils.ts` |
| 2 | Build custom SVG CalendarHeatmap component | `3893c9d` | `src/components/calendar-heatmap.tsx` |
| 3 | Create /insights page with calendar integration | `76149b6` | `src/app/insights/page.tsx`, `src/components/header.tsx` |

## Key Decisions

1. **Native Date API only** — No date-fns or other external date libraries, per plan requirement. Uses `toISOString().slice(0, 10)` for consistent YYYY-MM-DD keys to avoid timezone off-by-one.
2. **Custom SVG** — No react-calendar-heatmap or @uiw/react-heat-map due to CSS import issues with Next.js. Built from scratch with 12px cells, 3px gaps, 2px border radius.
3. **Type assertion for Supabase** — Used `as { started_at: string }[]` on the select result to satisfy TypeScript narrowing, matching existing codebase patterns.

## Deviations from Plan

None - plan executed exactly as written.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: information_disclosure | src/lib/calendar-utils.ts | `fetchWorkoutCalendarData` uses existing authenticated Supabase client; RLS policies restrict to user's own data (mitigated per T-06-01) |
| threat_flag: xss | src/components/calendar-heatmap.tsx | SVG content is data-driven (dates/numbers only); no user-generated text rendered via dangerouslySetInnerHTML (mitigated per T-06-03) |

## Known Stubs

- `src/app/insights/page.tsx` — Muscle group volume section shows "coming soon" placeholder card. Intentional — Plan 2 (06-02) will implement this feature.

## Verification Results

- [x] TypeScript compiles without errors (`npx tsc --noEmit` — zero errors)
- [x] Calendar heatmap renders 365-day grid aligned to Sunday start
- [x] 4-level color intensity scale (empty/light/medium/dark) based on workout count
- [x] Hover tooltip shows date and workout count
- [x] Single aggregated query (no N+1) with soft-delete filter (`.is("deleted_at", null)`)
- [x] Mobile: horizontal scroll wrapper with touch support
- [x] /insights page accessible from header navigation
- [x] Empty state shows when user has no workouts
- [x] No external date libraries imported

## Self-Check: PASSED

- [x] `src/lib/calendar-utils.ts` — EXISTS
- [x] `src/components/calendar-heatmap.tsx` — EXISTS
- [x] `src/app/insights/page.tsx` — EXISTS
- [x] `src/components/header.tsx` — MODIFIED
- [x] Commit `40a12da` — EXISTS
- [x] Commit `3893c9d` — EXISTS
- [x] Commit `76149b6` — EXISTS
