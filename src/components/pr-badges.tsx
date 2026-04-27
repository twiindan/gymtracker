import type { ExercisePRs } from "@/lib/pr-calculator";
import { formatPRValue, formatPRContext, formatPRDate } from "@/lib/pr-calculator";

interface PRBadgesProps {
  prs: ExercisePRs;
}

export function PRBadges({ prs }: PRBadgesProps) {
  const badges = [
    {
      label: "Max Weight",
      type: "weight" as const,
      pr: prs.max_weight,
      color: "bg-amber-50 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      ),
    },
    {
      label: "Max Reps",
      type: "reps" as const,
      pr: prs.max_reps,
      color: "bg-sky-50 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
        </svg>
      ),
    },
    {
      label: "Max Volume",
      type: "volume" as const,
      pr: prs.max_volume,
      color: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
    {
      label: "Est. 1RM",
      type: "1rm" as const,
      pr: prs.estimated_1rm,
      color: "bg-violet-50 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {badges.map((badge) => (
        <div
          key={badge.type}
          className={`rounded-xl p-4 ${badge.color}`}
        >
          <div className="mb-2 flex items-center gap-2">
            {badge.icon}
            <span className="text-xs font-medium opacity-80">{badge.label}</span>
          </div>
          <div className="text-xl font-bold">
            {formatPRValue(badge.pr, badge.type)}
          </div>
          <div className="mt-0.5 text-xs opacity-70">
            {formatPRContext(badge.pr, badge.type)}
          </div>
          {badge.pr && (
            <div className="mt-1 text-[10px] opacity-50">
              {formatPRDate(badge.pr.date)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
