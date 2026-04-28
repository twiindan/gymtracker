"use client";

import { useState } from "react";
import { generateCalendarGrid, getHeatmapColor } from "@/lib/calendar-utils";

interface CalendarHeatmapProps {
  dateCounts: Map<string, number>;
}

const CELL_SIZE = 12;
const CELL_GAP = 3;
const BORDER_RADIUS = 2;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export function CalendarHeatmap({ dateCounts }: CalendarHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    date: string;
    count: number;
  } | null>(null);

  const { weeks } = generateCalendarGrid(365);

  const svgWidth = weeks.length * (CELL_SIZE + CELL_GAP);
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP);

  // Check if all counts are zero (empty state)
  const hasAnyWorkouts = Array.from(dateCounts.values()).some(
    (count) => count > 0
  );

  // Format tooltip date
  function formatTooltipDate(dateStr: string): string {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  // Build month labels: find the first week that contains a new month
  function getMonthLabels() {
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;

    weeks.forEach((week, weekIndex) => {
      if (week.length === 0) return;
      const firstDay = week[0];
      const month = new Date(firstDay.date + "T00:00:00").getMonth();
      if (month !== lastMonth) {
        labels.push({ weekIndex, label: MONTH_LABELS[month] });
        lastMonth = month;
      }
    });

    return labels;
  }

  const monthLabels = getMonthLabels();

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: "touch" }}>
        <div className="pb-2" style={{ minWidth: svgWidth + 40 }}>
          {/* Month labels row */}
          <div className="relative mb-1 ml-8" style={{ height: 14 }}>
            {monthLabels.map(({ weekIndex, label }) => (
              <span
                key={weekIndex}
                className="absolute text-[10px] text-muted"
                style={{
                  left: weekIndex * (CELL_SIZE + CELL_GAP),
                }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* SVG heatmap */}
          <div className="flex">
            {/* Day labels */}
            <div className="mr-2 flex flex-col justify-between py-0.5" style={{ height: svgHeight }}>
              {DAY_LABELS.map((label, i) => (
                <div
                  key={i}
                  className="flex h-[15px] items-center text-[10px] text-muted"
                >
                  {label}
                </div>
              ))}
            </div>

            <svg width={svgWidth} height={svgHeight}>
              {weeks.map((week, weekIndex) =>
                week.map((day) => {
                  const count = dateCounts.get(day.date) ?? 0;
                  const fill = getHeatmapColor(count);
                  const x = weekIndex * (CELL_SIZE + CELL_GAP);
                  const y = day.dayOfWeek * (CELL_SIZE + CELL_GAP);

                  return (
                    <rect
                      key={day.date}
                      x={x}
                      y={y}
                      width={CELL_SIZE}
                      height={CELL_SIZE}
                      rx={BORDER_RADIUS}
                      ry={BORDER_RADIUS}
                      fill={fill}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={() =>
                        setHoveredCell({ date: day.date, count })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      <title>
                        {formatTooltipDate(day.date)}:{" "}
                        {count === 0
                          ? "No workouts"
                          : `${count} workout${count > 1 ? "s" : ""}`}
                      </title>
                    </rect>
                  );
                })
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="mt-2 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs text-foreground">
          <span className="font-medium">
            {formatTooltipDate(hoveredCell.date)}
          </span>
          {": "}
          {hoveredCell.count === 0
            ? "No workouts"
            : `${hoveredCell.count} workout${hoveredCell.count > 1 ? "s" : ""}`}
        </div>
      )}

      {/* Empty state message */}
      {!hasAnyWorkouts && (
        <div className="mt-4 rounded-xl border-2 border-dashed border-border py-6 text-center">
          <div className="mb-2 text-2xl">📅</div>
          <p className="text-sm text-muted">
            Start logging workouts to see your consistency streak!
          </p>
        </div>
      )}
    </div>
  );
}
