"use client";

import { useState, useCallback, useEffect } from "react";
import type { Exercise } from "@/db/schema";
import { ExerciseSearch } from "@/components/exercise-search";
import { ExerciseList } from "@/components/exercise-list";
import { CustomExerciseForm } from "@/components/custom-exercise-form";
import { createBrowserClient } from "@/db/client";
import { Button } from "@/components/ui/Button";

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
  const [formValid, setFormValid] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

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
          <Button
            variant="primary"
            size="md"
            aria-label="Add exercise"
            onClick={() => {
              setEditingExercise(undefined);
              setShowForm(true);
            }}
          >
            <PlusIcon />
            Add Exercise
          </Button>
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
        <Button
          variant="primary"
          size="lg"
          aria-label="Add exercise"
          onClick={() => {
            setEditingExercise(undefined);
            setShowForm(true);
          }}
        >
          <PlusIcon />
          Add Exercise
        </Button>
      </div>

      <ExerciseSearch onSearch={handleSearch} resultCount={filtered.length} />

      {/* Muscle filters */}
      <div className="mt-6 mb-2">
        <label className="mb-3 block text-xs font-bold uppercase tracking-wider text-muted">Muscle Groups</label>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleMuscleFilter(null)}
            aria-pressed={activeMuscle === null}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
              activeMuscle === null
                ? "bg-primary text-white"
                : "bg-primary-light text-primary dark:bg-primary-light/20"
            }`}
          >
            All Muscles
          </button>
          {Array.from(new Set(exercises.map((ex) => ex.primary_muscle_group)))
            .sort()
            .map((muscle) => (
              <button
                key={muscle}
                onClick={() => handleMuscleFilter(muscle)}
                aria-pressed={activeMuscle === muscle}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  activeMuscle === muscle
                    ? "bg-primary text-white"
                    : "bg-primary-light text-primary dark:bg-primary-light/20"
                }`}
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl bg-surface shadow-2xl border-t sm:border border-border animate-slide-up h-[100dvh] sm:h-auto sm:max-h-[85vh] overflow-hidden">
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-xl font-bold">
                {editingExercise ? "Edit Exercise" : "Add Custom Exercise"}
              </h2>
              <button
                onClick={handleFormCancel}
                aria-label="Close form"
                className="rounded-lg p-2 text-muted hover:bg-surface-elevated transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <CustomExerciseForm
                exercise={editingExercise}
                onSuccess={handleFormSuccess}
                onCancel={handleFormCancel}
                onValidityChange={setFormValid}
                onSubmittingChange={setFormSubmitting}
              />
            </div>
            <div className="shrink-0 flex gap-3 border-t border-border bg-surface px-6 py-4 sm:pb-4 pb-6">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1"
                form="exercise-form"
                disabled={!formValid || formSubmitting}
                loading={formSubmitting}
                aria-label={editingExercise ? "Update exercise" : "Create exercise"}
              >
                {editingExercise ? "Update Exercise" : "Create Exercise"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleFormCancel}
              >
                Cancel
              </Button>
            </div>
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
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleConfirmDelete}
                aria-label={`Delete ${deleteConfirm.name}`}
              >
                Delete
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}
