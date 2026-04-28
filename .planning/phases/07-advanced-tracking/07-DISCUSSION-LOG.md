# Phase 07: Advanced Tracking - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions captured in CONTEXT.md — this log preserves the Q&A.

**Date:** 2026-04-28
**Phase:** 07-advanced-tracking
**Mode:** discuss
**Areas discussed:** RPE scale and storage, RPE UI placement, RPE optionality, Auto-progression logic

## Questions & Answers

### RPE Scale and Storage

| Question | Answer | Options Presented |
|----------|--------|-------------------|
| Which RPE scale should we use? | 1-10 Borg scale | 1-10 Borg (Recommended), Simplified 1-5, Free-form number |
| How should RPE be stored in the database? | Nullable column on sets | Nullable column on sets (Recommended), Separate table |

### RPE UI Placement

| Question | Answer | Options Presented |
|----------|--------|-------------------|
| Where should the RPE input appear during logging? | Inline in set row | Inline in set row (Recommended), Collapsible below set, Separate step after sets |

### RPE Optionality

| Question | Answer | Options Presented |
|----------|--------|-------------------|
| Should RPE be optional or required? | Always optional | Always optional (Recommended), Toggle per exercise |

### Auto-Progression Logic

| Question | Answer | Options Presented |
|----------|--------|-------------------|
| What progression logic should we use? | Linear (+2.5kg / +1 rep) | Linear (Recommended), Percentage-based, Volume-based |
| When should progression suggestions appear? | On next workout start | After completing workout, On next workout start (Recommended), Both |
| Which exercises should get progression suggestions? | Only PR/plateaued | All exercises with history, Only PR/plateaued (Recommended) |
| Can users modify progression suggestions? | Accept / reject / modify | Accept/reject/modify (Recommended), Accept/reject only |

## Summary

9 decisions captured across 4 areas. All recommended options were selected. No scope creep detected.
