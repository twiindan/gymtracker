"use client";

import { useState, useCallback } from "react";
import type { Exercise } from "@/db/schema";
import { ExerciseSearch } from "@/components/exercise-search";
import { ExerciseList } from "@/components/exercise-list";
import { CustomExerciseForm } from "@/components/custom-exercise-form";
import { createBrowserClient } from "@/db/client";
import { useEffect } from "react";

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filtered, setFiltered] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<Exercise | null>(null);

  async function fetchExercises() {
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setExercises(data ?? []);
      setFiltered(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load exercises");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      filterExercises(query, activeMuscle);
    },
    [activeMuscle]
  );

  const handleMuscleFilter = useCallback(
    (muscle: string | null) => {
      setActiveMuscle(muscle);
      filterExercises(searchQuery, muscle);
    },
    [searchQuery]
  );

  function filterExercises(query: string, muscle: string | null) {
    let result = exercises;

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.primary_muscle_group.toLowerCase().includes(q)
      );
    }

    if (muscle) {
      result = result.filter((ex) => ex.primary_muscle_group === muscle);
    }

    setFiltered(result);
  }

  function handleEdit(exercise: Exercise) {
    setEditingExercise(exercise);
    setShowForm(true);
  }

  function handleDeleteClick(exercise: Exercise) {
    setDeleteConfirm(exercise);
  }

  async function handleConfirmDelete() {
    if (!deleteConfirm) return;

    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("exercises")
      .delete()
      .eq("id", deleteConfirm.id)
      .eq("is_custom", true);

    if (error) {
      setError(error.message);
    } else {
      // Optimistic update
      const updated = exercises.filter((ex) => ex.id !== deleteConfirm.id);
      setExercises(updated);
      filterExercises(searchQuery, activeMuscle);
    }

    setDeleteConfirm(null);
  }

  function handleFormSuccess() {
    setShowForm(false);
    setEditingExercise(undefined);
    fetchExercises();
  }

  function handleFormCancel() {
    setShowForm(false);
    setEditingExercise(undefined);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-zinc-500">
        Loading exercises...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Exercise Catalog</h1>
        <button
          onClick={() => {
            setEditingExercise(undefined);
            setShowForm(true);
          }}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          + Add Custom
        </button>
      </div>

      <ExerciseSearch onSearch={handleSearch} resultCount={filtered.length} />

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => handleMuscleFilter(null)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
            activeMuscle === null
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          All
        </button>
        {Array.from(new Set(exercises.map((ex) => ex.primary_muscle_group)))
          .sort()
          .map((muscle) => (
            <button
              key={muscle}
              onClick={() => handleMuscleFilter(muscle)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeMuscle === muscle
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {muscle}
            </button>
          ))}
      </div>

      <div className="mt-6">
        <ExerciseList
          exercises={filtered}
          searchActive={!!searchQuery.trim()}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="mb-4 text-lg font-semibold">
              {editingExercise ? "Edit Exercise" : "Add Custom Exercise"}
            </h2>
            <CustomExerciseForm
              exercise={editingExercise}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h2 className="text-lg font-semibold">Delete Exercise</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Delete &quot;{deleteConfirm.name}&quot;? This cannot be undone.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
