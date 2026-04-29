"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Routine, RoutineFolder } from "@/db/schema";
import { createBrowserClient } from "@/db/client";

interface RoutineWithCount extends Routine {
  exercise_count: number;
}

interface FolderGroup {
  folder: RoutineFolder | null; // null = "Unfiled"
  routines: RoutineWithCount[];
  isExpanded: boolean;
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<RoutineWithCount[]>([]);
  const [folders, setFolders] = useState<RoutineFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFolderPanel, setShowFolderPanel] = useState(false);

  // Folder management state
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  const [savingFolder, setSavingFolder] = useState(false);

  // Collapsed folder state
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchData() {
      const supabase = createBrowserClient();

      // Fetch folders
      const { data: foldersData } = await supabase
        .from("routine_folders")
        .select("*")
        .order("name");
      setFolders(foldersData as RoutineFolder[] ?? []);

      // Fetch routines
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error fetching routines:", error);
        setLoading(false);
        return;
      }

      const routinesWithCount = await Promise.all(
        (data as Routine[] ?? []).map(async (routine) => {
          const { count } = await supabase
            .from("routine_exercises")
            .select("*", { count: "exact", head: true })
            .eq("routine_id", routine.id);

          return {
            ...routine,
            exercise_count: count ?? 0,
          };
        })
      );

      setRoutines(routinesWithCount);
      setLoading(false);
    }

    fetchData();
  }, []);

  function toggleFolder(folderId: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;

    setSavingFolder(true);
    const supabase = createBrowserClient();

    try {
      const { data, error } = await supabase
        .from("routine_folders")
        .insert({
          name: newFolderName.trim(),
          parent_id: newFolderParentId || null,
        } as never)
        .select("*")
        .single();

      if (error) throw error;

      setFolders((prev) => [...prev, data as RoutineFolder]);
      setNewFolderName("");
      setNewFolderParentId("");
    } catch (err) {
      console.error("Error creating folder:", err);
    } finally {
      setSavingFolder(false);
    }
  }

  async function renameFolder(id: string, newName: string) {
    if (!newName.trim()) return;

    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("routine_folders")
      .update({ name: newName.trim() } as never)
      .eq("id", id);

    if (error) {
      console.error("Error renaming folder:", error);
    } else {
      setFolders((prev) => prev.map((f) => (f.id === id ? { ...f, name: newName.trim() } : f)));
      setEditingFolderId(null);
    }
  }

  async function deleteFolder(id: string) {
    if (!confirm("Delete this folder? Routines will be moved to 'Unfiled'.")) return;

    const supabase = createBrowserClient();

    try {
      // Reassign routines to unfiled
      await supabase.from("routines").update({ folder_id: null } as never).eq("folder_id", id);

      // Delete folder
      const { error } = await supabase.from("routine_folders").delete().eq("id", id);
      if (error) throw error;

      setFolders((prev) => prev.filter((f) => f.id !== id));

      // Refresh routines to reflect folder changes
      const { data } = await supabase.from("routines").select("*").order("updated_at", { ascending: false });
      const routinesWithCount = await Promise.all(
        (data as Routine[] ?? []).map(async (routine) => {
          const { count } = await supabase
            .from("routine_exercises")
            .select("*", { count: "exact", head: true })
            .eq("routine_id", routine.id);
          return { ...routine, exercise_count: count ?? 0 };
        })
      );
      setRoutines(routinesWithCount);
    } catch (err) {
      console.error("Error deleting folder:", err);
    }
  }

  // Build folder groups
  function buildFolderGroups(): FolderGroup[] {
    const folderMap = new Map<string | null, RoutineWithCount[]>();
    folderMap.set(null, []);
    folders.forEach((f) => folderMap.set(f.id, []));

    routines.forEach((r) => {
      const key = r.folder_id;
      const group = folderMap.get(key);
      if (group) {
        group.push(r);
      } else {
        folderMap.get(null)!.push(r);
      }
    });

    const groups: FolderGroup[] = [];

    // Add folders with routines (sorted alphabetically)
    const folderGroups = folders
      .filter((f) => (folderMap.get(f.id)?.length ?? 0) > 0)
      .sort((a, b) => a.name.localeCompare(b.name));

    folderGroups.forEach((folder) => {
      groups.push({
        folder,
        routines: folderMap.get(folder.id) ?? [],
        isExpanded: !collapsedFolders.has(folder.id),
      });
    });

    // Add unfiled at the bottom if there are any
    const unfiled = folderMap.get(null) ?? [];
    if (unfiled.length > 0) {
      groups.push({
        folder: null,
        routines: unfiled,
        isExpanded: !collapsedFolders.has("__unfiled__"),
      });
    }

    return groups;
  }

  function getFolderIndent(folder: RoutineFolder): number {
    let level = 0;
    let current = folder;
    while (current.parent_id) {
      level++;
      const parent = folders.find((f) => f.id === current.parent_id);
      if (!parent) break;
      current = parent;
    }
    return level;
  }

  if (loading) {
    return (
      <div className="py-12 text-center">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Routines</h1>
            <p className="text-sm text-muted mt-1">Loading your workout templates...</p>
          </div>
        </div>
        <div className="py-12 text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  const folderGroups = buildFolderGroups();

  return (
    <div className="py-4 page-container">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Routines</h1>
          <p className="text-sm text-muted mt-1">{routines.length} workout templates</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFolderPanel(!showFolderPanel)}
            className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Manage Folders
          </button>
          <Link
            href="/routines/new"
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] shrink-0 shadow-lg shadow-primary/25"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Routine
          </Link>
        </div>
      </div>

      {/* Folder Management Panel */}
      {showFolderPanel && (
        <div className="mb-6 rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-lg font-bold mb-4">Manage Folders</h2>

          {/* Existing folders */}
          {folders.length > 0 && (
            <div className="mb-4 space-y-2">
              {folders.map((folder) => {
                const indent = getFolderIndent(folder);
                return (
                  <div
                    key={folder.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2"
                    style={{ marginLeft: `${indent * 1}rem` }}
                  >
                    <svg className="h-4 w-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    {editingFolderId === folder.id ? (
                      <input
                        type="text"
                        value={editingFolderName}
                        onChange={(e) => setEditingFolderName(e.target.value)}
                        onBlur={() => renameFolder(folder.id, editingFolderName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameFolder(folder.id, editingFolderName);
                          if (e.key === "Escape") setEditingFolderId(null);
                        }}
                        className="flex-1 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="flex-1 text-sm cursor-pointer hover:text-primary"
                        onClick={() => {
                          setEditingFolderId(folder.id);
                          setEditingFolderName(folder.name);
                        }}
                      >
                        {folder.name}
                      </span>
                    )}
                    <button
                      onClick={() => deleteFolder(folder.id)}
                      className="rounded p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* New folder form */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="New folder name"
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <select
              value={newFolderParentId}
              onChange={(e) => setNewFolderParentId(e.target.value)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">No parent</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {"  ".repeat(getFolderIndent(f))}↳ {f.name}
                </option>
              ))}
            </select>
            <button
              onClick={createFolder}
              disabled={savingFolder || !newFolderName.trim()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Routines grouped by folder */}
      {routines.length === 0 ? (
        <div className="py-16 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-light/30 mb-4">
            <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-1">No routines yet</h2>
          <p className="text-sm text-muted mb-4">
            Create your first workout template to get started faster.
          </p>
          <Link
            href="/routines/new"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Create Routine
          </Link>
        </div>
      ) : folderGroups.length === 0 ? (
        <div className="space-y-4">
          {routines.map((routine, index) => (
            <RoutineCard key={routine.id} routine={routine} index={index} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {folderGroups.map((group) => (
            <div key={group.folder?.id ?? "__unfiled__"}>
              {/* Folder header */}
              <button
                onClick={() => toggleFolder(group.folder?.id ?? "__unfiled__")}
                className="flex items-center gap-2 mb-3 w-full text-left"
              >
                <svg className="h-4 w-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  {group.isExpanded ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  )}
                </svg>
                <svg className="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="font-semibold text-foreground">
                  {group.folder ? group.folder.name : "Unfiled"}
                </span>
                <span className="text-xs text-muted">({group.routines.length} routines)</span>
              </button>

              {/* Routines in folder */}
              {group.isExpanded && (
                <div className="space-y-3" style={{ marginLeft: group.folder ? `${getFolderIndent(group.folder) * 1}rem` : "0" }}>
                  {group.routines.map((routine, index) => (
                    <RoutineCard key={routine.id} routine={routine} index={index} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoutineCard({ routine, index }: { routine: RoutineWithCount; index: number }) {
  return (
    <Link
      href={`/routines/${routine.id}`}
      className="group block rounded-2xl border border-border bg-surface p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-light/50 dark:bg-accent-light/30">
            <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{routine.name}</h3>
            {routine.description && (
              <p className="mt-1 text-sm text-muted line-clamp-2">{routine.description}</p>
            )}
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-light/50 px-2.5 py-1 text-[11px] font-bold text-primary">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                {routine.exercise_count} exercises
              </span>
              <span className="text-xs text-muted">
                Updated {new Date(routine.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-all group-hover:opacity-100">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
