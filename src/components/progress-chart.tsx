"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ChartDataPoint {
  date: string;
  weight: number | null;
  volume: number | null;
  estimated_1rm: number | null;
}

interface ProgressChartProps {
  data: ChartDataPoint[];
}

export function ProgressChart({ data }: ProgressChartProps) {
  const [visibleLines, setVisibleLines] = useState({
    weight: true,
    volume: false,
    estimated_1rm: true,
  });

  if (data.length < 2) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 py-12 text-center text-zinc-500 dark:border-zinc-700">
        <div className="mb-2 text-3xl">📈</div>
        <p>Log more workouts to see your progress chart!</p>
        <p className="mt-1 text-sm">At least 2 workouts needed for a chart.</p>
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const toggleLine = (line: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({ ...prev, [line]: !prev[line] }));
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      {/* Toggle buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => toggleLine("weight")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            visibleLines.weight
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          Weight
        </button>
        <button
          onClick={() => toggleLine("estimated_1rm")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            visibleLines.estimated_1rm
              ? "bg-violet-600 text-white"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          Est. 1RM
        </button>
        <button
          onClick={() => toggleLine("volume")}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            visibleLines.volume
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          Volume
        </button>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#a1a1aa" />
          <YAxis tick={{ fontSize: 12 }} stroke="#a1a1aa" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e4e4e7",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value) => [`${Math.round(Number(value))} kg`, ""]}
          />
          <Legend wrapperStyle={{ fontSize: "12px" }} />
          {visibleLines.weight && (
            <Line
              type="monotone"
              dataKey="weight"
              name="Max Weight (kg)"
              stroke="#18181b"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          )}
          {visibleLines.estimated_1rm && (
            <Line
              type="monotone"
              dataKey="estimated_1rm"
              name="Est. 1RM (kg)"
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3 }}
              connectNulls={false}
            />
          )}
          {visibleLines.volume && (
            <Line
              type="monotone"
              dataKey="volume"
              name="Total Volume (kg)"
              stroke="#059669"
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
