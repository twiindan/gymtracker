# Roadmap: GymTracker

## Overview

GymTracker v1 delivers a single-user, offline-first workout logging experience. The journey starts with a solid exercise catalog and data foundation, moves to frictionless workout logging, adds history review and editing, introduces routine templates for structured training, and culminates in progress insights through personal records and charts.

## Phases

- [ ] **Phase 1: Foundation & Exercise Database** - Searchable exercise catalog with built-in and custom exercises
- [ ] **Phase 2: Core Workout Logging** - Free-form workout sessions with fast set logging
- [ ] **Phase 3: Workout History & Editing** - Review, browse, and correct past workouts
- [ ] **Phase 4: Routines & Workout Templates** - Create reusable templates and start workouts from them
- [ ] **Phase 5: Progress Tracking & Insights** - Personal records, charts, and dashboard highlights

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
- [ ] `01-01-PLAN.md` — Next.js scaffold + Supabase client + exercises table schema + wger seed script
- [ ] `01-02-PLAN.md` — Exercise catalog UI (search + muscle filter) + custom exercise creation form

### Phase 2: Core Workout Logging
**Goal**: Users can log free-form workouts with minimal friction
**Depends on**: Phase 1
**Requirements**: LOG-01, LOG-02, LOG-04
**Success Criteria** (what must be TRUE):
  1. User can start a free-form workout without selecting a routine first
  2. User can log exercises with sets, reps, and weight during an active workout
  3. User can duplicate the last set with one tap to speed up logging
  4. User can complete and save a workout session
**Plans**: TBD
**UI hint**: yes

### Phase 3: Workout History & Editing
**Goal**: Users can review and correct past workout data
**Depends on**: Phase 2
**Requirements**: HIST-01, LOG-03
**Success Criteria** (what must be TRUE):
  1. User can view a scrollable list of past workouts with summary details
  2. User can open a past workout to see full exercise and set details
  3. User can edit past workouts to fix mistakes in weight, reps, or sets
**Plans**: TBD
**UI hint**: yes

### Phase 4: Routines & Workout Templates
**Goal**: Users can create reusable workout templates and start sessions from them
**Depends on**: Phase 3
**Requirements**: RTN-01, RTN-02, RTN-03
**Success Criteria** (what must be TRUE):
  1. User can create and save workout routine templates with exercises, order, and target sets/reps
  2. User can start a new workout from a saved routine template
  3. User can copy a previous workout and adjust it for the current session
**Plans**: TBD
**UI hint**: yes

### Phase 5: Progress Tracking & Insights
**Goal**: Users can see their strength progress and personal records over time
**Depends on**: Phase 3
**Requirements**: HIST-02, HIST-03
**Success Criteria** (what must be TRUE):
  1. User can view personal records per exercise (max weight, max reps, estimated 1RM)
  2. User can view progress charts showing strength and volume over time per exercise
  3. Dashboard highlights recent PRs and workout activity
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Exercise Database | 0/2 | Planned | - |
| 2. Core Workout Logging | 0/TBD | Not started | - |
| 3. Workout History & Editing | 0/TBD | Not started | - |
| 4. Routines & Workout Templates | 0/TBD | Not started | - |
| 5. Progress Tracking & Insights | 0/TBD | Not started | - |
