import React from "react";
import type { Exercise } from "@/db/schema";

interface ExerciseCardProps {
  exercise: Exercise;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const muscleConfig: Record<string, { bg: string; text: string; icon: string }> = {
  Chest: { bg: "bg-rose-500", text: "text-rose-600", icon: "text-rose-500" },
  Back: { bg: "bg-emerald-500", text: "text-emerald-600", icon: "text-emerald-500" },
  Shoulders: { bg: "bg-sky-500", text: "text-sky-600", icon: "text-sky-500" },
  Biceps: { bg: "bg-amber-500", text: "text-amber-600", icon: "text-amber-500" },
  Triceps: { bg: "bg-violet-500", text: "text-violet-600", icon: "text-violet-500" },
  Quadriceps: { bg: "bg-orange-500", text: "text-orange-600", icon: "text-orange-500" },
  Hamstrings: { bg: "bg-teal-500", text: "text-teal-600", icon: "text-teal-500" },
  Glutes: { bg: "bg-pink-500", text: "text-pink-600", icon: "text-pink-500" },
  Calves: { bg: "bg-lime-500", text: "text-lime-600", icon: "text-lime-500" },
  Abs: { bg: "bg-cyan-500", text: "text-cyan-600", icon: "text-cyan-500" },
  Forearms: { bg: "bg-stone-500", text: "text-stone-600", icon: "text-stone-500" },
  Traps: { bg: "bg-indigo-500", text: "text-indigo-600", icon: "text-indigo-500" },
  Lats: { bg: "bg-green-500", text: "text-green-600", icon: "text-green-500" },
  "Lower Back": { bg: "bg-yellow-500", text: "text-yellow-600", icon: "text-yellow-500" },
  "Full Body": { bg: "bg-red-500", text: "text-red-600", icon: "text-red-500" },
  Cardio: { bg: "bg-blue-500", text: "text-blue-600", icon: "text-blue-500" },
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
    <span className="inline-flex items-center gap-1 text-xs text-muted" title={`Tracking: ${type}`}>
      {icons[type]}
      <span className="capitalize">{type}</span>
    </span>
  );
}

export function ExerciseCard({ exercise, onClick, onEdit, onDelete }: ExerciseCardProps) {
  const config = muscleConfig[exercise.primary_muscle_group] ?? { bg: "bg-zinc-500", text: "text-zinc-600", icon: "text-zinc-500" };

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.bg} text-white shadow-sm`}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm text-foreground truncate">{exercise.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${config.text} bg-current/10`}>
                {exercise.primary_muscle_group}
              </span>
              {exercise.is_custom && (
                <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-600">
                  Custom
                </span>
              )}
            </div>
          </div>
        </div>
        <svg className="h-4 w-4 text-muted/50 shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
      
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        {exercise.equipment && (
          <span className="text-xs text-muted flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </svg>
            {exercise.equipment}
          </span>
        )}
        <TrackingIcon type={exercise.tracking_type} />
      </div>
      
      {exercise.secondary_muscle_groups.length > 0 && (
        <div className="mt-2 text-[11px] text-muted/70">
          Also targets: {exercise.secondary_muscle_groups.join(", ")}
        </div>
      )}
      
      {exercise.is_custom && (onEdit || onDelete) && (
        <div className="mt-3 flex gap-2 pt-2 border-t border-border/50">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted transition-all hover:bg-primary-light/50 hover:text-primary"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-danger transition-all hover:bg-danger/10"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}
    </>
  );

  const cardClasses = "group w-full rounded-xl border border-border bg-surface p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cardClasses}
        aria-label={`Select ${exercise.name}`}
      >
        {content}
      </button>
    );
  }

  return (
    <a
      href={`/exercises/${exercise.id}`}
      className={cardClasses + " block"}
    >
      {content}
    </a>
  );
}
