"use client";

import { useState, useEffect, useRef } from "react";

interface ExerciseSearchProps {
  onSearch: (query: string) => void;
  resultCount: number;
}

export function ExerciseSearch({ onSearch, resultCount }: ExerciseSearchProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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
      <div 
        className={`flex items-center gap-3 rounded-2xl border bg-surface px-5 py-4 transition-all duration-200 ${
          isFocused 
            ? "border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20" 
            : "border-border shadow-sm hover:border-primary/50"
        }`}
      >
        <svg
          className={`h-5 w-5 shrink-0 transition-colors ${isFocused ? 'text-primary' : 'text-muted'}`}
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
          placeholder="Search exercises by name or muscle group..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted/50 text-foreground"
          aria-label="Search exercises"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {query && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted font-medium">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {resultCount} result{resultCount !== 1 ? "s" : ""} found
        </div>
      )}
    </div>
  );
}
