"use client";

import { useState, useEffect } from "react";
import { MUSCLE_GROUPS, EQUIPMENT_TYPES, type TrackingType, type Exercise } from "@/db/schema";
import { createBrowserClient } from "@/db/client";

interface CustomExerciseFormProps {
  exercise?: Exercise;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CustomExerciseForm({ exercise, onSuccess, onCancel }: CustomExerciseFormProps) {
  const isEditing = !!exercise;
  const [name, setName] = useState(exercise?.name ?? "");
  const [primaryMuscle, setPrimaryMuscle] = useState(exercise?.primary_muscle_group ?? "");
  const [secondaryMuscles, setSecondaryMuscles] = useState<string[]>(exercise?.secondary_muscle_groups ?? []);
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "");
  const [trackingType, setTrackingType] = useState<TrackingType>(exercise?.tracking_type ?? "reps");
  const [description, setDescription] = useState(exercise?.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [name, primaryMuscle, trackingType]);

  const isValid = name.trim().length >= 2 && primaryMuscle && trackingType;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError(null);

    const supabase = createBrowserClient();

    // Check for duplicate name
    if (!isEditing || name !== exercise?.name) {
      const { data: existing } = await supabase
        .from("exercises")
        .select("id")
        .eq("name", name.trim())
        .maybeSingle();

      if (existing) {
        setError("An exercise with this name already exists.");
        setSubmitting(false);
        return;
      }
    }

    const payload = {
      name: name.trim(),
      primary_muscle_group: primaryMuscle,
      secondary_muscle_groups: secondaryMuscles,
      equipment: equipment || null,
      tracking_type: trackingType,
      description: description || null,
      is_custom: true,
      is_active: true,
    };

    if (isEditing && exercise) {
      const { error: updateError } = await supabase
        .from("exercises")
        .update(payload as never)
        .eq("id", exercise.id)
        .eq("is_custom", true);

      if (updateError) {
        setError(updateError.message);
        setSubmitting(false);
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("exercises").insert(payload as never);

      if (insertError) {
        setError(insertError.message);
        setSubmitting(false);
        return;
      }
    }

    setSuccess(isEditing ? "Exercise updated successfully." : "Exercise created successfully.");
    setTimeout(() => {
      onSuccess();
    }, 800);
  }

  function toggleSecondaryMuscle(muscle: string) {
    setSecondaryMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900 dark:text-green-200">
          {success}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={50}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="e.g., Cable Crossover"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Primary Muscle Group <span className="text-red-500">*</span>
          </label>
          <select
            value={primaryMuscle}
            onChange={(e) => setPrimaryMuscle(e.target.value)}
            required
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">Select...</option>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Equipment
          </label>
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">None / Bodyweight</option>
            {EQUIPMENT_TYPES.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Secondary Muscle Groups
        </label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                secondaryMuscles.includes(m)
                  ? "bg-zinc-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={secondaryMuscles.includes(m)}
                onChange={() => toggleSecondaryMuscle(m)}
              />
              {m}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tracking Type <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {(["reps", "duration", "distance", "bodyweight"] as TrackingType[]).map((type) => (
            <label
              key={type}
              className={`cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                trackingType === type
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              <input
                type="radio"
                name="trackingType"
                value={type}
                checked={trackingType === type}
                onChange={() => setTrackingType(type)}
                className="sr-only"
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Optional description..."
        />
        <div className="mt-1 text-right text-xs text-zinc-400">{description.length}/500</div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {submitting ? "Saving..." : isEditing ? "Update Exercise" : "Create Exercise"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
