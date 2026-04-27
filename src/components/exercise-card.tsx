import React from "react";
import type { Exercise } from "@/db/schema";

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const muscleColors: Record<string, string> = {
  Chest: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
  Back: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  Shoulders: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  Biceps: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Triceps: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
  Quadriceps: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  Hamstrings: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  Glutes: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  Calves: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  Abs: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  Forearms: "bg-stone-100 text-stone-800 dark:bg-stone-700 dark:text-stone-200",
  Traps: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  Lats: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  "Lower Back": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  "Full Body": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Cardio: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
};

function TrackingIcon({ type }: { type: Exercise["tracking_type"] }) {
  if (type === "reps") return null;

  const icons: Record<string, React.ReactElement> = {
    duration: (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    distance: (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    bodyweight: (
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  };

  return (
    <span className="inline-flex items-center gap-1 text-xs text-zinc-500" title={`Tracking: ${type}`}>
      {icons[type]}
      <span className="capitalize">{type}</span>
    </span>
  );
}

export function ExerciseCard({ exercise, onClick, onEdit, onDelete }: ExerciseCardProps) {
  const muscleClass = muscleColors[exercise.primary_muscle_group] ?? "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200";

  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{exercise.name}</h3>
        {exercise.is_custom && (
          <span className="shrink-0 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-800 dark:bg-purple-900 dark:text-purple-200">
            Custom
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${muscleClass}`}>
          {exercise.primary_muscle_group}
        </span>
        {exercise.equipment && (
          <span className="text-xs text-zinc-500">{exercise.equipment}</span>
        )}
        <TrackingIcon type={exercise.tracking_type} />
      </div>
      {exercise.secondary_muscle_groups.length > 0 && (
        <div className="mt-1.5 text-xs text-zinc-400">
          Also: {exercise.secondary_muscle_groups.join(", ")}
        </div>
      )}
      {exercise.is_custom && (onEdit || onDelete) && (
        <div className="mt-3 flex gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="rounded px-2 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="w-full rounded-lg border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
        aria-label={`Select ${exercise.name}`}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={`/exercises/${exercise.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:bg-zinc-800"
    >
      {content}
    </a>
  );
}
