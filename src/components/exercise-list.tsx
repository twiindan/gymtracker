import type { Exercise } from "@/db/schema";
import { ExerciseCard } from "./exercise-card";

interface ExerciseListProps {
  exercises: Exercise[];
  searchActive: boolean;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (exercise: Exercise) => void;
}

export function ExerciseList({ exercises, searchActive, onEdit, onDelete }: ExerciseListProps) {
  if (exercises.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light/30 mb-4">
          <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No exercises found</h3>
        <p className="text-sm text-muted">Try adjusting your search or filters.</p>
      </div>
    );
  }

  if (searchActive) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            onEdit={onEdit ? () => onEdit(exercise) : undefined}
            onDelete={onDelete ? () => onDelete(exercise) : undefined}
          />
        ))}
      </div>
    );
  }

  // Group by primary muscle group when not searching
  const grouped = exercises.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const group = ex.primary_muscle_group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(ex);
    return acc;
  }, {});

  const sortedGroups = Object.keys(grouped).sort();

  return (
    <div className="space-y-10">
      {sortedGroups.map((group) => (
        <section key={group} className="animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-foreground">{group}</h2>
            <span className="rounded-full bg-surface-elevated border border-border px-3 py-0.5 text-xs font-semibold text-muted">
              {grouped[group].length}
            </span>
            <div className="flex-1 h-px bg-border/50"></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {grouped[group].map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onEdit={onEdit ? () => onEdit(exercise) : undefined}
                onDelete={onDelete ? () => onDelete(exercise) : undefined}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
