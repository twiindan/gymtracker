# Phase Discussion: v2.0 Phase 1 — Calendar & Visualization

## Goal

Users can visualize their workout consistency over time and understand which muscle groups they're training.

## Requirements

- **CAL-01**: Calendar heatmap view of workout days (GitHub-style contribution graph)
- **CAL-02**: Muscle group volume tracking — see which muscles are getting attention over time

## Source

Deferred from v1.0:
- Calendar heatmap: Phase 3 planning (workout history)
- Muscle group volume tracking: Phase 5 planning (progress tracking)

## Depends On

- v1.0 Phase 5 (Progress Tracking & Insights) — COMPLETE
- All workout data in `workouts` and `sets` tables
- Exercise muscle group data in `exercises` table

## Context from v1.0

### Database Schema (relevant tables)

**workouts:**
- `id` (uuid, PK)
- `name` (text)
- `date` (date) — workout date
- `completed_at` (timestamptz) — when workout was finished
- `deleted_at` (timestamptz) — soft delete

**sets:**
- `id` (uuid, PK)
- `workout_id` (uuid, FK)
- `exercise_id` (uuid, FK)
- `reps` (integer)
- `weight` (numeric)

**exercises:**
- `id` (uuid, PK)
- `name` (text)
- `muscle_group` (text) — primary muscle group
- `secondary_muscles` (text[]) — secondary muscle groups

### Decisions from v1.0

- Workouts have a `date` field (date type, not timestamp)
- Soft delete with `deleted_at` — queries must filter `IS NULL`
- Exercises have single `muscle_group` + array `secondary_muscles`
- Weight stored in kg as DECIMAL
- All data client-fetched via Supabase

## Open Questions

### Calendar Heatmap (CAL-01)

1. **Time range**: Show last 365 days? Last 12 months? Configurable?
2. **Color scale**: How many intensity levels? Based on workout count per day, or total volume?
3. **Interaction**: Click a day to see workout details? Tooltip on hover?
4. **Empty state**: What shows when user has no workouts yet?
5. **Mobile layout**: Horizontal scroll or vertical stack for small screens?

### Muscle Group Volume (CAL-02)

1. **Volume metric**: Total sets per muscle? Total weight × reps? Something else?
2. **Time window**: Weekly? Monthly? Toggleable?
3. **Visualization type**: Bar chart? Pie chart? Heat map on body diagram?
4. **Secondary muscles**: Count toward volume for those muscle groups too, or only primary?
5. **Muscle group list**: Use existing muscle_group enum, or expand categories?

## Technical Considerations

- All queries must exclude soft-deleted workouts (`deleted_at IS NULL`)
- Calendar data can be fetched as date + count aggregation
- Muscle volume requires joining sets → exercises, grouping by muscle_group
- Consider caching aggregated data if queries become slow
- Recharts already available for charts

## Success Criteria

1. User can see a visual calendar showing which days they worked out
2. User can see which muscle groups they've trained over a time period
3. Both features work on mobile and desktop
4. Data updates automatically as new workouts are logged

## Deferred Items

- Muscle heat map body diagram (too complex for this phase, defer to v2.x)
- Weekly/monthly trend charts (may overlap with existing progress charts)

## Proposed Plans

1. **Plan 1**: Calendar heatmap component + database query + page integration
2. **Plan 2**: Muscle group volume tracking + visualization + dashboard integration

