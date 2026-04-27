"use client";

import { useState, useCallback, useEffect } from "react";
import type { Exercise } from "@/db/schema";
import { ExerciseSearch } from "@/components/exercise-search";
import { ExerciseList } from "@/components/exercise-list";
import { CustomExerciseForm } from "@/components/custom-exercise-form";
import { createBrowserClient } from "@/db/client";

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filtered, setFiltered] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMuscle, setActiveMuscle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Re-apply filters when exercises data changes (fixes stale closure)
  useEffect(() => {
    if (exercises.length > 0) {
      filterExercises(searchQuery, activeMuscle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises]);

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
    <div className="py-4 page-container">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Exercise Catalog</h1>
            <p className="text-sm text-muted mt-1">Loading...</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingExercise(undefined);
              setShowForm(true);
            }}
            style={{ backgroundColor: '#10b981', color: 'white' }}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all hover:opacity-90 active:scale-95 shrink-0"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Exercise
          </button>
        </div>
        <div className="py-12 text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
          <p className="mt-3 text-muted text-sm">Loading exercises...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <div className="rounded-xl bg-danger/10 border border-danger/20 px-4 py-3 text-danger inline-block">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Exercise Catalog</h1>
          <p className="text-sm text-muted mt-1">{exercises.length} exercises available</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingExercise(undefined);
            setShowForm(true);
          }}
          style={{ backgroundColor: '#10b981', color: 'white' }}
          className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold transition-all hover:opacity-90 active:scale-95 shrink-0 shadow-lg shadow-primary/25"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Exercise
        </button>
      </div>

      <ExerciseSearch onSearch={handleSearch} resultCount={filtered.length} />

      {/* Muscle filters */}
      <div className="mt-6 mb-2">
        <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted">Muscle Groups</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleMuscleFilter(null)}
            className="rounded-full px-4 py-2 text-sm font-semibold transition-all shadow-sm"
            style={activeMuscle === null ? { backgroundColor: '#10b981', color: 'white' } : { backgroundColor: '#d1fae5', color: '#059669' }}
          >
            All Muscles
          </button>
          {Array.from(new Set(exercises.map((ex) => ex.primary_muscle_group)))
            .sort()
            .map((muscle) => (
              <button
                key={muscle}
                onClick={() => handleMuscleFilter(muscle)}
                className="rounded-full px-4 py-2 text-sm font-semibold transition-all shadow-sm"
                style={activeMuscle === muscle ? { backgroundColor: '#10b981', color: 'white' } : { backgroundColor: '#d1fae5', color: '#059669' }}
              >
                {muscle}
              </button>
            ))}
        </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-surface p-6 shadow-2xl border border-border animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                {editingExercise ? "Edit Exercise" : "Add Custom Exercise"}
              </h2>
              <button
                onClick={handleFormCancel}
                className="rounded-lg p-2 text-muted hover:bg-surface-elevated transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl border border-border animate-slide-up">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 mx-auto mb-4">
              <svg className="h-6 w-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-center">Delete Exercise</h2>
            <p className="mt-2 text-sm text-muted text-center">
              Delete &quot;{deleteConfirm.name}&quot;? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-danger px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-700 hover:shadow-lg hover:shadow-danger/25"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted transition-all hover:bg-surface-elevated"
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
