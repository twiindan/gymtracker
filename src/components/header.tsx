import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          GymTracker
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/workouts"
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Workouts
          </Link>
          <Link
            href="/routines"
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Routines
          </Link>
          <Link
            href="/exercises"
            className="text-zinc-600 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Exercises
          </Link>
        </nav>
      </div>
    </header>
  );
}
