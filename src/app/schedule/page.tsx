"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { ScheduledWorkout, Routine } from "@/db/schema";
import { createBrowserClient } from "@/db/client";

interface ScheduledWorkoutWithStatus extends ScheduledWorkout {
  status: "today" | "upcoming" | "skipped" | "completed";
  routine_name?: string;
  linked_workout_id?: string | null;
}

export default function SchedulePage() {
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkoutWithStatus[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [routineId, setRoutineId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserClient();
      const today = new Date().toISOString().slice(0, 10);

      // Fetch scheduled workouts
      const { data: scheduled, error: schedError } = await supabase
        .from("scheduled_workouts")
        .select("*")
        .order("scheduled_date", { ascending: true });

      if (schedError) {
        console.error("Error fetching scheduled workouts:", schedError);
        setLoading(false);
        return;
      }

      // Fetch routines for dropdown and name lookup
      const { data: routinesData } = await supabase
        .from("routines")
        .select("*")
        .order("name");
      setRoutines(routinesData as Routine[] ?? []);

      // Build routine name map
      const routineMap = new Map<string, string>();
      (routinesData as Routine[] ?? []).forEach((r) => {
        routineMap.set(r.id, r.name);
      });

      // Fetch workouts to check completion status
      const { data: workouts } = await supabase
        .from("workouts")
        .select("id, scheduled_workout_id")
        .is("deleted_at", null);

      const completedScheduledIds = new Map<string, string>();
      (workouts as { id: string; scheduled_workout_id: string | null }[] ?? []).forEach((w) => {
        if (w.scheduled_workout_id) {
          completedScheduledIds.set(w.scheduled_workout_id, w.id);
        }
      });

      // Enrich with status and routine name
      const enriched: ScheduledWorkoutWithStatus[] = (scheduled as ScheduledWorkout[] ?? []).map((sw) => {
        const isCompleted = completedScheduledIds.has(sw.id);
        let status: ScheduledWorkoutWithStatus["status"];
        if (isCompleted) {
          status = "completed";
        } else if (sw.scheduled_date === today) {
          status = "today";
        } else if (sw.scheduled_date < today) {
          status = "skipped";
        } else {
          status = "upcoming";
        }

        return {
          ...sw,
          status,
          routine_name: sw.routine_id ? routineMap.get(sw.routine_id) : undefined,
          linked_workout_id: completedScheduledIds.get(sw.id) ?? null,
        };
      });

      setScheduledWorkouts(enriched);
      setLoading(false);
    }

    fetchData();
  }, []);

  // Set default date to tomorrow
  useEffect(() => {
    if (!date) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().slice(0, 10));
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !date) {
      setError("Name and date are required");
      return;
    }

    setSaving(true);
    setError(null);

    const supabase = createBrowserClient();

    try {
      const { error: insertError } = await supabase
        .from("scheduled_workouts")
        .insert({
          name: name.trim(),
          scheduled_date: date,
          routine_id: routineId || null,
          notes: notes.trim() || null,
        } as never);

      if (insertError) throw insertError;

      // Reset form
      setName("");
      setRoutineId("");
      setNotes("");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().slice(0, 10));

      // Refresh list
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule workout");
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this scheduled workout?")) return;

    const supabase = createBrowserClient();
    const { error } = await supabase.from("scheduled_workouts").delete().eq("id", id);

    if (error) {
      setError(error.message);
    } else {
      setScheduledWorkouts((prev) => prev.filter((sw) => sw.id !== id));
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-12 text-center text-zinc-500">
        Loading schedule...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight">Schedule</h1>
        <p className="text-sm text-muted mt-1">Plan your future workouts</p>
      </div>

      {/* Quick Add Form */}
      <div className="mb-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-bold mb-4">Schedule a Workout</h2>
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Leg Day"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Routine (optional)</label>
            <select
              value={routineId}
              onChange={(e) => setRoutineId(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">No routine (free-form)</option>
              {routines.map((routine) => (
                <option key={routine.id} value={routine.id}>
                  {routine.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes..."
              rows={2}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-zinc-900 py-3 text-base font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {saving ? "Scheduling..." : "Schedule Workout"}
          </button>
        </form>
      </div>

      {/* Scheduled Workouts List */}
      {scheduledWorkouts.length === 0 ? (
        <div className="py-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light/30 mb-4">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">No scheduled workouts</h2>
          <p className="text-sm text-muted">Use the form above to plan your next workout.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scheduledWorkouts.map((sw) => (
            <div
              key={sw.id}
              className={`group rounded-2xl border p-5 transition-all duration-200 card-hover ${
                sw.status === "today"
                  ? "border-primary bg-surface"
                  : sw.status === "skipped"
                    ? "border-border bg-surface opacity-50"
                    : sw.status === "completed"
                      ? "border-border bg-surface"
                      : "border-border bg-surface"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{sw.name}</h3>
                    {sw.status === "today" && (
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
                        Today
                      </span>
                    )}
                    {sw.status === "completed" && (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-700 dark:bg-green-900 dark:text-green-300">
                        <svg className="h-3 w-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Done
                      </span>
                    )}
                    {sw.status === "skipped" && (
                      <span className="inline-flex items-center rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Skipped
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted">{formatDate(sw.scheduled_date)}</div>
                  {sw.routine_name && (
                    <div className="mt-1 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {sw.routine_name}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {(sw.status === "upcoming" || sw.status === "today") && (
                    <Link
                      href={`/workouts/active?scheduled_workout_id=${sw.id}`}
                      className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                    >
                      Start
                    </Link>
                  )}
                  {sw.status === "completed" && sw.linked_workout_id && (
                    <Link
                      href={`/workouts/${sw.linked_workout_id}`}
                      className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    >
                      View
                    </Link>
                  )}
                  <button
                    onClick={() => handleDelete(sw.id)}
                    className="rounded p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
