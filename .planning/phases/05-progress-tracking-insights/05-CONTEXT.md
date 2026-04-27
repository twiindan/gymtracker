# Phase 5: Progress Tracking & Insights - Context

**Gathered:** 2026-04-26
**Status:** Ready for execution

<domain>
## Phase Boundary

Enable users to see their strength progress and personal records over time. This is the payoff phase — all the logging from Phases 2-4 now produces visible insights. Deliver PR tracking per metric, progress charts per exercise, and dashboard highlights.

</domain>

<decisions>
## Implementation Decisions

### PR Calculation
- **D-49:** PRs are calculated ON-DEMAND from the `sets` table. No separate PR table. Query all sets for an exercise, compute maxima.
- **D-50:** 1RM estimation uses the Epley formula: `weight * (1 + reps / 30)`. Simple and widely used.
- **D-51:** Four PR metrics tracked: max_weight, max_reps, max_volume (weight × reps), estimated_1rm.
- **D-52:** PR records include date and workout context so users know WHEN the PR was set.

### Charts
- **D-53:** Use `recharts` library — declarative, React-native, lightweight enough for single-user data.
- **D-54:** Charts show multiple metrics simultaneously (weight, 1RM, volume) with toggleable lines.
- **D-55:** If fewer than 2 data points, show encouraging message instead of empty chart.

### Dashboard
- **D-56:** Dashboard shows: workout count, routine count, exercise count, monthly volume, recent PRs, workout streak.
- **D-57:** Recent PRs = PRs set in the last 30 days that exceed all previous values.

### UX
- **D-58:** Exercise cards in catalog link to `/exercises/{id}` progress page.
- **D-59:** Progress page is the canonical destination for exercise insights.
- **D-60:** All PR values clearly labeled with metric name and units.

### the agent's Discretion
- Exact chart colors and styling
- Dashboard layout and card ordering
- Date formatting on charts
- Whether to show PR badges on exercise cards in catalog

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` §History & Progress — HIST-02 (PRs), HIST-03 (charts)
- `.planning/ROADMAP.md` §Phase 5 — Phase goal, success criteria, dependencies

### Research
- `.planning/research/PITFALLS.md` §Pitfall 2 — Ambiguous PR definition
- `.planning/research/PITFALLS.md` §Pitfall 4 — Misleading progress charts
- `.planning/research/ARCHITECTURE.md` §Progress Visualization Flow

### Upstream Phase
- `.planning/phases/04-routines-workout-templates/04-PLAN.md` — Routines, copy workout
- `src/db/schema.ts` — Set, Workout, WorkoutExercise, Exercise types
- `src/db/client.ts` — Supabase client
- `src/app/page.tsx` — Existing dashboard
- `src/app/exercises/page.tsx` — Exercise catalog
- `src/components/exercise-card.tsx` — Exercise card component

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/page.tsx` — Home dashboard to enhance
- `src/app/exercises/page.tsx` — Exercise catalog
- `src/components/exercise-card.tsx` — Exercise display cards
- `src/db/schema.ts` — All entity types including Set with weight/reps
- `src/db/client.ts` — Supabase client

### Established Patterns
- Client components with local state
- Supabase queries with type assertions
- Tailwind CSS styling
- Mobile-first responsive design
- Badge/pill styling from exercise-card

### Integration Points
- Exercise cards need to link to /exercises/{id}
- Dashboard needs to query sets for PR calculation
- Progress page needs joins across workouts, workout_exercises, sets

</code_context>

<specifics>
## Specific Ideas

- "Estimated 1RM" badge with formula label: "Epley formula"
- "Log more workouts to see progress" — friendly empty state for charts
- Monthly volume counter: "12,450 kg this month"
- Workout streak: "3 weeks consistent"
- Recent PRs feed on dashboard: "New max weight on Bench Press: 120 kg"
- Chart toggle buttons to show/hide lines

</specifics>

<deferred>
## Deferred Ideas

- Muscle group volume tracking (v2, CAL-02)
- Muscle heat map (v2)
- RPE tracking (v2, ADV-01)
- Moving average / trend lines on charts (v2 enhancement)
- Data export (v2, CONV-04)
- Periodization analytics (v2)

</deferred>

---

*Phase: 05-progress-tracking-insights*
*Context gathered: 2026-04-26*
