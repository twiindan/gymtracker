# Phase 07: Advanced Tracking - Context

**Gathered:** 2026-04-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Add RPE (Rate of Perceived Exertion) tracking per set during workout logging, and provide auto-progression suggestions when starting workouts for exercises with history. This phase enhances the logging experience and provides intelligent guidance — it does not change how workouts are saved, edited, or displayed in history beyond showing RPE values.

</domain>

<decisions>
## Implementation Decisions

### RPE Scale
- **D-61:** Use standard 1-10 Borg scale. Industry standard, granular enough for tracking fine-grained effort changes over time. Most strength training apps use this scale.

### RPE Storage
- **D-62:** Add nullable `rpe` column (integer, 1-10) to the `sets` table. Existing rows stay NULL — fully backward compatible. No separate table needed for a single integer.

### RPE UI Placement
- **D-63:** RPE input appears inline in the `SetInput` row, next to weight and reps. Keeps everything visible at once for fastest logging. The row will be tight on mobile but acceptable — existing pattern already has weight + reps + duplicate + delete.

### RPE Optionality
- **D-64:** RPE is always optional. Nullable field, users can skip it. Lowest friction, works for everyone. Existing workouts without RPE continue to work without any changes.

### RPE in History
- **D-65:** RPE values are displayed in workout history detail view alongside weight and reps. Shows as a small badge/pill next to each set.

### Progression Logic
- **D-66:** Linear progression: +2.5kg for upper body exercises, +1.25kg for lower body exercises, or +1 rep if weight can't increase. Simple, predictable, matches how lifters actually progress.

### Progression Trigger
- **D-67:** Show progression suggestions when starting a workout (on the active workout page) for exercises that have previous session history. Contextual — appears right when the user is about to log.

### Progression Scope
- **D-68:** Only show suggestions for exercises where the user hit a PR or plateaued (same weight/reps for 2+ consecutive sessions). Targeted, less noise than suggesting for all exercises.

### Progression Override
- **D-69:** User can accept the suggestion as-is, reject it, or modify the weight/reps before logging. Suggestions are starting points, not mandates.

### the agent's Discretion
- Exact RPE input UI design (dropdown vs number input vs segmented buttons)
- Progression suggestion card layout and styling
- How plateau is detected (exact session count threshold)
- Whether to show RPE on the exercise progress chart page

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Requirements
- `.planning/REQUIREMENTS.md` — ADV-01 (RPE tracking)
- `.planning/ROADMAP.md` §Phase 2: Advanced Tracking — Phase goal, success criteria

### Upstream Phase Decisions
- `.planning/phases/02-core-workout-logging/02-CONTEXT.md` — Active workout state, SetInput component, localStorage auto-save, one-tap duplicate
- `.planning/phases/05-progress-tracking-insights/05-CONTEXT.md` — PR calculation on-demand, Epley formula, Recharts

### Existing Code
- `src/components/set-input.tsx` — SetInput component (needs RPE field added)
- `src/app/workouts/active/page.tsx` — Active workout logger (needs progression suggestions)
- `src/db/schema.ts` — ActiveSet type (needs rpe field)
- `src/lib/pr-utils.ts` — PR calculation utilities (may inform progression logic)

No external specs — requirements are fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/set-input.tsx` — SetInput component with weight/reps/duration/distance inputs. Add RPE input inline.
- `src/app/workouts/active/page.tsx` — Active workout logger page. Add progression suggestion panel above exercises.
- `src/db/schema.ts` — ActiveSet type (id, set_number, weight, reps, completed). Add rpe?: number | null.
- `src/lib/pr-utils.ts` — PR calculation utilities. Can be extended for progression logic.
- `src/components/exercise-card.tsx` — Reusable for displaying exercise info in progression suggestions.

### Established Patterns
- Client components with local state (useState/useReducer)
- Supabase queries via createBrowserClient
- Tailwind CSS for styling
- Mobile-first responsive design
- localStorage auto-save for crash recovery
- Type assertions for Supabase select results

### Integration Points
- `SetInput` needs new `onRpeChange` callback or extended `onUpdate` to handle RPE
- `ActiveSet` type needs `rpe` field added
- Database migration needed for `rpe` column on `sets` table
- Active workout page needs to fetch previous session data for progression suggestions
- Workout history detail page needs to display RPE values

</code_context>

<specifics>
## Specific Ideas

- RPE should feel like a natural part of logging — not a separate step or afterthought
- Progression suggestions should appear contextually when you're about to log, not buried in settings
- "Same weight for 2+ sessions" = plateau trigger for progression suggestion
- Linear progression matches how lifters actually think: "add a plate" or "do one more rep"

</specifics>

<deferred>
## Deferred Ideas

- RPE-based volume calculations (RPE × weight × reps) — future enhancement
- Periodization templates (auto-suggest deload weeks) — future phase
- Fatigue tracking across sessions — future phase
- RPE filtering on workout history — nice-to-have
- RPE trends on progress charts — nice-to-have

</deferred>

---

*Phase: 07-advanced-tracking*
*Context gathered: 2026-04-28*
