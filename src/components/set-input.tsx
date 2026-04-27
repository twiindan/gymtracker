"use client";

import type { ActiveSet, TrackingType } from "@/db/schema";

interface SetInputProps {
  set: ActiveSet;
  trackingType: TrackingType;
  onUpdate: (set: ActiveSet) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  isLast: boolean;
}

export function SetInput({
  set,
  trackingType,
  onUpdate,
  onDuplicate,
  onDelete,
  isLast,
}: SetInputProps) {
  const showWeight = trackingType === "reps";
  const showReps = trackingType === "reps" || trackingType === "bodyweight";
  const showDuration = trackingType === "duration";
  const showDistance = trackingType === "distance";

  return (
    <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Set number badge */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-sm font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {set.set_number}
      </div>

      {/* Weight input */}
      {showWeight && (
        <div className="flex-1">
          <label className="sr-only">Weight (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="kg"
            value={set.weight ?? ""}
            onChange={(e) =>
              onUpdate({
                ...set,
                weight: e.target.value === "" ? null : parseFloat(e.target.value),
              })
            }
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-center text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
            min={0}
            step={0.5}
          />
        </div>
      )}

      {/* Reps input */}
      {showReps && (
        <div className="flex-1">
          <label className="sr-only">Reps</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="reps"
            value={set.reps ?? ""}
            onChange={(e) =>
              onUpdate({
                ...set,
                reps: e.target.value === "" ? null : parseInt(e.target.value, 10),
              })
            }
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-center text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
            min={0}
            step={1}
          />
        </div>
      )}

      {/* Duration input */}
      {showDuration && (
        <div className="flex-1">
          <label className="sr-only">Duration (seconds)</label>
          <input
            type="number"
            inputMode="numeric"
            placeholder="sec"
            value={set.reps ?? ""}
            onChange={(e) =>
              onUpdate({
                ...set,
                reps: e.target.value === "" ? null : parseInt(e.target.value, 10),
              })
            }
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-center text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
            min={0}
            step={1}
          />
        </div>
      )}

      {/* Distance input */}
      {showDistance && (
        <div className="flex-1">
          <label className="sr-only">Distance (meters)</label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="m"
            value={set.weight ?? ""}
            onChange={(e) =>
              onUpdate({
                ...set,
                weight: e.target.value === "" ? null : parseFloat(e.target.value),
              })
            }
            className="w-full rounded-md border border-zinc-200 px-3 py-2 text-center text-base outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
            min={0}
            step={0.1}
          />
        </div>
      )}

      {/* Duplicate button (only on last set) */}
      {isLast && (
        <button
          onClick={onDuplicate}
          className="shrink-0 rounded-md bg-zinc-100 p-2 text-zinc-600 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
          title="Duplicate set"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
          </svg>
        </button>
      )}

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="shrink-0 rounded-md p-2 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900"
        title="Delete set"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}
