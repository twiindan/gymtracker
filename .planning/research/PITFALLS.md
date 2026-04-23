# Domain Pitfalls

**Domain:** Personal gym workout tracking web application
**Researched:** 2025-04-23
**Confidence:** MEDIUM (based on open-source issue analysis, schema migrations, and domain knowledge; limited by restricted access to user forums and commercial app post-mortems)

## Critical Pitfalls

### Pitfall 1: Overly Rigid Exercise Data Model

**What goes wrong:**
The initial database schema makes weight, reps, or muscle group mandatory. Six months in, users want to log bodyweight exercises (no weight), timed holds (no reps), or exercises that target multiple muscle groups. Schema migrations become painful, and historical data gets corrupted or dropped.

**Why it happens:**
Developers model the "happy path" of a barbell bench press (weight + reps + single muscle) and forget that gyms include planks, farmer's carries, sled pushes, and compound movements with multiple target muscles.

**How to avoid:**
- Make `weight` and `reps` nullable from day one
- Support a `tracking_type` enum (`reps`, `duration`, `distance`, `bodyweight`) per exercise
- Allow exercises to have one primary and multiple secondary muscle groups
- Store muscle groups as a relation, not a single enum column
- Design the exercise database to be extensible (custom exercises must fit the same schema)

**Warning signs:**
- First time a user tries to log a "plank" or "wall sit" and can't
- Requests to add "cardio" or "duration-only" exercises
- Migration warnings like: "You are about to drop the column..."

**Phase to address:**
Phase 1 (Core data model design)

---

### Pitfall 2: Ambiguous "Personal Record" Definition

**What goes wrong:**
The app flags a new PR when weight increases, but ignores that reps dropped from 12 to 6. Users get confused about whether they're actually progressing. The PR system becomes meaningless because it doesn't account for the weight x reps relationship.

**Why it happens:**
PR logic is often implemented as `MAX(weight)` per exercise. But a true strength PR requires estimating 1RM or tracking volume (weight x reps x sets). Developers pick the simplest metric without understanding fitness semantics.

**How to avoid:**
- Define PRs per metric: heaviest weight, most reps at a given weight, highest estimated 1RM, highest volume
- Store the formula used (Epley, Brzycki, or simple volume) and display it to the user
- Let users see PRs over time per metric, not just a single "PR" badge
- For v1, track `max_weight`, `max_reps_at_weight`, and `max_volume` separately

**Warning signs:**
- Users ask "why isn't this a PR?" when they did 100kg x 5 after previously doing 90kg x 10
- Charts show "PR" spikes that don't correlate with perceived effort

**Phase to address:**
Phase 2 (Progress tracking and PRs)

---

### Pitfall 3: Editing Past Workouts Corrupts Current Session State

**What goes wrong:**
A user opens their workout history to fix a mistaken weight from last week. When they return to today's active workout, the data is stale, overwritten, or the UI shows last week's exercises instead of today's.

**Why it happens:**
The app reuses the same global state or form object for "active workout" and "history editing." There is no clear boundary between viewing/editing historical data and logging the current session.

**How to avoid:**
- Maintain two distinct state containers: `activeWorkout` and `editingWorkout`
- Never mutate `activeWorkout` from the history view
- Use immutable updates; cloning workout data before editing
- After saving a historical edit, invalidate caches but do not touch active session state

**Warning signs:**
- "After editing a past workout, my current workout disappeared"
- Active workout form pre-fills with historical data unexpectedly

**Phase to address:**
Phase 1 (Workout logging architecture)

---

### Pitfall 4: Progress Charts That Mislead

**What goes wrong:**
A "work volume over time" chart shows dramatic drops when the user increases weight and reps fall to the bottom of their rep range. Users interpret this as getting weaker and lose motivation. Or, charts only load partial data until the user scrolls, hiding older workouts.

**Why it happens:**
Volume (weight x reps x sets) is an easy metric to calculate but a terrible standalone progress indicator. Charts are implemented with lazy loading that doesn't fetch the full dataset for trend analysis.

**How to avoid:**
- Always plot multiple metrics: estimated 1RM, volume, and max weight
- Use moving averages or trend lines, not just raw data points
- Ensure chart data queries fetch the full history for an exercise, not just the first N rows
- Add context tooltips: "Volume dropped because weight increased — this is normal"

**Warning signs:**
- "The chart says I'm getting worse"
- Charts look empty or have suspicious flat lines at the start

**Phase to address:**
Phase 3 (Charts and visualization)

---

### Pitfall 5: Date/Time Logic for Rest Days and Skipped Sessions

**What goes wrong:**
The app assumes every calendar day has a workout or is a rest day. Users want to backdate a workout, mark a week as vacation, or shift their entire routine by one day. The rigid date-to-workout mapping breaks, and mesocycle/routine calculations become incorrect.

**Why it happens:**
Developers model routines as `RoutineDay[0] = Monday`, `RoutineDay[1] = Tuesday`, etc., storing workouts by calendar date. Editing dates requires cascading updates to all subsequent workouts in the mesocycle.

**How to avoid:**
- Store workouts with an absolute `performed_at` timestamp
- Store routines/mesocycles as ordered sequences independent of calendar dates
- Calculate "scheduled date" on the fly from a start date + sequence index
- Allow date overrides without rewriting the entire sequence
- Make rest days explicit records (not just gaps in the data)

**Warning signs:**
- "How do I change the date of a rest day?"
- Mesocycle progress percentages are wrong after editing one workout date
- Off-by-one errors in week counters

**Phase to address:**
Phase 1 (Data model) and Phase 2 (Routine/mesocycle logic)

---

### Pitfall 6: Exercise Identity Crisis (Bulk Renames Break History)

**What goes wrong:**
A user renames "Barbell Bench Press" to "Bench Press" or changes its muscle group from "Chest" to "Chest/Triceps." All historical workouts now show the new name, or the muscle group change doesn't apply retroactively, making charts and filters inconsistent.

**Why it happens:**
Workouts store the exercise `name` and `muscle_group` as strings at the time of logging, or they store a foreign key to an exercise table that gets updated globally. Neither approach is perfect.

**How to avoid:**
- Store a snapshot of exercise metadata (name, muscle groups) on each `WorkoutExercise` record
- Allow the exercise library to evolve without rewriting history
- Provide a separate "merge exercises" tool that explicitly reassigns historical records when the user wants to consolidate duplicates
- Never auto-update historical workout records when the exercise library changes

**Warning signs:**
- "I renamed an exercise and now my PR history is gone"
- Charts show two lines for what the user considers the same exercise
- Filtering by muscle group misses old workouts

**Phase to address:**
Phase 1 (Exercise database schema)

---

### Pitfall 7: Not Planning for Data Export/Portability

**What goes wrong:**
After a year of logging, the user wants to export their data or move to a new app. The data is trapped in a complex relational schema with no export endpoint. The developer realizes too late that building an export requires processing queues, file generation, and storage.

**Why it happens:**
Export is treated as a "nice to have" feature. The schema is optimized for the app's internal use, not for standard formats (CSV, JSON, Strong/Hevy import formats).

**How to avoid:**
- Design the schema with a clear "workout log" entity that maps easily to a flat export format
- Keep a denormalized `workout_export_view` or similar for easy serialization
- Implement export in v1, even if it's just JSON download — it validates the data model
- Use standard units internally (kg, seconds) and convert for display

**Warning signs:**
- "Can I export my data?" appears as an issue within the first month of real use
- Export implementation requires complex joins across 5+ tables

**Phase to address:**
Phase 1 (Schema design) — build exportability in from the start

---

### Pitfall 8: Floating-Point Weight Display Errors

**What goes wrong:**
Weights like 22.5kg get stored as `22.5000000001` or `22.4999999999` due to float arithmetic. The UI displays inconsistent values, and PR comparisons fail.

**Why it happens:**
JavaScript/TypeScript `number` is a float. Database types like `FLOAT` or `REAL` propagate the issue. Developers use direct equality checks (`===`) for weights.

**How to avoid:**
- Store weights as `DECIMAL` or `NUMERIC` in the database
- In application code, use integer representation (e.g., store grams as `22500` instead of `22.5` kg) or a decimal library
- Round to the nearest plate increment (0.5kg or 1.25kg or 2.5lb) before display
- Never use `===` for weight comparisons; use epsilon comparisons or round both sides

**Warning signs:**
- UI shows "22.5000000001 kg"
- PR detection misses a record by 0.0000001
- Sorting by weight produces unexpected ordering

**Phase to address:**
Phase 1 (Data model)

---

### Pitfall 9: Workout Logging Friction (Too Many Taps)

**What goes wrong:**
Logging a single set requires: open app → select routine → select exercise → tap weight field → enter weight → tap reps field → enter reps → tap save → repeat. Users abandon the app mid-workout because it takes longer to log than to rest between sets.

**Why it happens:**
The UI is designed for browsing, not for rapid data entry under gym conditions (sweaty hands, time pressure, phone in armband). Every interaction requires precision tapping.

**How to avoid:**
- Default weight and reps to last session's values
- Use large tap targets, not precise text inputs
- Support keyboard shortcuts or swipe gestures
- Allow duplicate-last-set with one tap
- Optimize for the "log during rest period" use case (30-90 seconds)
- Test the UI with one hand while holding a dumbbell

**Warning signs:**
- User takes 5+ minutes to log a 45-minute workout
- Complaints about small buttons or too many screens
- Workouts are logged hours after they happen (indicating post-gym catch-up)

**Phase to address:**
Phase 1 (Core logging UI)

---

### Pitfall 10: Assuming Routines Are Static

**What goes wrong:**
The app locks a routine after the first workout is logged. Users want to add a new exercise, swap a movement, or extend/shorten the mesocycle. The app forces them to create an entirely new routine, losing continuity with their progress history.

**Why it happens:**
Developers model routines as templates that generate immutable workout instances. Editing the template would require cascading changes to planned future workouts.

**How to avoid:**
- Allow routines to be edited at any time
- Distinguish between "template" (planned) and "logged" (actual) workouts
- Logged workouts are immutable snapshots; templates are editable
- When a template changes, only future scheduled workouts are affected
- Provide explicit "clone routine" for users who want to branch, but don't force it

**Warning signs:**
- "How do I add an exercise to my current routine?"
- Users have 10+ nearly identical routines with names like "Push A v3"

**Phase to address:**
Phase 2 (Routines and templates)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Store exercise name as string on workout records | Simple queries, no joins | Renames break history; duplicates proliferate | Never — use exercise ID + snapshot |
| Use `FLOAT` for weight in database | Native JS number type | Precision errors, display bugs, wrong PRs | Never — use `DECIMAL` or integer grams |
| Single `muscle_group` enum per exercise | Easy filtering | Can't represent compound movements | MVP only if you plan to migrate to array/relation |
| Hardcode kg, no unit toggle | Simpler UI | Blocks users who think in lbs; conversion errors later | Never — store in one unit, convert for display |
| No explicit rest day records | Less data | Can't distinguish "rest" from "forgot to log" | Acceptable in v1 if you add a `workout_type` field later |
| Client-side only storage (localStorage) | No backend needed | Data loss on device change, no export, size limits | v1 prototype only; plan DB migration path |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Exercise database (seed data) | Hardcode 800 exercises with rigid categories | Seed a core set (~100), allow custom exercises, let user add aliases |
| Charting library | Fetch all data then filter client-side | Use time-bucketed queries; fetch aggregated data for trends, raw for detail |
| Date handling | Use local timezone for everything | Store UTC timestamps; display in user's local timezone |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Fetching full workout history for charts | Charts load slowly; UI freezes | Use server-side aggregation; fetch only the metrics needed for the chart | ~200+ workouts |
| N+1 queries when loading a workout with exercises and sets | API responses take 2-5 seconds | Use JOINs or nested selects; eager load related data | ~10+ exercises per workout |
| Storing image assets for exercises in DB or base64 | DB bloat; slow backups | Store URLs or paths; use a CDN or public exercise DB images | ~50+ custom exercise images |
| Client-side calculation of PRs on every render | Lag when switching exercise views | Pre-compute and cache PRs on workout save; invalidate on edit | ~100+ sets per exercise |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No input sanitization on custom exercise names | XSS via exercise names rendered in charts/lists | Sanitize all user-generated text; use textContent, not innerHTML |
| SQL injection in search queries | Database compromise | Use parameterized queries/ORM; never string-interpolate SQL |
| Storing workout data unencrypted in localStorage | Data readable by any script on domain | Acceptable for personal use, but warn user; for cloud sync, encrypt at rest |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No empty state for first-time user | Staring at blank screen with no idea what to do | Onboarding: create first routine, log a sample workout |
| Requiring routine creation before first workout | User just wants to log "bench press 3x10" | Support free-form logging; prompt to save as routine later |
| Deleting a workout with no confirmation | Accidental data loss | Soft delete (archive) by default; hard delete requires confirmation |
| Showing "0 progress" for new exercises | Discouraging first-time use | Hide charts until N data points exist; show "keep logging to see progress" |
| No way to duplicate or repeat a previous workout | Forces manual re-entry | "Repeat last workout" one-tap option |

## "Looks Done But Isn't" Checklist

- [ ] **Exercise database:** Often missing aliases and synonyms — verify "bench press" and "barbell bench press" don't create duplicates
- [ ] **Workout logging:** Often missing "undo last set" — verify users can correct mistakes without starting over
- [ ] **Progress charts:** Often missing data normalization — verify chart handles kg/lb, varying rep ranges, and bodyweight exercises
- [ ] **PR tracking:** Often only tracks max weight — verify PRs account for rep ranges and volume
- [ ] **Data export:** Often an afterthought — verify schema can serialize to a flat JSON/CSV without complex joins
- [ ] **Offline support:** Often assumed browser cache is enough — verify workouts can be logged without network and sync later
- [ ] **Date editing:** Often locked after creation — verify users can correct wrong dates
- [ ] **Routine editing:** Often frozen after first use — verify exercises can be added/swapped without creating new routine

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Rigidity in data model | HIGH | Migration scripts to add nullable columns; backfill with defaults; update all queries |
| Misleading progress charts | MEDIUM | Add new chart metrics; hide old misleading ones; user communication about change |
| Past workout edit corruption | HIGH | Audit log + manual data repair; implement soft deletes and history versioning |
| Floating-point weight errors | MEDIUM | Migrate to DECIMAL/integer representation; round existing data; fix PR recalculation |
| No data export | MEDIUM | Build export endpoint; document schema; offer manual export via support initially |
| Locked routines | LOW | Unlock routine editing; separate template from logged snapshots retroactively |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Overly rigid exercise data model | Phase 1: Schema design | Can log plank (no weight), run (duration), and bench press (weight+reps) in same schema |
| Ambiguous PR definition | Phase 2: Progress tracking | PRs for "max weight 100kg x 5" and "max volume 90kg x 10" both tracked correctly |
| Past edit corrupts active session | Phase 1: State architecture | Edit historical workout while logging new one; verify isolation |
| Misleading progress charts | Phase 3: Visualization | Chart shows expected trend when weight increases and reps decrease |
| Date/time logic errors | Phase 1: Data model | Shift routine start date; all scheduled workouts recalculate correctly |
| Exercise identity crisis | Phase 1: Exercise DB | Rename exercise in library; historical workouts retain old name in logs |
| No data export | Phase 1: Schema design | Generate valid JSON export with one query per workout |
| Floating-point errors | Phase 1: Data model | Store 22.5kg; retrieve exactly 22.5kg; PR at 22.5kg detected correctly |
| Logging friction | Phase 1: Core UI | Time to log a 5-exercise workout is under 2 minutes |
| Static routine assumption | Phase 2: Routines | Add exercise to existing routine; future workouts pick it up; past workouts unchanged |

## Sources

- MyFit open issues (GitHub: WhyAsh5114/MyFit) — real-world bug reports from a SvelteKit workout tracker
- fit-forge migrations (GitHub: greengem/fit-forge) — schema evolution showing weight/reps becoming optional, timer removal, PR definition changes
- MyFit Prisma schema — exercise snapshot pattern, mesocycle complexity, bodyweight type migrations
- Cashew issue patterns (GitHub: jameskokoska/Cashew) — analogous personal tracking app pitfalls (transaction editing, filtering, data portability)
- Gym Routine Tracker Watch App issues (GitHub: open-trackers) — watchOS-specific crash patterns, localization gaps
- Personal domain knowledge — weightlifting data semantics, 1RM estimation formulas, workout logging UX requirements

---
*Pitfalls research for: GymTracker personal workout tracking web app*
*Researched: 2025-04-23*
