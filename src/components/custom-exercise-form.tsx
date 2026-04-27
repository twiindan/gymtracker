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

    setSuccess(isEditing ? "Exercise updated successfully!" : "Exercise created successfully!");
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger border border-danger/20">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl bg-success/10 px-4 py-3 text-sm text-success border border-success/20">
          {success}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-foreground">
          Exercise Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          minLength={2}
          maxLength={50}
          required
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-surface-elevated"
          placeholder="e.g., Cable Crossover"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            Primary Muscle <span className="text-danger">*</span>
          </label>
          <select
            value={primaryMuscle}
            onChange={(e) => setPrimaryMuscle(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-surface-elevated"
          >
            <option value="">Select muscle group...</option>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">
            Equipment
          </label>
          <select
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:bg-surface-elevated"
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
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Secondary Muscle Groups
        </label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                secondaryMuscles.includes(m)
                  ? "bg-primary text-white shadow-sm"
                  : "bg-primary-light/50 text-primary hover:bg-primary-light dark:bg-primary-light/20 dark:hover:bg-primary-light/30"
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
        <label className="mb-2 block text-sm font-semibold text-foreground">
          Tracking Type <span className="text-danger">*</span>
        </label>
        <div className="flex flex-wrap gap-3">
          {(["reps", "duration", "distance", "bodyweight"] as TrackingType[]).map((type) => (
            <label
              key={type}
              className={`cursor-pointer rounded-xl border px-5 py-2.5 text-sm font-medium transition-all ${
                trackingType === type
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-border bg-surface text-muted hover:border-primary/50 hover:bg-primary-light/30 dark:bg-surface-elevated"
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
        <label className="mb-1.5 block text-sm font-semibold text-foreground">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none dark:bg-surface-elevated"
          placeholder="Optional description or notes..."
        />
        <div className="mt-1 text-right text-xs text-muted">{description.length}/500</div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!isValid || submitting}
          className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : isEditing ? (
            "Update Exercise"
          ) : (
            "Create Exercise"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-muted transition-all hover:bg-surface-elevated hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
