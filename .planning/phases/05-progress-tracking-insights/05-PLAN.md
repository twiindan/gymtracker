---
phase: 5
phase_name: Progress Tracking & Insights
depends_on: [03-workout-history-editing]
files_modified:
  - src/app/exercises/[id]/page.tsx
  - src/app/dashboard/page.tsx
  - src/components/pr-badges.tsx
  - src/components/progress-chart.tsx
  - src/components/exercise-stats.tsx
  - src/lib/pr-calculator.ts
requirements_addressed: [HIST-02, HIST-03]
autonomous: true
---

# Phase 5: Progress Tracking & Insights

## Objective

Enable users to see their strength progress and personal records over time. This is the culmination of v1 — users have been logging workouts through Phases 1-4, and now they get to see the payoff. Charts and PRs are the #1 retention driver for workout trackers. This phase addresses Pitfall 2 (ambiguous PR definition) and Pitfall 4 (misleading charts).

## Must Haves

1. Personal records per exercise: max weight, max reps at weight, highest volume set, estimated 1RM
2. Progress charts per exercise: weight over time, volume over time, estimated 1RM over time
3. Exercise detail page with full history and stats
4. Dashboard with recent PRs and workout activity summary
5. Clear labeling of which metric each PR represents
6. Multiple metrics on charts to prevent misleading interpretations

## Plans

### Plan 01: PR Calculation System

**Objective:** Build the PR calculation logic and display.

**Tasks:**

```xml
<task>
  <id>01-pr-calculator</id>
  <title>Create PR calculation utilities</title>
  <read_first>
    - .planning/research/PITFALLS.md §Pitfall 2 (ambiguous PR definition)
    - src/db/schema.ts (Set type)
  </read_first>
  <action>
    Create `src/lib/pr-calculator.ts`:

    1. Types:
       - `interface ExercisePRs { max_weight: PRRecord | null; max_reps: PRRecord | null; max_volume: PRRecord | null; estimated_1rm: PRRecord | null; }`
       - `interface PRRecord { value: number; date: string; workout_id: string; reps?: number; weight?: number; }`

    2. Functions:
       - `calculate1RM(weight: number, reps: number): number` — Epley formula: weight * (1 + reps/30)
       - `calculateExercisePRs(sets: { weight: number | null; reps: number | null; date: string; workout_id: string }[]): ExercisePRs`
       - For each set with weight and reps:
         - max_weight: highest weight ever lifted
         - max_reps: most reps ever performed (at any weight)
         - max_volume: highest weight * reps for a single set
         - estimated_1rm: highest Epley 1RM estimate
       - Returns the RECORD (with date and context) not just the value

    3. Display helper:
       - `formatPRValue(pr: PRRecord, type: 'weight' | 'reps' | 'volume' | '1rm'): string`
  </action>
  <acceptance_criteria>
    - src/lib/pr-calculator.ts exports calculate1RM and calculateExercisePRs
    - Epley formula is used for 1RM estimation
    - PRs include date and workout context
    - All four metrics are calculated
  </acceptance_criteria>
</task>

<task>
  <id>02-pr-display</id>
  <title>Create PR badges component</title>
  <read_first>
    - src/lib/pr-calculator.ts
    - src/components/exercise-card.tsx (badge styling patterns)
  </read_first>
  <action>
    Create `src/components/pr-badges.tsx`:
    - Props: `prs: ExercisePRs`
    - Shows 4 cards/badges in a row:
      - Max Weight: "120 kg" with "8 reps" subtitle and date
      - Max Reps: "15 reps" with "80 kg" subtitle and date
      - Max Volume: "960 kg" (120×8) with date
      - Est. 1RM: "150 kg" with date
    - Each badge shows the metric name prominently
    - Date shown in small text: "Apr 26, 2026"
    - If no PR for a metric, shows "—" with "Log more sets" hint
  </action>
  <acceptance_criteria>
    - Component shows all 4 PR metrics
    - Each badge shows value, context (reps/weight), and date
    - Empty state handles gracefully
    - Responsive layout (2x2 grid on mobile, row on desktop)
  </acceptance_criteria>
</task>
```

### Plan 02: Exercise Progress Page

**Objective:** Build a dedicated page for each exercise showing full history and progress charts.

**Tasks:**

```xml
<task>
  <id>03-exercise-progress-page</id>
  <title>Create exercise detail page with history and charts</title>
  <read_first>
    - src/app/exercises/page.tsx
    - src/lib/pr-calculator.ts
    - .planning/research/PITFALLS.md §Pitfall 4 (misleading charts)
  </read_first>
  <action>
    Create `src/app/exercises/[id]/page.tsx`:

    1. Fetch exercise data from Supabase
    2. Fetch all workout history for this exercise:
       - Query: join workouts → workout_exercises → sets
       - Filter by exercise_id on workout_exercises
       - Order by workout.started_at DESC

    3. Display:
       - Exercise header: name, muscle group, equipment
       - PR badges (from pr-badges component)
       - Progress chart showing multiple metrics over time
       - History table: list of all workouts containing this exercise, with best set per workout

    4. Chart requirements:
       - Line chart with date on X-axis
       - Multiple lines: max weight per workout, estimated 1RM per workout, total volume per workout
       - Tooltip showing exact values on hover
       - Responsive sizing

    5. Install recharts: `npm install recharts`
  </action>
  <acceptance_criteria>
    - Page fetches and displays exercise info
    - Shows PR badges for the exercise
    - Shows line chart with at least 2 metrics
    - Shows history of workouts containing this exercise
    - Chart is responsive
  </acceptance_criteria>
</task>
```

### Plan 03: Progress Charts

**Objective:** Build reusable chart components.

**Tasks:**

```xml
<task>
  <id>04-progress-chart</id>
  <title>Create reusable progress chart component</title>
  <read_first>
    - src/lib/pr-calculator.ts
    - recharts documentation
  </read_first>
  <action>
    Create `src/components/progress-chart.tsx`:
    - Props: `data: { date: string; weight: number | null; volume: number | null; estimated_1rm: number | null }[]`
    - Uses Recharts LineChart
    - Shows 3 lines:
      - Weight (kg) — solid line
      - Estimated 1RM (kg) — dashed line
      - Volume (kg) — lighter line
    - Each line can be toggled on/off
    - X-axis: dates (formatted)
    - Y-axis: weight values
    - Tooltip with all values for that date
    - Legend
    - ResponsiveContainer for mobile
    - If fewer than 2 data points, show "Log more workouts to see progress" message
  </action>
  <acceptance_criteria>
    - Component renders LineChart with recharts
    - 3 toggleable lines (weight, 1RM, volume)
    - Tooltip shows values on hover
    - Responsive to container width
    - Empty state for < 2 data points
  </acceptance_criteria>
</task>
```

### Plan 04: Dashboard with PR Highlights

**Objective:** Enhance the home dashboard with PR highlights and activity stats.

**Tasks:**

```xml
<task>
  <id>05-dashboard-insights</id>
  <title>Add PR highlights and stats to dashboard</title>
  <read_first>
    - src/app/page.tsx (existing dashboard)
    - src/lib/pr-calculator.ts
  </read_first>
  <action>
    Update `src/app/page.tsx`:

    1. Add "Recent PRs" section:
       - Query all sets from last 30 days
       - Compare against historical PRs
       - Show exercises where a new PR was set recently
       - Display: exercise name, PR type (Max Weight, etc.), value, date

    2. Add workout streak (simple consecutive-week counter):
       - Count weeks in last 30 days with at least 1 workout

    3. Add total volume this month:
       - Sum of all set volumes in current month

    4. Keep existing: Start Workout CTA, routines, recent workouts

    5. Reorder sections: Start CTA → Stats row → Routines → Recent PRs → Recent Workouts
  </action>
  <acceptance_criteria>
    - Dashboard shows total workouts, routines, exercises counts
    - Shows total volume this month
    - Shows recent PRs (last 30 days)
    - Shows workout streak
    - All data fetched from Supabase
  </acceptance_criteria>
</task>
```

### Plan 05: Exercise Catalog Links

**Objective:** Link exercise cards to their progress pages.

**Tasks:**

```xml
<task>
  <id>06-exercise-links</id>
  <title>Link exercise cards to progress pages</title>
  <read_first>
    - src/components/exercise-card.tsx
    - src/app/exercises/page.tsx
  </read_first>
  <action>
    1. Update `src/components/exercise-card.tsx`:
       - Make cards clickable (wrap in Link or add onClick)
       - Link to `/exercises/{id}`
       - Add subtle "View progress →" indicator

    2. Update `src/app/exercises/page.tsx`:
       - Wrap ExerciseCard in Link to `/exercises/{id}`

    3. Add back navigation on exercise detail page
  </action>
  <acceptance_criteria>
    - Exercise cards link to /exercises/{id}
    - Exercise detail page has back link to catalog
    - Clickable on both search results and grouped list
  </acceptance_criteria>
</task>
```

## Verification

After all plans execute, the following must be true:

1. **PRs:** User can see max weight, max reps, max volume, and estimated 1RM per exercise
2. **Charts:** User can view a line chart showing weight/1RM/volume over time for any exercise
3. **History:** User can see all workouts containing a specific exercise
4. **Dashboard:** Home page shows recent PRs, monthly volume, and workout streak
5. **Navigation:** Exercise cards link to progress pages
6. **Pitfall prevention:**
   - Pitfall 2: PRs are tracked per metric (not just max weight)
   - Pitfall 4: Charts show multiple metrics (not just volume)
7. **TypeScript:** `npm run build` succeeds with zero errors

## Threat Model

<threat_model>
## Security Assessment — Phase 5

**Threat surface:** Chart data queries, PR calculations

| Threat | Severity | Mitigation |
|--------|----------|------------|
| XSS via chart tooltips | LOW | React auto-escapes; recharts handles SVG safely |
| Performance on large datasets | LOW | Single-user app; even years of data is < 100KB |
| Incorrect 1RM formula | LOW | Document Epley formula; user-facing label shows "Estimated" |

**No HIGH severity threats identified for Phase 5.**
</threat_model>
