# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v2.0 — Advanced Features & Visualization

**Shipped:** 2026-04-29
**Phases:** 4 | **Plans:** 9 | **Sessions:** ~10

### What Was Built
- Calendar heatmap (GitHub-style 365-day workout consistency view)
- Muscle group volume tracking with Recharts (7d/30d/90d toggle)
- RPE tracking inline with sets, propagated through save flow and history display
- Progression suggestion engine with plateau detection
- Scheduled workouts with quick-add form and active workout integration
- Routine folders for hierarchical organization
- Data export utility (JSON nested, CSV flat) with client-side download
- Settings page with export controls and header navigation integration

### What Worked
- Phase-scoped execution — each phase delivered cleanly with matching summaries
- Client-side export avoided server complexity and kept architecture simple
- Recharts reused across multiple chart types (progress charts, muscle volume)
- Deviation rules caught missing error handling and type safety gaps automatically

### What Was Inefficient
- State tracking drift between JSON state and STATE.md/ROADMAP.md required manual reconciliation
- Summary one-liner extraction returned undefined for several summaries — frontmatter not consistently populated

### Patterns Established
- Client-biased architecture with Supabase as data layer
- Denormalized snapshots on join tables for performance
- Inline editing for sets and exercises
- Recharts for all chart visualizations
- Epley formula for 1RM estimation

### Key Lessons
1. Keep STATE.md, ROADMAP.md, and JSON state in sync — drift causes confusion during milestone close
2. Always populate SUMMARY.md frontmatter with one-liner — enables automated accomplishment extraction
3. Client-side features (export, downloads) are simpler and more secure than server endpoints for single-user apps

### Cost Observations
- Model mix: Primarily qwen3.6-plus for execution
- Sessions: ~10 across 4 phases
- Notable: v2.0 delivered 4 phases in ~2 days, faster than v1.0 due to established patterns and infrastructure

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | ~20 | 5 | Initial setup, pattern establishment |
| v2.0 | ~10 | 4 | Reused patterns, faster execution |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | TypeScript compilation | N/A | Next.js, Supabase, Recharts |
| v2.0 | TypeScript compilation | N/A | None (reused stack) |

### Top Lessons (Verified Across Milestones)

1. Client-biased architecture works well for single-user apps — no auth or server complexity
2. Denormalized snapshots prevent N+1 query problems in workout logging
3. Established patterns (inline editing, Recharts, Epley formula) reduce development time across phases
