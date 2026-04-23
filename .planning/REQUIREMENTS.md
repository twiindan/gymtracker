# Requirements: GymTracker

**Defined:** 2025-04-23
**Core Value:** Effortlessly log every workout and clearly see strength progress over time

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Exercise Database

- [ ] **DB-01**: Built-in exercise database with search — ~200-400 common exercises, searchable by name and muscle group
- [ ] **DB-02**: Custom exercises — user can add their own exercises with name, muscle group, and equipment type

### Workout Logging

- [ ] **LOG-01**: User can log exercises with sets, reps, and weight during a workout
- [ ] **LOG-02**: User can start a free-form workout without selecting a routine first
- [ ] **LOG-03**: User can edit past workouts to fix mistakes (weight, reps, missed sets)
- [ ] **LOG-04**: User can duplicate the last set with one tap to speed up logging

### History & Progress

- [ ] **HIST-01**: User can view a scrollable list of past workouts with summary details
- [ ] **HIST-02**: User can track personal records (PRs) per exercise — max weight, max reps, estimated 1RM
- [ ] **HIST-03**: User can view progress charts showing strength and volume over time per exercise

### Routines & Structure

- [ ] **RTN-01**: User can create and save workout routine templates (exercises, order, target sets/reps)
- [ ] **RTN-02**: User can start a workout from a saved routine template
- [ ] **RTN-03**: User can copy a previous workout and adjust it for the current session

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Calendar & Visualization

- **CAL-01**: Calendar heatmap view of workout days (GitHub-style)
- **CAL-02**: Muscle group volume tracking — see which muscles are getting attention over time

### Advanced Tracking

- **ADV-01**: RPE (Rate of Perceived Exertion) tracking per set
- **ADV-02**: Estimated 1RM calculation with formulas (Epley/Brzycki)
- **ADV-03**: Exercise notes per set or workout for form tweaks and context
- **ADV-04**: Workout streak / consistency counter

### Convenience Features

- **CONV-01**: Plate calculator — bar weight + target weight → plate breakdown
- **CONV-02**: Warm-up set calculator based on working weight
- **CONV-03**: Superset / circuit support — group exercises sharing rest periods
- **CONV-04**: Data export to CSV/JSON for user data ownership

### Polish

- **POL-01**: Dark mode support
- **POL-02**: Offline support / PWA installability
- **POL-03**: Auto-progression suggestions based on previous session

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Social feed / sharing | Personal app only; single-user constraint |
| Multi-user accounts / auth | Personal use only; adds complexity for zero value |
| Native mobile app | Web app sufficient for v1; responsive design covers mobile |
| Nutrition / calorie tracking | Separate domain; massive scope expansion |
| Body measurements tracking | Out of scope per PROJECT.md; separate concern |
| Rest timer between sets | Explicitly excluded per PROJECT.md; keeps logging flow simple |
| Live workout classes / video content | Different product category (Peloton, etc.) |
| Wearable integration (Apple Watch, etc.) | Web app limitations; manual entry only |
| AI chatbot / personal trainer | High complexity, low reliability for v1 |
| Community features / leaderboards | Social is explicitly out of scope |
| Meal planning | Nutrition is out of scope |
| Progress photos / gallery | Storage complexity; out of scope |
| Barcode scanning for food | Nutrition is out of scope |
| Voice logging / Siri integration | Mobile-native feature; web limitations |
| Automatic rep counting via camera | Computer vision; massive complexity |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Pending |
| DB-02 | Phase 1 | Pending |
| LOG-01 | Phase 2 | Pending |
| LOG-02 | Phase 2 | Pending |
| LOG-03 | Phase 3 | Pending |
| LOG-04 | Phase 2 | Pending |
| HIST-01 | Phase 3 | Pending |
| HIST-02 | Phase 5 | Pending |
| HIST-03 | Phase 5 | Pending |
| RTN-01 | Phase 4 | Pending |
| RTN-02 | Phase 4 | Pending |
| RTN-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2025-04-23*
*Last updated: 2025-04-23 after initial definition*
