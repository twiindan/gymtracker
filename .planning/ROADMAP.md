# Roadmap: GymTracker

## Overview

GymTracker v1 delivers a single-user, offline-first workout logging experience. The journey starts with a solid exercise catalog and data foundation, moves to frictionless workout logging, adds history review and editing, introduces routine templates for structured training, and culminates in progress insights through personal records and charts.

## Phases

- [x] **Phase 1: Foundation & Exercise Database** - Searchable exercise catalog with built-in and custom exercises
- [x] **Phase 2: Core Workout Logging** - Free-form workout sessions with fast set logging
- [x] **Phase 3: Workout History & Editing** - Review, browse, and correct past workouts
- [x] **Phase 4: Routines & Workout Templates** - Create reusable templates and start workouts from them
- [x] **Phase 5: Progress Tracking & Insights** - Personal records, charts, and dashboard highlights

## Phase Details

### Phase 1: Foundation & Exercise Database
**Goal**: Users can find and manage exercises in a searchable catalog
**Depends on**: Nothing (first phase)
**Requirements**: DB-01, DB-02
**Success Criteria** (what must be TRUE):
  1. User can search built-in exercises by name and muscle group
  2. User can add custom exercises with name, muscle group, and equipment type
  3. Exercise catalog loads instantly and is available during workouts
**Plans**: 2 plans
**UI hint**: yes

Plans:
- [x] `01-01-PLAN.md` — Next.js scaffold + Supabase client + exercises table schema + wger seed script
- [x] `01-02-PLAN.md` — Exercise catalog UI (search + muscle filter) + custom exercise creation form

### Phase 2: Core Workout Logging
**Goal**: Users can log free-form workouts with minimal friction
**Depends on**: Phase 1
**Requirements**: LOG-01, LOG-02, LOG-04
**Success Criteria** (what must be TRUE):
  1. User can start a free-form workout without selecting a routine first
  2. User can log exercises with sets, reps, and weight during an active workout
  3. User can duplicate the last set with one tap to speed up logging
  4. User can complete and save a workout session
**Plans**: 4 plans
**UI hint**: yes

Plans:
- [x] `02-01-PLAN.md` — Workout database schema (workouts, workout_exercises, sets tables)
- [x] `02-02-PLAN.md` — Active workout logger UI (exercise picker, set input, duplicate-last-set)
- [x] `02-03-PLAN.md` — Workout save & basic history (save flow, history list, detail view)
- [x] `02-04-PLAN.md` — App navigation & entry points (header, home dashboard, routes)

### Phase 3: Workout History & Editing
**Goal**: Users can review and correct past workout data
**Depends on**: Phase 2
**Requirements**: HIST-01, LOG-03
**Success Criteria** (what must be TRUE):
  1. User can view a scrollable list of past workouts with summary details
  2. User can open a past workout to see full exercise and set details
  3. User can edit past workouts to fix mistakes in weight, reps, or sets
**Plans**: 3 plans
**UI hint**: yes

Plans:
- [x] `03-01-PLAN.md` — Workout edit mode (metadata, exercises, sets)
- [x] `03-02-PLAN.md` — Soft delete & enhanced history filters
- [x] `03-03-PLAN.md` — Calendar view (optional, nice-to-have)

### Phase 4: Routines & Workout Templates
**Goal**: Users can create reusable workout templates and start sessions from them
**Depends on**: Phase 3
**Requirements**: RTN-01, RTN-02, RTN-03
**Success Criteria** (what must be TRUE):
  1. User can create and save workout routine templates with exercises, order, and target sets/reps
  2. User can start a new workout from a saved routine template
  3. User can copy a previous workout and adjust it for the current session
**Plans**: 5 plans
**UI hint**: yes

Plans:
- [x] `04-01-PLAN.md` — Routine database schema (routines, routine_exercises tables)
- [x] `04-02-PLAN.md` — Routine builder UI (create/edit routines with exercises, targets)
- [x] `04-03-PLAN.md` — Start workout from routine (pre-populate active workout)
- [x] `04-04-PLAN.md` — Copy previous workout (create new workout from existing)
- [x] `04-05-PLAN.md` — Navigation integration (header, home page, routines list)

### Phase 5: Progress Tracking & Insights
**Goal**: Users can see their strength progress and personal records over time
**Depends on**: Phase 3
**Requirements**: HIST-02, HIST-03
**Success Criteria** (what must be TRUE):
  1. User can view personal records per exercise (max weight, max reps, estimated 1RM)
  2. User can view progress charts showing strength and volume over time per exercise
  3. Dashboard highlights recent PRs and workout activity
**Plans**: 5 plans
**UI hint**: yes

Plans:
- [x] `05-01-PLAN.md` — PR calculation system (max weight, reps, volume, estimated 1RM)
- [x] `05-02-PLAN.md` — Exercise progress page with history and charts
- [x] `05-03-PLAN.md` — Reusable progress chart component (recharts)
- [x] `05-04-PLAN.md` — Dashboard with PR highlights and stats
- [x] `05-05-PLAN.md` — Exercise catalog links to progress pages

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Exercise Database | 5/5 | Complete | 2026-04-26 |
| 2. Core Workout Logging | 4/4 | Complete | 2026-04-26 |
| 3. Workout History & Editing | 3/3 | Complete | 2026-04-26 |
| 4. Routines & Workout Templates | 5/5 | Complete | 2026-04-26 |
| 5. Progress Tracking & Insights | 5/5 | Complete | 2026-04-26 |

---

## Milestone: v2.0

**Goal**: Expand GymTracker with advanced visualization, tracking features, and convenience tools.
**Source**: 8 features deferred from v1.0 phases

### Phase 1: Calendar & Visualization
**Goal**: Users can visualize workout consistency and muscle group volume over time
**Depends on**: v1.0 Phase 5
**Requirements**: CAL-01, CAL-02
**Deferred from**: Phase 3 (calendar), Phase 5 (muscle tracking)

Plans: 2 plans

Plans:
- [x] `06-01-PLAN.md` — Calendar heatmap (GitHub-style 365-day workout consistency view)
- [x] `06-02-PLAN.md` — Muscle group volume tracking (horizontal bar chart with 7d/30d/90d toggle)

### Phase 2: Advanced Tracking
**Goal**: Users can track exertion and receive progression suggestions
**Depends on**: v1.0 Phase 2
**Requirements**: ADV-01
**Deferred from**: Phase 5 (RPE), Phase 4 (auto-progression)

Plans: 2 plans

Plans:
- [ ] `07-01-PLAN.md` — RPE schema migration + SetInput inline RPE + save flow + history display
- [ ] `07-02-PLAN.md` — Progression utility library + suggestion panel on active workout page

### Phase 3: Structure & Organization
**Goal**: Users can schedule workouts and organize routines hierarchically
**Depends on**: v1.0 Phase 4
**Deferred from**: Phase 4 (scheduled workouts, routine folders)

Plans:
- [ ] `03-01-PLAN.md` — Scheduled workouts (calendar-based workout planning)
- [ ] `03-02-PLAN.md` — Routine folders and categorization

### Phase 4: Convenience & Polish
**Goal**: Users can export their data and enjoy enhanced usability
**Depends on**: v1.0 Phase 3
**Requirements**: CONV-04
**Deferred from**: Phase 5 (data export)

Plans:
- [ ] `04-01-PLAN.md` — Data export to CSV/JSON for user data ownership

### v2.0 Progress

| Phase | Plans | Status |
|-------|-------|--------|
| 1. Calendar & Visualization | 2/2 | Complete |
| 2. Advanced Tracking | 0/2 | Planned |
| 3. Structure & Organization | 0/2 | Planned |
| 4. Convenience & Polish | 0/1 | Planned |
