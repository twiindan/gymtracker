"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Workout } from "@/db/schema";
import { createBrowserClient } from "@/db/client";
import { calculateExercisePRs, type SetWithContext } from "@/lib/pr-calculator";

interface RecentWorkout {
  id: string;
  name: string | null;
  started_at: string;
  exercise_count: number;
  set_count: number;
}

interface RecentRoutine {
  id: string;
  name: string;
  exercise_count: number;
}

interface RecentPR {
  exercise_name: string;
  type: string;
  value: string;
  date: string;
}

interface UpcomingScheduled {
  id: string;
  name: string;
  scheduled_date: string;
  routine_name: string | null;
}

export default function Home() {
  const [recentWorkouts, setRecentWorkouts] = useState<RecentWorkout[]>([]);
  const [recentRoutines, setRecentRoutines] = useState<RecentRoutine[]>([]);
  const [recentPRs, setRecentPRs] = useState<RecentPR[]>([]);
  const [upcomingScheduled, setUpcomingScheduled] = useState<UpcomingScheduled[]>([]);
  const [monthlyVolume, setMonthlyVolume] = useState(0);
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecent() {
      const supabase = createBrowserClient();

      const { data: workouts } = await supabase
        .from("workouts")
        .select("*")
        .is("deleted_at", null)
        .order("started_at", { ascending: false })
        .limit(3);

      const enriched = await Promise.all(
        (workouts as Workout[] | null ?? []).map(async (workout) => {
          const { data: exercises } = await supabase
            .from("workout_exercises")
            .select("id")
            .eq("workout_id", workout.id);

          const exerciseIds = (exercises as { id: string }[] | null)?.map((e) => e.id) ?? [];
          let setCount = 0;

          if (exerciseIds.length > 0) {
            const { data: sets } = await supabase
              .from("sets")
              .select("id")
              .in("workout_exercise_id", exerciseIds);
            setCount = (sets as { id: string }[] | null)?.length ?? 0;
          }

          return {
            id: workout.id,
            name: workout.name,
            started_at: workout.started_at,
            exercise_count: exerciseIds.length,
            set_count: setCount,
          };
        })
      );

      setRecentWorkouts(enriched);

      // Fetch total workouts count
      const { count: totalCount } = await supabase
        .from("workouts")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);
      setTotalWorkouts(totalCount ?? 0);

      // Fetch recent routines
      const { data: routines } = await supabase
        .from("routines")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(3);

      const routinesWithCount = await Promise.all(
        (routines ?? []).map(async (routine) => {
          const { count } = await supabase
            .from("routine_exercises")
            .select("*", { count: "exact", head: true })
            .eq("routine_id", (routine as { id: string }).id);
          return {
            id: (routine as { id: string }).id,
            name: (routine as { name: string }).name,
            exercise_count: count ?? 0,
          };
        })
      );

      setRecentRoutines(routinesWithCount);

      // Calculate monthly volume
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: monthWorkouts } = await supabase
        .from("workouts")
        .select("id")
        .gte("started_at", monthStart.toISOString())
        .is("deleted_at", null);

      let monthVolume = 0;
      if (monthWorkouts && monthWorkouts.length > 0) {
        const monthWorkoutIds = monthWorkouts.map((w) => (w as { id: string }).id);
        const { data: monthExercises } = await supabase
          .from("workout_exercises")
          .select("id")
          .in("workout_id", monthWorkoutIds);

        if (monthExercises && monthExercises.length > 0) {
          const monthExerciseIds = (monthExercises as { id: string }[]).map((e) => e.id);
          const { data: monthSets } = await supabase
            .from("sets")
            .select("weight, reps")
            .in("workout_exercise_id", monthExerciseIds);

          monthVolume = ((monthSets as { weight: number | null; reps: number | null }[] | null) ?? []).reduce(
            (sum, set) => sum + (set.weight && set.reps ? set.weight * set.reps : 0),
            0
          );
        }
      }
      setMonthlyVolume(monthVolume);

      // Calculate workout streak (consecutive weeks with at least 1 workout in last 30 days)
      const { data: allWorkouts } = await supabase
        .from("workouts")
        .select("started_at")
        .is("deleted_at", null)
        .order("started_at", { ascending: false })
        .limit(100);

      if (allWorkouts && allWorkouts.length > 0) {
        const weeks = new Set<string>();
        (allWorkouts as { started_at: string }[]).forEach((w) => {
          const date = new Date(w.started_at);
          const yearWeek = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
          weeks.add(yearWeek);
        });
        setWorkoutStreak(Math.min(weeks.size, 4));
      }

      // Fetch recent PRs (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentSets } = await supabase
        .from("sets")
        .select("weight, reps, workout_exercise_id, created_at")
        .gte("created_at", thirtyDaysAgo.toISOString());

      if (recentSets && recentSets.length > 0) {
        const weIds = [...new Set((recentSets as { workout_exercise_id: string }[]).map((s) => s.workout_exercise_id))];

        const { data: workoutExercises } = await supabase
          .from("workout_exercises")
          .select("id, exercise_id, exercise_name")
          .in("id", weIds);

        const weMap = new Map(
          (workoutExercises as { id: string; exercise_id: string; exercise_name: string }[] | null ?? []).map((we) => [
            we.id,
            we,
          ])
        );

        const exerciseSets = new Map<string, SetWithContext[]>();
        (recentSets as { weight: number | null; reps: number | null; workout_exercise_id: string; created_at: string }[]).forEach(
          (set) => {
            const we = weMap.get(set.workout_exercise_id);
            if (!we || set.weight === null || set.reps === null) return;

            if (!exerciseSets.has(we.exercise_id)) {
              exerciseSets.set(we.exercise_id, []);
            }
            exerciseSets.get(we.exercise_id)!.push({
              weight: set.weight,
              reps: set.reps,
              date: set.created_at,
              workout_id: set.workout_exercise_id,
            });
          }
        );

        const prs: RecentPR[] = [];
        for (const [exerciseId, sets] of exerciseSets) {
          const prsData = calculateExercisePRs(sets);
          const we = Array.from(weMap.values()).find((w) => w.exercise_id === exerciseId);
          if (!we) continue;

          if (prsData.max_weight) {
            prs.push({
              exercise_name: we.exercise_name,
              type: "Max Weight",
              value: `${prsData.max_weight.value} kg`,
              date: prsData.max_weight.date,
            });
          }
          if (prsData.estimated_1rm) {
            prs.push({
              exercise_name: we.exercise_name,
              type: "Est. 1RM",
              value: `${Math.round(prsData.estimated_1rm.value)} kg`,
              date: prsData.estimated_1rm.date,
            });
          }
        }

        prs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentPRs(prs.slice(0, 5));
      }

      // Fetch upcoming scheduled workouts
      const today = new Date().toISOString().slice(0, 10);
      const { data: scheduled } = await supabase
        .from("scheduled_workouts")
        .select("*")
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(2);

      if (scheduled && scheduled.length > 0) {
        // Fetch routine names for scheduled workouts
        const routineIds = (scheduled as { routine_id: string | null }[])
          .map((s) => s.routine_id)
          .filter(Boolean) as string[];

        const routineMap = new Map<string, string>();
        if (routineIds.length > 0) {
          const { data: routines } = await supabase
            .from("routines")
            .select("id, name")
            .in("id", routineIds);
          (routines as { id: string; name: string }[] ?? []).forEach((r) => {
            routineMap.set(r.id, r.name);
          });
        }

        const upcoming: UpcomingScheduled[] = (scheduled as { id: string; name: string; scheduled_date: string; routine_id: string | null }[]).map((s) => ({
          id: s.id,
          name: s.name,
          scheduled_date: s.scheduled_date,
          routine_name: s.routine_id ? routineMap.get(s.routine_id) ?? null : null,
        }));
        setUpcomingScheduled(upcoming);
      }

      setLoading(false);
    }

    fetchRecent();
  }, []);

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div className="py-4">
      {/* Hero */}
      <div className="mb-8 text-center animate-fade-in">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">
          <span className="gradient-text">GymTracker</span>
        </h1>
        <p className="text-muted text-base max-w-sm mx-auto leading-relaxed">
          Effortlessly log every workout and clearly see your strength progress over time.
        </p>
      </div>

      {/* Start Workout CTA */}
      <div className="mb-8 animate-slide-up stagger-1">
        <Link
          href="/workouts/active"
          className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-dark py-5 text-lg font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="h-6 w-6 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Start Workout
        </Link>
      </div>

      {/* Stats Row */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 animate-slide-up stagger-2">
        <StatCard 
          value={loading ? "—" : Math.round(monthlyVolume).toLocaleString()} 
          label="kg this month" 
          icon={<WeightIcon />}
          color="primary"
        />
        <StatCard 
          value={loading ? "—" : workoutStreak} 
          label="Active weeks" 
          icon={<FireIcon />}
          color="warning"
        />
        <StatCard 
          value={loading ? "—" : totalWorkouts} 
          label="Total workouts" 
          icon={<TrophyIcon />}
          color="accent"
        />
        <StatCard 
          value={loading ? "—" : recentRoutines.length} 
          label="Routines" 
          icon={<ClipboardIcon />}
          color="success"
        />
      </div>

      {/* Recent PRs */}
      {recentPRs.length > 0 && (
        <div className="mb-8 animate-slide-up stagger-3">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/20">
              <svg className="h-3.5 w-3.5 text-warning" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold">Recent PRs</h2>
          </div>
          <div className="space-y-2">
            {recentPRs.map((pr, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4 card-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light dark:bg-primary-light/30">
                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{pr.exercise_name}</div>
                    <div className="text-xs text-muted">{pr.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{pr.value}</div>
                  <div className="text-xs text-muted">{formatDate(pr.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Routines */}
      <div className="mb-8 animate-slide-up stagger-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-light dark:bg-accent-light/30">
              <ClipboardIcon className="h-3.5 w-3.5 text-accent" />
            </div>
            <h2 className="text-lg font-bold">Routines</h2>
          </div>
          <Link
            href="/routines"
            className="text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : recentRoutines.length === 0 ? (
          <EmptyState 
            message="No routines yet. Create your first template!" 
            action={{ href: "/routines/new", label: "Create Routine" }}
          />
        ) : (
          <div className="space-y-2">
            {recentRoutines.map((routine) => (
              <Link
                key={routine.id}
                href={`/workouts/active?routine_id=${routine.id}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 card-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light dark:bg-accent-light/30 transition-colors group-hover:bg-accent/20">
                    <PlayIcon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{routine.name}</div>
                    <div className="text-xs text-muted">{routine.exercise_count} exercises</div>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Up Next - Scheduled Workouts */}
      {upcomingScheduled.length > 0 && (
        <div className="mb-8 animate-slide-up stagger-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-light dark:bg-primary-light/30">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Up next</h2>
          </div>
          <div className="space-y-2">
            {upcomingScheduled.map((sw) => (
              <Link
                key={sw.id}
                href={`/workouts/active?scheduled_workout_id=${sw.id}`}
                className="group flex items-center justify-between rounded-xl border border-border bg-surface p-4 card-hover"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light dark:bg-primary-light/30 transition-colors group-hover:bg-primary/20">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{sw.name}</div>
                    <div className="text-xs text-muted">
                      {formatDate(sw.scheduled_date)}
                      {sw.routine_name && ` · ${sw.routine_name}`}
                    </div>
                  </div>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      <div className="animate-slide-up stagger-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-light dark:bg-primary-light/30">
              <DumbbellIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <h2 className="text-lg font-bold">Recent Workouts</h2>
          </div>
          <Link
            href="/workouts"
            className="text-sm font-medium text-muted transition-colors hover:text-primary"
          >
            View all →
          </Link>
        </div>

        {loading ? (
          <LoadingSkeleton />
        ) : recentWorkouts.length === 0 ? (
          <EmptyState 
            message="No workouts yet. Start your first one!" 
            action={{ href: "/workouts/active", label: "Start Workout" }}
          />
        ) : (
          <div className="space-y-2">
            {recentWorkouts.map((workout) => (
              <Link
                key={workout.id}
                href={`/workouts/${workout.id}`}
                className="group block rounded-xl border border-border bg-surface p-4 card-hover"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-elevated border border-border">
                      <span className="text-xs font-bold text-muted">
                        {new Date(workout.started_at).getDate()}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{workout.name || "Workout"}</div>
                      <div className="text-xs text-muted">{formatDate(workout.started_at)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-muted">
                      <div className="font-medium text-foreground">{workout.exercise_count} exercises</div>
                      <div>{workout.set_count} sets</div>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ value, label, icon, color }: { value: string | number; label: string; icon: React.ReactNode; color: string }) {
  const colorClasses: Record<string, string> = {
    primary: "bg-primary-light text-primary dark:bg-primary-light/30",
    warning: "bg-warning/10 text-warning",
    accent: "bg-accent-light text-accent dark:bg-accent-light/30",
    success: "bg-success/10 text-success",
  };

  return (
    <div className="rounded-xl border border-border bg-surface p-4 text-center card-hover">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg mb-2 ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-muted font-medium">{label}</div>
    </div>
  );
}

function EmptyState({ message, action }: { message: string; action?: { href: string; label: string } }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-border py-8 px-4 text-center">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-light dark:bg-primary-light/20 mb-3">
        <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </div>
      <p className="text-muted text-sm mb-3">{message}</p>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-dark"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-surface p-4 animate-pulse-slow">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-border" />
            <div className="flex-1">
              <div className="h-4 w-32 rounded bg-border mb-1" />
              <div className="h-3 w-20 rounded bg-border" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Icons
function WeightIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function FireIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.375m9 0h1.5M12 4.5v2.25m0 0h1.5m-1.5 0h-1.5m1.5 0v2.25m0-2.25h-1.5m1.5 0h1.5" />
    </svg>
  );
}

function ClipboardIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function DumbbellIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

function PlayIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
    </svg>
  );
}

function CalendarIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  );
}
