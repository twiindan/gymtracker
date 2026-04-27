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
      <div className="mx-auto max-w-2xl px-4 py-12 text-center text-zinc-500">
        Loading routines...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Routines</h1>
        <Link
          href="/routines/new"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + New Routine
        </Link>
      </div>

      {routines.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mb-4 text-5xl">📋</div>
          <h2 className="text-lg font-semibold">No routines yet</h2>
          <p className="mt-1 text-zinc-500">
            Create your first workout template to get started faster.
          </p>
          <Link
            href="/routines/new"
            className="mt-4 inline-block rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Create Routine
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <Link
              key={routine.id}
              href={`/routines/${routine.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{routine.name}</h3>
                  {routine.description && (
                    <p className="mt-1 text-sm text-zinc-500 line-clamp-1">{routine.description}</p>
                  )}
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <div>{routine.exercise_count} exercises</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
