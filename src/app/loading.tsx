export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-32"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-48"></div>
        <div className="space-y-2 mt-6">
          <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
          <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
          <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
