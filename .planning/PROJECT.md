# GymTracker

## What This Is

A personal web application for tracking gym workouts. Users log exercises with sets, reps, weight, and RPE, organize workouts into routines or free-form sessions, schedule future workouts, and visualize strength progress over time through history, personal records, calendar heatmaps, muscle group volume charts, and progression suggestions. Data can be exported to JSON or CSV for offline ownership.

## Core Value

Effortlessly log every workout and clearly see strength progress over time — if logging is frictionless and progress is visible, the app succeeds.

## Requirements

### Validated

- ✓ Log exercises with sets, reps, and weight during workouts — v1.0
- ✓ Support both structured routines and free-form daily logging — v1.0
- ✓ View workout history and exercise logs — v1.0
- ✓ Track personal records (PRs) per exercise — v1.0
- ✓ Visualize progress with charts (strength/volume over time) — v1.0
- ✓ Built-in exercise database with search — v1.0
- ✓ Add custom exercises when needed — v1.0
- ✓ Calendar heatmap for workout consistency — v2.0
- ✓ Muscle group volume tracking — v2.0
- ✓ RPE tracking and progression suggestions — v2.0
- ✓ Scheduled workouts and routine folders — v2.0
- ✓ Data export to JSON/CSV — v2.0

### Active

(None — all v1.0 and v2.0 requirements shipped)

### Out of Scope

- Mobile native app — web app is sufficient; responsive design works well
- Rest timer between sets — keep logging flow simple
- Body measurements tracking — focus on workout data only
- Social features or sharing — personal use only
- Multiple user accounts — single-user personal app

## Context

Shipped v1.0 + v2.0 with ~7,500 LOC TypeScript/TSX across 32 source files.
Tech stack: Next.js (App Router), Supabase (PostgreSQL), Recharts, client-side architecture.
User trains with both structured routines and flexible sessions.
Progress visibility is a key motivator for consistency.

**v2.0 added:** Calendar heatmap, muscle group volume charts, RPE tracking, progression suggestions with plateau detection, scheduled workouts, routine folders, and data export (JSON/CSV).

## Constraints

- **Platform**: Web application (browser-based)
- **Scope**: Personal use, single user
- **Complexity**: Keep simple; defer nice-to-have features
- **Timeline**: Not specified — prioritize core value first

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app over mobile | User preference; simpler to build and maintain | ✓ Good — responsive web works well |
| No user authentication | Personal use, single user | ✓ Good — no auth complexity needed |
| Built-in + custom exercises | Convenience + flexibility for any gym equipment | ✓ Good — seeded from wger (~500 exercises) |
| Next.js + Supabase stack | Fast development, free tier, good DX | ✓ Good — reliable throughout both milestones |
| Client-biased architecture | Simpler deployment, offline-friendly | ✓ Good — works well for single-user app |
| Store weight in kg, no unit conversion | User trains in kg exclusively | ✓ Good — no complaints |
| Epley formula for 1RM | Standard, well-understood estimation | ✓ Good — used in PR tracking |
| Recharts for progress charts | Lightweight, React-native, good defaults | ✓ Good — used across multiple chart types |
| Client-side export only | No server endpoint needed, instant download | ✓ Good — simple and secure |
| RPE inline with weight/reps | Compact input, context-aware display | ✓ Good — only shown for relevant tracking types |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-29 after v2.0 milestone*
