# GymTracker

## What This Is

A personal web application for tracking gym workouts. Users log exercises with sets, reps, and weight, organize workouts into routines or free-form sessions, and visualize strength progress over time through history, personal records, and charts.

## Core Value

Effortlessly log every workout and clearly see strength progress over time — if logging is frictionless and progress is visible, the app succeeds.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Log exercises with sets, reps, and weight during workouts
- [ ] Support both structured routines and free-form daily logging
- [ ] View workout history and exercise logs
- [ ] Track personal records (PRs) per exercise
- [ ] Visualize progress with charts (strength/volume over time)
- [ ] Built-in exercise database with search
- [ ] Add custom exercises when needed

### Out of Scope

- Mobile native app — web app is sufficient for v1
- Rest timer between sets — keep logging flow simple
- Body measurements tracking — focus on workout data only
- Social features or sharing — personal use only
- Export/import data — defer to later if needed
- Multiple user accounts — single-user personal app

## Context

- Personal-use project; no multi-user or auth complexity needed
- Web-first delivery; mobile experience via responsive design
- User trains with both structured routines and flexible sessions
- Progress visibility is a key motivator for consistency

## Constraints

- **Platform**: Web application (browser-based)
- **Scope**: Personal use, single user
- **Complexity**: Keep v1 simple; defer nice-to-have features
- **Timeline**: Not specified — prioritize core value first

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web app over mobile | User preference; simpler to build and maintain | — Pending |
| No user authentication | Personal use, single user | — Pending |
| Built-in + custom exercises | Convenience + flexibility for any gym equipment | — Pending |

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
*Last updated: 2025-04-23 after initialization*
