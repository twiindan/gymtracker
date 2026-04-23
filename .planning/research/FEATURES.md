# Feature Landscape

**Domain:** Personal gym workout tracking web app
**Researched:** April 23, 2026

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Exercise logging (sets × reps × weight) | Core purpose of any tracker | Low | Must be fast — users log mid-workout, often exhausted |
| Workout history / calendar view | Users need to see what they did and when | Low | Calendar heatmap (GitHub-style) is increasingly standard |
| Built-in exercise database with search | Nobody wants to type "Barbell Bench Press" every time | Medium | ~200-400 common exercises covers 95% of gym work |
| Custom exercises | Every gym has odd equipment; users need flexibility | Low | Name + muscle group + equipment type is sufficient |
| Personal records (PRs) per exercise | Primary motivator; users live for PRs | Low | Track max weight, max reps, estimated 1RM |
| Basic progress charts (strength over time) | Visual progress is the #1 retention driver | Medium | Line chart per exercise; volume over time |
| Workout routines / templates | Structured training requires repeating patterns | Medium | Create once, reuse weekly; copy previous workout |
| Free-form / ad-hoc workouts | Not every day follows a plan | Low | Quick-start without selecting a routine first |
| Edit past workouts | Users make mistakes (wrong weight, missed set) | Low | Essential for data accuracy |
| Exercise notes per set/workout | Form tweaks, pain points, context | Low | Simple text field; high user value |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Muscle group volume tracking | See which muscles are getting attention | Medium | Requires tagging exercises with primary/secondary muscles |
| Muscle heat map / body visualization | Visual "what did I train this week?" | High | SVG body map with color intensity; novelty factor |
| RPE (Rate of Perceived Exertion) tracking | Autoregulation for smarter training | Low | Scale of 1-10; one extra field per set |
| Estimated 1RM calculation | Compare strength across rep ranges | Low | Epley or Brzycki formula; auto-computed |
| Workout streak / consistency counter | Gamification drives habit formation | Low | Simple consecutive-day or consecutive-week counter |
| Plate calculator | "How many plates for 315?" | Low | Bar weight + target → plate breakdown |
| Warm-up set calculator | Automate warm-up pyramid | Medium | Based on working weight; % of 1RM |
| Superset / circuit support | Group exercises that share rest periods | Medium | UI complexity; data model needs grouping |
| Rest timer | Time between sets matters for progress | Low | Project explicitly excludes this; included for completeness |
| Data export (CSV/JSON) | User data ownership; peace of mind | Low | Strong offers this; builds trust |
| Auto-progression suggestions | "Last time you did 185×8, try 190×8" | Medium | Requires routine structure + progression rules |
| Periodization / deload weeks | Structured training phases | High | 5/3/1, linear, block periodization — domain expertise needed |
| Exercise substitution suggestions | "No bench press? Try dumbbell press" | Medium | Requires exercise relationship graph |
| Dark mode | Standard expectation for modern apps | Low | Easy win with CSS variables |
| Offline support / PWA | Gym WiFi is often terrible | Medium | Service worker + localStorage / IndexedDB |
| Data import from Strong/Hevy | Onboarding users from existing apps | Medium | CSV parsing; format normalization |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Social feed / sharing | Explicitly out of scope; personal app only | Nothing — single user is the constraint |
| Multi-user accounts / auth | Personal use only; adds complexity for zero value | LocalStorage or simple single-user DB |
| Native mobile app | Web app is sufficient for v1; doubles maintenance | Responsive design + PWA if needed later |
| Nutrition / calorie tracking | Out of scope per PROJECT.md; massive domain | Focus purely on workout data |
| Body measurements tracking | Out of scope per PROJECT.md; separate concern | Track weight as an exercise (e.g., "Bodyweight") if needed |
| Rest timer between sets | Explicitly excluded per PROJECT.md; keeps logging simple | User uses phone timer or gym clock |
| Export/import data | Deferred per PROJECT.md; can add later if needed | Build clean data model that enables this later |
| Live workout classes / video content | Completely different product category (Peloton, etc.) | Stay in the workout logging domain |
| Wearable integration (Apple Watch, etc.) | Web app can't do this natively; complex | Manual entry only |
| AI chatbot / personal trainer | High complexity, low reliability for v1 | Simple progression suggestions based on history |
| Community features / leaderboards | Social is explicitly out of scope | Nothing |
| Meal planning | Nutrition is out of scope | Nothing |
| Progress photos / gallery | Out of scope; storage complexity | Nothing |
| Barcode scanning for food | Nutrition is out of scope | Nothing |
| Voice logging / Siri integration | Mobile-native feature; web limitations | Fast tap-based UI instead |
| Automatic rep counting via camera | Computer vision; massive complexity | Manual entry |

## Feature Dependencies

```
Exercise Database
  → Custom Exercises (extends database)
  → Exercise Search (requires database)
  → Muscle Group Tagging (requires exercises)
    → Muscle Volume Tracking (requires tagging)
    → Muscle Heat Map (requires volume tracking)

Workout Logging (sets × reps × weight)
  → Workout History (requires logged workouts)
  → PR Tracking (requires logged sets)
  → Progress Charts (requires history)
  → Estimated 1RM (requires weight + reps)
  → Workout Streaks (requires history)
  → Exercise Notes (extends logging)

Routines / Templates
  → Auto-Progression (requires routine structure)
  → Warm-up Calculator (requires working weight from routine)
  → Periodization (requires routine + scheduling)

Free-form Workouts
  → Copy Previous Workout (requires history)
  → Quick Start (no routine needed)
```

## MVP Recommendation

**Prioritize:**

1. **Exercise logging (sets × reps × weight)** — Table stakes; core value
2. **Built-in exercise database + custom exercises** — Table stakes; friction reduction
3. **Workout history / calendar** — Table stakes; users need to see past work
4. **Personal records tracking** — Table stakes; primary motivator
5. **Basic progress charts** — Table stakes; visual progress drives retention
6. **Routines + free-form workouts** — Table stakes; covers both structured and flexible training

**Defer:**

| Feature | Defer Reason |
|---------|--------------|
| Muscle heat map | High complexity; novelty over utility |
| Auto-progression | Requires mature routine system first |
| Periodization | Domain expertise needed; niche use |
| RPE tracking | Nice-to-have; can add without breaking existing data |
| Plate calculator | Convenience feature; mental math is easy |
| Warm-up calculator | Depends on auto-progression |
| Superset support | UI complexity; most users do straight sets |
| Offline/PWA | Web-first assumption; add if connectivity issues arise |
| Data import/export | Single user starting fresh; no existing data to import |
| Dark mode | Cosmetic; standard CSS setup enables this easily later |

## Sources

- Strong App website and feature list (strong.app) — HIGH confidence
- Boostcamp website (boostcamp.app) — HIGH confidence
- wger open-source project (github.com/wger-project/wger) — HIGH confidence
- workout-cool open-source project (github.com/Snouzy/workout-cool) — HIGH confidence
- CNET "Best Workout Apps 2026" — MEDIUM confidence
- Muscle & Fitness "Best Apps for Tracking Strength Workouts" — MEDIUM confidence
- GitHub workout-tracker topic exploration — MEDIUM confidence
- PROJECT.md constraints and out-of-scope items — HIGH confidence
