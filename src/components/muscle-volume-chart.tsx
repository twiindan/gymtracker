"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MuscleVolumeData } from "@/lib/muscle-volume-utils";

interface MuscleVolumeChartProps {
  data: MuscleVolumeData[];
  loading: boolean;
}

export function MuscleVolumeChart({ data, loading }: MuscleVolumeChartProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 w-20 rounded bg-border animate-pulse-slow" />
              <div
                className="h-6 rounded bg-border animate-pulse-slow"
                style={{ width: `${Math.random() * 60 + 20}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted">
          No muscle group data for this time period. Log more workouts!
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <ResponsiveContainer
        width="100%"
        height={Math.max(300, data.length * 40)}
      >
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="var(--muted)" />
          <YAxis
            type="category"
            dataKey="muscle_group"
            tick={{ fontSize: 12 }}
            stroke="var(--muted)"
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: unknown, name: unknown) => {
              const num = typeof value === "number" ? value : Number(value ?? 0);
              const label = typeof name === "string" ? name : String(name ?? "");
              if (label === "total_sets") return [`${num} sets`, "Sets"];
              return [`${Math.round(num)} kg`, "Volume"];
            }}
          />
          <Bar
            dataKey="total_sets"
            fill="var(--primary)"
            radius={[0, 4, 4, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
