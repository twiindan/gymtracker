"use client";

import { useState, useEffect, useRef } from "react";

interface ExerciseSearchProps {
  onSearch: (query: string) => void;
  resultCount: number;
}

export function ExerciseSearch({ onSearch, resultCount }: ExerciseSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const isFirstMount = useRef(true);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // Only call onSearch when debounced query changes (not on initial mount with empty string)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    onSearch(debouncedQuery);
  }, [debouncedQuery, onSearch]);

  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 shadow-sm">
        <svg
          className="h-5 w-5 shrink-0 text-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search exercises..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted/60 text-foreground"
          aria-label="Search exercises"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-lg p-1 text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {query && (
        <div className="mt-2 text-xs text-muted font-medium">
          {resultCount} result{resultCount !== 1 ? "s" : ""} found
        </div>
      )}
    </div>
  );
}
