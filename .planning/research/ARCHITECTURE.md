# Architecture Patterns

**Domain:** Personal gym/workout tracking web application
**Researched:** 2025-04-23

## Executive Summary

Personal workout tracking systems follow a remarkably consistent hierarchical data model across implementations (web, iOS, Android). The architecture is fundamentally **data-heavy, logic-light**: the complexity lies in modeling exercise performance over time, not in business rules. After surveying open-source implementations including MyFit (SvelteKit/Prisma, 130 stars), BodyProgress (SwiftUI/CoreData, 273 stars), reactgym (React/Flux, 37 stars), and others, a clear canonical structure emerges.

For GymTracker — a single-user personal web app — the recommended architecture is a **Next.js full-stack monolith with a normalized relational schema**, using Supabase (PostgreSQL) as the data layer. This matches the existing project context and avoids the over-engineering seen in multi-user apps (auth, ACLs, tRPC routers).

---

## Recommended Architecture

### High-Level Structure

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 App                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   UI Layer  │  │  Server     │  │   Client State      │  │
│  │  (Pages &   │  │  Actions    │  │   (React hooks)     │  │
│  │  Components)│  │  & API      │  │                     │  │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────────┘  │
│         │                │                                   │
│         └────────────────┘                                   │
│                   │                                          │
│              Supabase Client                                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase (PostgreSQL)                           │
│         ┌──────────────┐    ┌──────────────┐                │
│         │  Core Tables │    │  Analytics   │                │
│         │  (Normalized)│    │  (Views/Mat) │                │
│         └──────────────┘    └──────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Exercise Catalog** | Stores built-in + custom exercise definitions (name, muscle group, equipment). Read-heavy, rarely changes. | Workout Logger, Progress Charts, Exercise Search |
| **Routine Builder** | Defines reusable workout templates (which exercises, in what order, target sets/reps). | Exercise Catalog, Workout Logger |
| **Workout Logger** | Active session capture: records actual sets, reps, weight for a workout. Write-heavy during use. | Exercise Catalog, Routine Builder, Workout History |
| **Workout History** | Queries past workouts with filtering (by date, exercise, routine). Read-heavy. | Workout Logger, Progress Charts |
| **Progress Analytics** | Calculates PRs, volume trends, strength curves over time. Derived data. | Workout History |
| **Dashboard** | Aggregated view: today's planned workout, recent history, PR highlights. | All other components |

**Boundary Rules:**
- Exercise Catalog never depends on Workout Logger (exercises exist independently of being performed)
- Routine Builder depends on Exercise Catalog but not on Workout History
- Progress Analytics depends only on Workout History (derived read-only layer)
- Workout Logger may read from Routine Builder (to instantiate a planned workout) or Exercise Catalog (free-form mode)

---

## Data Flow

### 1. Workout Logging Flow (Active Session)

```
User clicks "Start Workout"
    │
    ▼
┌─────────────────┐
│  Routine Builder │  ──(optional)──►  Pre-populates exercises from selected routine
│  or Free-form    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Workout Logger  │  ◄── User inputs sets/reps/weight per exercise
│  (Client State)  │
└────────┬────────┘
         │ On save / set completion
         ▼
┌─────────────────┐
│  Server Action   │  ──► Inserts: workout → workout_exercises → sets
│  (Next.js)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB    │  ◄── Transactional insert into workout tables
└─────────────────┘
```

### 2. Progress Visualization Flow

```
User navigates to Exercise Stats / Dashboard
    │
    ▼
┌─────────────────┐
│  Server Component│  ──► Queries workout history + pre-computes aggregates
│  or API Route    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase DB     │  ◄── Reads from workout_exercises + sets (indexed by date/exercise)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Progress Charts │  ◄── Chart.js / Recharts renders strength/volume over time
│  (Client)        │
└─────────────────┘
```

### 3. Exercise Catalog Flow

```
User searches for exercise
    │
    ▼
┌─────────────────┐
│  Exercise Search │  ──► Debounced query against exercise catalog
│  (Client)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase DB     │  ◄── Reads from exercises table (fts index on name)
│  or Local Cache  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Exercise List   │  ◄── Render matching exercises with muscle group tags
│  (Client)        │
└─────────────────┘
```

---

## Recommended Database Schema

Based on analysis of MyFit's Prisma schema and BodyProgress's CoreData model, the canonical normalized schema for a personal workout tracker is:

### Core Tables

```sql
-- Exercise definitions (built-in + user-created)
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,        -- e.g., 'Chest', 'Back', 'Quadriceps'
  equipment TEXT,                    -- e.g., 'Barbell', 'Dumbbell', 'Machine'
  is_custom BOOLEAN DEFAULT false,   -- built-in vs user-created
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Routines / workout templates
CREATE TABLE routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exercises within a routine (ordering matters)
CREATE TABLE routine_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routine_id UUID REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sort_order INT NOT NULL,
  target_sets INT DEFAULT 3,
  target_reps_min INT,
  target_reps_max INT,
  target_rpe INT                     -- optional: rate of perceived exertion
);

-- Individual workout sessions
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,                         -- auto-generated or user-named
  routine_id UUID REFERENCES routines(id), -- NULL for free-form workouts
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exercises performed within a workout
CREATE TABLE workout_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id),
  sort_order INT NOT NULL,
  notes TEXT
);

-- Individual sets
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE,
  set_number INT NOT NULL,           -- 1st set, 2nd set, etc.
  reps INT,                          -- actual reps performed
  weight DECIMAL(8,2),               -- in kg or lbs (consistent unit)
  rpe INT,                           -- optional: 1-10 scale
  is_warmup BOOLEAN DEFAULT false,
  is_dropset BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Indexes for Performance

```sql
-- Workout history queries
CREATE INDEX idx_workouts_started_at ON workouts(started_at DESC);
CREATE INDEX idx_workouts_routine ON workouts(routine_id);

-- Exercise history for progress charts
CREATE INDEX idx_workout_exercises_exercise ON workout_exercises(exercise_id);
CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id);

-- Set lookup
CREATE INDEX idx_sets_workout_exercise ON sets(workout_exercise_id);

-- Exercise search
CREATE INDEX idx_exercises_name ON exercises USING gin(name gin_trgm_ops);
```

---

## Patterns to Follow

### Pattern 1: Hierarchical Session Model
**What:** A workout session is a tree: `Workout → WorkoutExercise[] → Set[]`
**When:** Always. This is the universal pattern across every surveyed implementation.
**Why it works:** Mirrors the user's mental model ("I did a workout, with bench press, for 3 sets of 8 at 185"). Enables flexible querying at any level.

```typescript
// Example data structure
interface Workout {
  id: string;
  startedAt: Date;
  exercises: WorkoutExercise[];
}

interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string; // denormalized for display
  sets: Set[];
}

interface Set {
  id: string;
  setNumber: number;
  reps: number;
  weight: number;
}
```

### Pattern 2: Exercise Catalog Separation
**What:** Keep exercise definitions in a dedicated table, independent of workout history.
**When:** From day one. Even the simplest trackers (BodyProgress) separate exercise metadata from session data.
**Why it works:** Enables search, categorization, and analytics without parsing workout history. Prevents data duplication ("Bench Press" spelled 5 different ways).

### Pattern 3: Routine vs. Workout Distinction
**What:** Routines are templates; workouts are instances.
**When:** If supporting structured workouts. Free-form-only apps can skip routines initially.
**Why it works:** Allows users to plan once, execute many times. MyFit's entire architecture centers on this split (ExerciseSplit → Mesocycle → Workout).

### Pattern 4: Time-Series Optimized Reads
**What:** Store raw sets in normalized tables, but query with date-range filters for charts.
**When:** When building progress visualization.
**Why it works:** PostgreSQL handles time-series aggregation well with proper indexes. For a single user, even years of data fits in memory. No need for specialized time-series DBs.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: JSON-Only Workout Storage
**What:** Storing entire workouts as JSON blobs (e.g., `{exercises: [{name: "Bench", sets: [...]}]}`)
**Why bad:** Cannot query individual sets, calculate PRs, or chart progress without full-table scans and JSON parsing. Observed in some early MongoDB-based trackers.
**Instead:** Normalize to `workouts → workout_exercises → sets` tables.

### Anti-Pattern 2: Inline Exercise Editing in Workouts
**What:** Allowing users to rename/edit exercise definitions while logging a workout.
**Why bad:** Corrupts historical data. If "Bench Press" is renamed to "Chest Press", all past workouts suddenly show the new name, making trend analysis impossible.
**Instead:** Exercise definitions are immutable once created. Workout exercises reference exercise IDs but can store a denormalized `exercise_name` snapshot at the time of workout.

### Anti-Pattern 3: No Temporal Boundaries on Workouts
**What:** Allowing workouts without start/end timestamps, or overlapping workouts.
**Why bad:** Progress tracking depends on time ordering. Ambiguous ordering breaks charts and PR calculations.
**Instead:** Every workout must have a `started_at`. Enforce no overlapping sessions at the application layer (or via exclusion constraints if needed).

### Anti-Pattern 4: Over-Engineering for Single User
**What:** Adding user tables, auth middleware, row-level security policies, multi-tenant queries.
**Why bad:** The project explicitly requires no authentication and is personal-use only. Every surveyed multi-user app (MyFit, reactgym) has significant complexity devoted to auth and user scoping that provides zero value here.
**Instead:** Omit `users` table entirely. If multi-user support is ever needed, it can be added as a migration later.

---

## Scalability Considerations

| Concern | At 1 user / 1 year | At 1 user / 5 years | At 1 user / 10 years |
|---------|-------------------|---------------------|----------------------|
| **Workouts** | ~200 rows | ~1,000 rows | ~2,000 rows |
| **WorkoutExercises** | ~2,000 rows | ~10,000 rows | ~20,000 rows |
| **Sets** | ~8,000 rows | ~40,000 rows | ~80,000 rows |
| **Query approach** | Simple JOINs | Same, with date filters | Same, with pagination |
| **Storage** | < 10 MB | < 50 MB | < 100 MB |

**Verdict:** For a single-user personal tracker, PostgreSQL on Supabase is over-provisioned. There are no realistic scalability concerns. The architecture should optimize for query simplicity and developer velocity, not horizontal scaling.

---

## Suggested Build Order (Component Dependencies)

Based on data dependencies, components should be built in this order:

```
Phase 1: Foundation
├── Database schema (exercises, workouts, workout_exercises, sets)
├── Exercise catalog (seed data + CRUD)
└── Basic exercise search

Phase 2: Core Logging
├── Workout creation (free-form)
├── Active workout logger UI
├── Set input (reps, weight)
└── Workout completion / save

Phase 3: History & Retrieval
├── Workout list / history page
├── Workout detail view
└── Edit recent workouts (fix mistakes)

Phase 4: Structure
├── Routine builder (create templates)
├── Start workout from routine
└── Routine management (CRUD)

Phase 5: Insights
├── Personal records (PR) calculation
├── Progress charts per exercise
└── Dashboard with stats
```

**Dependency Graph:**
```
Exercise Catalog ─────┬──► Workout Logger ───► Workout History ───► Progress Analytics
                      │         ▲
Routine Builder ──────┘         │
                                │
                         (saves to)
                                ▼
                          Supabase DB
```

**Why this order:**
1. **Schema first** — Everything depends on the data model. Get the table structure right before building UIs.
2. **Free-form logging before routines** — Users can immediately start tracking. Routine builder is a convenience layer on top.
3. **History before analytics** — You need data before you can visualize it. Building charts on day one shows empty states.
4. **Routines before analytics** — Routines are optional for v1 per PROJECT.md, but if included, they should come after basic logging works.

---

## Sources

- **MyFit** (WhyAsh5114/MyFit) — Comprehensive architecture document and Prisma schema. [GitHub](https://github.com/WhyAsh5114/MyFit/blob/main/ARCHITECTURE.md) — HIGH confidence
- **BodyProgress** (karthironald/BodyProgress) — iOS/CoreData implementation showing simpler hierarchy. [GitHub](https://github.com/karthironald/BodyProgress) — MEDIUM confidence
- **reactgym** (zupzup/reactgym) — Older React/Flux web implementation. [GitHub](https://github.com/zupzup/reactgym) — MEDIUM confidence
- **donnfelker/workout-tracker** — Basic Node/Mongo JSON API structure. [GitHub](https://github.com/donnfelker/workout-tracker) — LOW confidence (outdated, 2012)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Data model | HIGH | Universally consistent across 4+ implementations |
| Component boundaries | HIGH | Clear separation of concerns in all surveyed apps |
| Build order | MEDIUM | Based on logical dependencies; may adjust during implementation |
| Anti-patterns | HIGH | Derived from actual issues encountered in open-source projects |
| Scalability | HIGH | Single-user constraint makes this deterministic |
