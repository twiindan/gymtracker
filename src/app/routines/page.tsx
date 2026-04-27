"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Routine } from "@/db/schema";
import { createBrowserClient } from "@/db/client";

interface RoutineWithCount extends Routine {
  exercise_count: number;
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<RoutineWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRoutines() {
      const supabase = createBrowserClient();

      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching routines:", error);
        setLoading(false);
        return;
      }

      const routinesWithCount = await Promise.all(
        (data as Routine[] ?? []).map(async (routine) => {
          const { count } = await supabase
            .from("routine_exercises")
            .select("*", { count: "exact", head: true })
            .eq("routine_id", routine.id);

          return {
            ...routine,
            exercise_count: count ?? 0,
          };
        })
      );

      setRoutines(routinesWithCount);
      setLoading(false);
    }

    fetchRoutines();
  }, []);

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Routines</h1>
            <p className="text-sm text-muted mt-1">Loading your workout templates...</p>
          </div>
        </div>
        <div className="py-12 text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 page-container">
      {/* Header */}
        <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Routines</h1>
          <p className="text-sm text-muted mt-1">{routines.length} workout templates</p>
        </div>
        <Link
          href="/routines/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] shrink-0 shadow-lg shadow-primary/25"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Routine
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="py-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light/30 mb-4">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">No routines yet</h2>
          <p className="text-sm text-muted mb-4">
            Create your first workout template to get started faster.
          </p>
          <Link
            href="/routines/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Routine
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {routines.map((routine, index) => (
            <Link
              key={routine.id}
              href={`/routines/${routine.id}`}
              className="group block rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-light/50 dark:bg-accent-light/30">
                    <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{routine.name}</h3>
                    {routine.description && (
                      <p className="mt-1 text-sm text-muted line-clamp-2">{routine.description}</p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-light/50 px-2.5 py-1 text-[11px] font-bold text-primary">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                        {routine.exercise_count} exercises
                      </span>
                      <span className="text-xs text-muted">
                        Updated {new Date(routine.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-all group-hover:opacity-100">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
