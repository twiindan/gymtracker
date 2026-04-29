"use client";

import { useState } from "react";
import { fetchAllExportData, buildJsonExport, buildCsvExport, downloadFile } from "@/lib/export-utils";

export default function SettingsPage() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async (format: "json" | "csv") => {
    setExporting(true);
    setError(null);

    try {
      const data = await fetchAllExportData();
      const date = new Date().toISOString().split("T")[0];

      if (format === "json") {
        const content = buildJsonExport(data);
        downloadFile(content, `gymtracker-export-${date}.json`, "application/json");
      } else {
        const content = buildCsvExport(data);
        downloadFile(content, `gymtracker-export-${date}.csv`, "text/csv");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-4 space-y-8">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <svg
            className="h-5 w-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
        <p className="text-sm text-muted">
          Export your GymTracker data for backup or analysis.
        </p>
      </div>

      {/* Data Export Section */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 text-lg font-semibold">Data Export</h2>
        <p className="mb-6 text-sm text-muted">
          Download all your workout data in your preferred format.
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleExport("json")}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {exporting ? (
              <>
                <SpinnerIcon />
                Exporting...
              </>
            ) : (
              <>
                <JsonIcon />
                Export JSON
              </>
            )}
          </button>

          <button
            onClick={() => handleExport("csv")}
            disabled={exporting}
            className="flex items-center gap-2 rounded-lg border border-border bg-transparent px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800"
          >
            {exporting ? (
              <>
                <SpinnerIcon />
                Exporting...
              </>
            ) : (
              <>
                <CsvIcon />
                Export CSV
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function JsonIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function CsvIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5m-19.5 0v1.5" />
    </svg>
  );
}
