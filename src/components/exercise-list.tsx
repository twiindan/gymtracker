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
      <div className="py-12 text-center text-zinc-500">
        No exercises found. Try adjusting your search or filters.
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
    <div className="space-y-8">
      {sortedGroups.map((group) => (
        <section key={group}>
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {group}{" "}
            <span className="text-sm font-normal text-zinc-500">
              ({grouped[group].length})
            </span>
          </h2>
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
