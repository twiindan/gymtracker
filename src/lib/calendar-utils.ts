import { createBrowserClient } from "@/db/client";

export interface CalendarGridDay {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0=Sunday, 6=Saturday
}

export interface CalendarGridResult {
  weeks: CalendarGridDay[][];
  startDate: Date;
  endDate: Date;
}

/**
 * Generate a 2D grid of days for the calendar heatmap.
 * Aligns the start date to the previous Sunday.
 * Uses toISOString().slice(0, 10) for consistent YYYY-MM-DD keys.
 */
export function generateCalendarGrid(days: number = 365): CalendarGridResult {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Align to previous Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const weeks: CalendarGridDay[][] = [];
  let currentWeek: CalendarGridDay[] = [];

  const current = new Date(startDate);
  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10);
    currentWeek.push({
      date: dateStr,
      dayOfWeek: current.getDay(),
    });

    if (current.getDay() === 6) {
      // Saturday — close this week
      weeks.push(currentWeek);
      currentWeek = [];
    }

    current.setDate(current.getDate() + 1);
  }

  // Push any remaining days in the last partial week
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return { weeks, startDate, endDate };
}

/**
 * Return a CSS variable string for the heatmap color based on workout count.
 * 4-level discrete scale:
 *   0 → var(--border)
 *   1 → var(--primary-light)
 *   2-3 → var(--primary)
 *   4+ → var(--primary-dark)
 */
export function getHeatmapColor(count: number): string {
  if (count === 0) return "var(--border)";
  if (count === 1) return "var(--primary-light)";
  if (count <= 3) return "var(--primary)";
  return "var(--primary-dark)";
}

/**
 * Fetch workout data for the last N days and aggregate by date.
 * Single query — no N+1. Filters soft-deleted workouts.
 * Returns Map<string, number> where key = "YYYY-MM-DD", value = workout count.
 */
export async function fetchWorkoutCalendarData(
  days: number = 365
): Promise<Map<string, number>> {
  const supabase = createBrowserClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("workouts")
    .select("started_at")
    .is("deleted_at", null)
    .gte("started_at", startDate.toISOString());

  if (error) {
    throw error;
  }

  const dateCounts = new Map<string, number>();
  (data as { started_at: string }[] ?? []).forEach((w) => {
    const dateStr = new Date(w.started_at).toISOString().slice(0, 10);
    dateCounts.set(dateStr, (dateCounts.get(dateStr) ?? 0) + 1);
  });

  return dateCounts;
}

/**
 * Fetch scheduled workout dates for the last N days.
 * Returns Set<string> where each entry is a "YYYY-MM-DD" date string.
 */
export async function fetchScheduledWorkoutCalendarData(
  days: number = 365
): Promise<Set<string>> {
  const supabase = createBrowserClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from("scheduled_workouts")
    .select("scheduled_date")
    .gte("scheduled_date", startDate.toISOString().slice(0, 10));

  if (error) {
    throw error;
  }

  const scheduledDates = new Set<string>();
  (data as { scheduled_date: string }[] ?? []).forEach((s) => {
    scheduledDates.add(s.scheduled_date);
  });
  return scheduledDates;
}
