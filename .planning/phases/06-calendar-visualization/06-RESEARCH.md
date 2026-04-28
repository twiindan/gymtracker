# Phase 6: Calendar & Visualization - Research

**Researched:** 2026-04-28
**Domain:** Calendar heatmap visualization, muscle group volume tracking, Recharts bar charts
**Confidence:** HIGH

## Summary

This phase adds two visualization features to the existing GymTracker app: (1) a GitHub-style calendar heatmap showing workout consistency over time, and (2) a muscle group volume chart showing which muscles are being trained. The app already uses Recharts v3.8.1 for progress charts, Tailwind CSS v4 for styling, and client-side Supabase queries for all data fetching.

**Primary recommendation:** Build a custom SVG calendar heatmap component (no external library needed — the SVG pattern is simple and matches the app's existing inline-SVG icon approach). Use Recharts `BarChart` for muscle group volume visualization. Both features go on a new `/insights` page with the calendar at top and muscle chart below.

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Workouts have a `date` field (date type, not timestamp) — actually `started_at` (timestamptz) based on schema
- Soft delete with `deleted_at` — queries must filter `IS NULL`
- Exercises have single `muscle_group` + array `secondary_muscles` — actually `primary_muscle_group` (text) + `secondary_muscle_groups` (text[]) based on schema
- Weight stored in kg as DECIMAL
- All data client-fetched via Supabase
- Recharts already available for charts

### the agent's Discretion
- Calendar heatmap library choice (build custom vs. use library)
- Color scale intensity levels
- Time range for calendar
- Volume metric for muscle groups
- Visualization type for muscle groups
- Secondary muscle counting approach

### Deferred Ideas (OUT OF SCOPE)
- Muscle heat map body diagram (too complex for this phase, defer to v2.x)
- Weekly/monthly trend charts (may overlap with existing progress charts)

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Calendar heatmap rendering | Browser / Client | — | Pure SVG visualization, no server needed |
| Calendar data aggregation | Browser / Client | Database / Storage | Supabase query returns date+count; client builds heatmap |
| Muscle volume chart rendering | Browser / Client | — | Recharts BarChart, client-side only |
| Muscle volume data aggregation | Browser / Client | Database / Storage | Join sets→workout_exercises→exercises, group by muscle_group |
| Insights page routing | Frontend Server (SSR) | — | New Next.js app route at `/insights` |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Recharts | 3.8.1 (installed) | Muscle group bar chart | Already in project, used by `ProgressChart` component |
| Custom SVG component | — | Calendar heatmap | No external dependency needed; SVG grid is ~100 lines; matches app's inline-SVG icon pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `date-fns` | Not installed | Date formatting/utilities | Only if date math becomes complex; currently `new Date()` suffices |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom SVG heatmap | `react-calendar-heatmap` v1.10.0 | Requires CSS import (`styles.css`) — breaks Next.js without CSS loader workaround; last meaningful update was years ago; 1.3k stars but stagnant |
| Custom SVG heatmap | `@uiw/react-heat-map` v2.3.3 | Uses CSS variables + inline styles (better for Next.js), but has known issue #69 with Next.js global CSS; requires `next-remove-imports` workaround per their README; adds 264-star dependency for a simple SVG grid |
| Recharts BarChart | Custom SVG bars | Recharts already installed and proven; custom bars would duplicate effort |

**Installation:** No new packages needed. Recharts is already installed. The calendar heatmap will be a custom SVG component (~100-150 lines), consistent with the app's existing pattern of inline SVG icons.

**Version verification:**
```bash
npm view recharts version  # → 3.8.1 (confirmed installed)
```

## Architecture Patterns

### System Architecture Diagram

```
/insights page (client component)
├── fetchWorkoutDates() ──→ Supabase: SELECT date(workouts.started_at), COUNT(*) GROUP BY date
│   └── Returns: [{ date: "2026-04-28", count: 1 }, ...]
│
├── <CalendarHeatmap> ──→ SVG grid (52 weeks × 7 days)
│   ├── Each cell: color based on count (0 = empty, 1-2 = light, 3-4 = medium, 5+ = dark)
│   ├── Tooltip on hover: "Apr 28: 1 workout"
│   └── Click cell → navigate to /workouts?date=2026-04-28 (future enhancement)
│
├── fetchMuscleVolume() ──→ Supabase: JOIN sets → workout_exercises → exercises
│   └── Returns: [{ muscle_group: "Chest", sets: 24, volume: 4800 }, ...]
│
└── <MuscleVolumeChart> ──→ Recharts BarChart
    ├── X-axis: muscle group names
    ├── Y-axis: total sets (or total volume kg)
    └── Color: primary color scale
```

### Recommended Project Structure
```
src/
├── components/
│   ├── calendar-heatmap.tsx    # New: SVG calendar heatmap component
│   └── muscle-volume-chart.tsx # New: Recharts bar chart for muscle groups
├── lib/
│   └── calendar-utils.ts       # New: date range generation, color scale helpers
└── app/
    └── insights/
        └── page.tsx            # New: /insights route with both visualizations
```

### Pattern 1: Custom SVG Calendar Heatmap
**What:** A GitHub-style contribution graph built with SVG `<rect>` elements, 7 rows (days) × ~52 columns (weeks).
**When to use:** Always for this phase — no library needed for this simple grid pattern.
**Example:**
```typescript
// Source: Pattern derived from GitHub contribution graph + existing app SVG conventions
// Each day cell is an SVG <rect> with fill color based on workout count
const cellSize = 12;
const cellGap = 3;

// Color scale using CSS variables from globals.css
const getColor = (count: number): string => {
  if (count === 0) return "var(--border)";
  if (count === 1) return "var(--primary-light)";
  if (count <= 3) return "var(--primary)";
  return "var(--primary-dark)";
};

// SVG structure: weeks as columns, days as rows
<svg width={totalWidth} height={totalHeight}>
  {weeks.map((week, wi) =>
    week.map((day, di) => (
      <rect
        key={`${wi}-${di}`}
        x={wi * (cellSize + cellGap)}
        y={di * (cellSize + cellGap)}
        width={cellSize}
        height={cellSize}
        rx={2}
        fill={getColor(day.count)}
        title={`${day.date}: ${day.count} workout(s)`}
      />
    ))
  )}
</svg>
```

### Pattern 2: Recharts BarChart for Muscle Volume
**What:** Reuse the existing `ProgressChart` pattern — `ResponsiveContainer` + `BarChart` + custom colors.
**When to use:** For the muscle group volume visualization (CAL-02).
**Example:**
```typescript
// Source: Based on existing src/components/progress-chart.tsx pattern
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={muscleData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
    <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
    <XAxis dataKey="muscle_group" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
    <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
    <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e4e4e7", borderRadius: "8px" }} />
    <Bar dataKey="total_sets" fill="var(--primary)" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
```

### Anti-Patterns to Avoid
- **N+1 queries for calendar data:** The existing `page.tsx` and `workouts/page.tsx` fetch workouts then loop to fetch exercises/sets per workout. For the calendar, use a single aggregated query (`DATE(started_at), COUNT(*) GROUP BY`) — do NOT replicate the N+1 pattern.
- **Importing CSS from node_modules:** Both `react-calendar-heatmap` and `@uiw/react-heat-map` have CSS import issues with Next.js. Avoid them entirely by building custom SVG.
- **Hardcoding muscle group colors:** Use the existing `MUSCLE_GROUPS` array from `@/db/schema` and derive colors programmatically, not hardcoded per-group.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Muscle group bar chart | Custom SVG bars with axes, tooltips, responsive sizing | Recharts `BarChart` | Already installed; handles responsive container, tooltips, axes, animations |
| Date range generation | Manual day-by-day loops with timezone bugs | Simple `for` loop with `new Date()` + `toISOString().slice(0,10)` for YYYY-MM-DD keys | Date math for a 365-day grid is trivial; no need for date-fns |
| Color scale interpolation | Complex D3-scale-like color interpolation | 4-level discrete scale (empty/light/medium/dark) using CSS variables | GitHub uses 5 levels; 4 is sufficient for workout frequency and matches app's color system |

**Key insight:** The calendar heatmap is the one thing where "don't hand-roll" normally applies, but in this case the SVG grid is simpler than integrating a library with CSS import issues. The muscle chart should definitely use Recharts.

## Common Pitfalls

### Pitfall 1: Timezone Off-by-One in Calendar Dates
**What goes wrong:** `new Date("2026-04-28")` creates a date at midnight UTC, which may be April 27 in local time zones west of UTC. This causes calendar cells to show on the wrong day.
**Why it happens:** JavaScript `Date` objects are timezone-aware; Supabase stores `timestamptz`.
**How to avoid:** Use `date(started_at)` in the Supabase query to get the date in the database timezone, then use string comparison (`YYYY-MM-DD` format) for matching. When generating the calendar grid, use `toISOString().slice(0, 10)` for consistent YYYY-MM-DD keys.
**Warning signs:** Calendar shows workouts on the day before/after the actual workout day.

### Pitfall 2: Soft-Deleted Workouts Appearing in Calendar
**What goes wrong:** Calendar counts include workouts where `deleted_at IS NOT NULL`.
**Why it happens:** Easy to forget the `.is("deleted_at", null)` filter in aggregation queries.
**How to avoid:** Every Supabase query for calendar or muscle data MUST include `.is("deleted_at", null)`. Add a comment next to each query: `// Always filter soft-deleted workouts`.
**Warning signs:** Calendar shows more workout days than the workouts list.

### Pitfall 3: N+1 Query Pattern for Calendar Data
**What goes wrong:** Fetching all workouts, then for each workout fetching exercises and sets to count — exactly the pattern in `page.tsx` lines 50-76.
**Why it happens:** The existing codebase uses this pattern; it's easy to copy.
**How to avoid:** Use a single aggregated query:
```typescript
const { data } = await supabase
  .from("workouts")
  .select("started_at")
  .is("deleted_at", null)
  .gte("started_at", startDate.toISOString());
// Then aggregate client-side: group by date string, count per day
```
**Warning signs:** Calendar takes 5+ seconds to load; network tab shows dozens of Supabase requests.

### Pitfall 4: Muscle Volume Double-Counting Secondary Muscles
**What goes wrong:** Counting both `primary_muscle_group` and `secondary_muscle_groups` for each set inflates volume numbers.
**Why it happens:** The schema has both fields; it's unclear whether secondary muscles should contribute to volume.
**How to avoid:** For this phase, count ONLY `primary_muscle_group` toward volume. Secondary muscles are deferred to a future enhancement. Document this decision clearly.

## Code Examples

### Calendar Heatmap Data Query
```typescript
// Single query — no N+1
async function fetchWorkoutCalendarData(days: number = 365) {
  const supabase = createBrowserClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("workouts")
    .select("started_at")
    .is("deleted_at", null)
    .gte("started_at", startDate.toISOString());

  if (error) throw error;

  // Aggregate by date string (YYYY-MM-DD)
  const dateCounts = new Map<string, number>();
  (data ?? []).forEach((w) => {
    const dateStr = new Date(w.started_at).toISOString().slice(0, 10);
    dateCounts.set(dateStr, (dateCounts.get(dateStr) ?? 0) + 1);
  });

  return dateCounts; // Map<"2026-04-28", 1>
}
```

### Muscle Volume Data Query
```typescript
async function fetchMuscleVolume(days: number = 30) {
  const supabase = createBrowserClient();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all sets from non-deleted workouts in the time window
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id")
    .is("deleted_at", null)
    .gte("started_at", startDate.toISOString());

  if (!workouts?.length) return [];

  const workoutIds = workouts.map((w) => w.id);

  // Get workout exercises with muscle group info
  const { data: weData } = await supabase
    .from("workout_exercises")
    .select("id, exercise_id, primary_muscle_group")
    .in("workout_id", workoutIds);

  if (!weData?.length) return [];

  const weIds = weData.map((we) => we.id);
  const weMap = new Map(weData.map((we) => [we.id, we.primary_muscle_group]));

  // Get sets and aggregate by muscle group
  const { data: sets } = await supabase
    .from("sets")
    .select("workout_exercise_id, reps, weight")
    .in("workout_exercise_id", weIds);

  const muscleVolume = new Map<string, { sets: number; volume: number }>();
  (sets ?? []).forEach((set) => {
    const muscle = weMap.get(set.workout_exercise_id);
    if (!muscle) return;
    const entry = muscleVolume.get(muscle) ?? { sets: 0, volume: 0 };
    entry.sets += 1;
    if (set.reps && set.weight) entry.volume += set.reps * set.weight;
    muscleVolume.set(muscle, entry);
  });

  return Array.from(muscleVolume.entries())
    .map(([muscle_group, data]) => ({ muscle_group, ...data }))
    .sort((a, b) => b.volume - a.volume);
}
```

### Calendar Grid Generation
```typescript
function generateCalendarGrid(days: number = 365) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Align start to previous Sunday for clean week columns
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: { date: string; dayOfWeek: number }[][] = [];
  let currentWeek: { date: string; dayOfWeek: number }[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    currentWeek.push({
      date: current.toISOString().slice(0, 10),
      dayOfWeek: current.getDay(),
    });
    if (current.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }
  if (currentWeek.length > 0) weeks.push(currentWeek);

  return { weeks, startDate: new Date(startDate), endDate };
}
```

## Open Questions (Resolved from CONTEXT.md)

### Calendar Heatmap (CAL-01)

1. **Time range**: **Last 365 days**, aligned to start on a Sunday for clean week columns. Not configurable in this phase — keep it simple.
2. **Color scale**: **4 levels** — empty (border color), 1 workout (primary-light), 2-3 workouts (primary), 4+ workouts (primary-dark). Based on workout count per day, not volume. This matches the app's existing 3-tier color system (`--primary-light`, `--primary`, `--primary-dark`).
3. **Interaction**: **Tooltip on hover** using native SVG `title` attribute (zero dependencies). Click-to-navigate deferred — the app has no date-filtered workout view yet.
4. **Empty state**: Show the calendar grid with all cells empty + a message "Start logging workouts to see your consistency streak!" below the grid. Reuse the existing `EmptyState` pattern from `page.tsx`.
5. **Mobile layout**: **Horizontal scroll** with `overflow-x-auto`. The 52-week grid is ~780px wide at 12px cells + 3px gaps. Wrap in a scrollable container with `-webkit-overflow-scrolling: touch`. This is the standard approach for GitHub-style calendars on mobile.

### Muscle Group Volume (CAL-02)

1. **Volume metric**: **Total sets** as the primary metric (BarChart Y-axis). Show **total volume (kg)** as a secondary toggle. Sets are more intuitive for most users ("I did 24 chest sets this month") while volume is useful for progressive overload tracking.
2. **Time window**: **Last 30 days** by default, with toggle buttons for 7d / 30d / 90d (reuse the existing filter button pattern from `workouts/page.tsx`).
3. **Visualization type**: **Horizontal bar chart** (Recharts `BarChart` with `layout="horizontal"`). Horizontal bars handle long muscle group names better than vertical bars on mobile. Sort bars by volume descending.
4. **Secondary muscles**: **Primary only** for this phase. Counting secondary muscles would require joining the `exercises` table (not `workout_exercises`) to get `secondary_muscle_groups`, and would double-count sets. Deferred to v2.x.
5. **Muscle group list**: Use the existing `MUSCLE_GROUPS` array from `@/db/schema.ts` (16 groups). Only show groups that have data in the selected time window — don't show zero-value bars.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `react-calendar-heatmap` with CSS import | Custom SVG component with CSS variable colors | 2026 | Eliminates Next.js CSS loader dependency; matches app's inline-SVG pattern |
| N+1 queries for aggregation | Single query + client-side aggregation | Ongoing | Reduces Supabase calls from O(n) to O(1); critical for calendar with 365 days of data |
| Vertical bar charts | Horizontal bar charts for muscle groups | This phase | Better mobile UX for long labels; standard for fitness apps |

**Deprecated/outdated:**
- `react-calendar-heatmap`: Last significant update was years ago; CSS import breaks Next.js without workarounds. The SVG grid it produces is simple enough to replicate in ~100 lines.
- N+1 query pattern in existing code: `page.tsx` and `workouts/page.tsx` both use this. New code should use aggregated queries.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Custom SVG heatmap is simpler than integrating a library with CSS issues | Don't Hand-Roll | If SVG implementation proves complex, may need to revisit library choice |
| A2 | Horizontal bar chart is better than vertical for muscle groups on mobile | Open Questions | Minor UX difference; easily changed during implementation |
| A3 | Primary muscle only counting is sufficient for v2.0 Phase 1 | Open Questions | Users may want secondary muscle tracking; already deferred to v2.x |
| A4 | 365-day calendar with horizontal scroll works on mobile | Open Questions | If scroll is too wide, can reduce cell size or show 180 days instead |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Recharts | Muscle volume bar chart | ✓ | 3.8.1 (installed) | — |
| Supabase | Data queries | ✓ | 2.104.0 (installed) | — |
| Next.js 16 | App routing, CSS handling | ✓ | 16.2.4 (installed) | — |
| Tailwind CSS v4 | Styling | ✓ | 4.x (installed) | — |

**No missing dependencies.** All required libraries are already installed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | None — see Wave 0 |
| Quick run command | `npm test` (not configured) |
| Full suite command | `npm test` (not configured) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CAL-01 | Calendar heatmap renders 365-day grid with correct day alignment | unit | — | ❌ Wave 0 |
| CAL-01 | Calendar cells colored correctly based on workout count | unit | — | ❌ Wave 0 |
| CAL-01 | Calendar excludes soft-deleted workouts | unit | — | ❌ Wave 0 |
| CAL-02 | Muscle volume chart shows correct sets per muscle group | unit | — | ❌ Wave 0 |
| CAL-02 | Muscle volume respects time window filter | unit | — | ❌ Wave 0 |
| CAL-02 | Secondary muscles not counted in volume | unit | — | ❌ Wave 0 |

### Sampling Rate
- **No test infrastructure detected.** All testing will be manual during implementation.
- **Wave 0 Gaps:**
  - [ ] Test framework setup (Jest/Vitest + React Testing Library)
  - [ ] `tests/calendar-heatmap.test.tsx` — covers CAL-01
  - [ ] `tests/muscle-volume-chart.test.tsx` — covers CAL-02
  - [ ] `tests/calendar-utils.test.ts` — date grid generation, color scale

## Security Domain

> `security_enforcement` is not set in config, so it defaults to enabled. However, this phase adds no new authentication, no new API endpoints, no user input handling, and no data mutation — only read-only visualization of existing data.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Input Validation | no | Read-only queries, no user input |
| V6 Cryptography | no | — |

### Known Threat Patterns for this Phase
- **None identified.** This phase is purely client-side data visualization with read-only Supabase queries using the existing authenticated client. No new attack surface introduced.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `src/app/page.tsx`, `src/app/workouts/page.tsx`, `src/components/progress-chart.tsx`, `src/db/schema.ts`, `src/db/types.ts`, `src/app/globals.css`, `package.json`
- `react-calendar-heatmap` v1.10.0 — GitHub README (npm view + webfetch)
- `@uiw/react-heat-map` v2.3.3 — GitHub README (webfetch)
- Recharts 3.8.1 — existing in project, verified via `npm view`

### Secondary (MEDIUM confidence)
- `@uiw/react-heat-map` issue #69 — Next.js CSS import bug (GitHub webfetch)
- Next.js 16.2.4 — package.json version, AGENTS.md warns of breaking changes

### Tertiary (LOW confidence)
- None — all claims verified against codebase or official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified against package.json and npm registry
- Architecture: HIGH — derived from existing codebase patterns
- Pitfalls: HIGH — based on direct codebase inspection (N+1 pattern, timezone handling)
- Calendar library recommendation: HIGH — verified both libraries' Next.js compatibility issues

**Research date:** 2026-04-28
**Valid until:** 2026-05-28 (30 days — stable domain, no fast-moving dependencies)
