export default function CommandCenterLoading() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-6 md:space-y-8 p-4 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 bg-zinc-800 rounded-md animate-pulse" />
            <div className="h-4 w-64 bg-zinc-800/50 rounded-md animate-pulse" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-3">
              <div className="h-3 w-16 bg-zinc-800 rounded animate-pulse" />
              <div className="h-8 w-20 bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-12 bg-zinc-800/50 rounded animate-pulse" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-4">
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1.5">
                  <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
                  <div className="h-4 w-40 bg-zinc-800/50 rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-zinc-800 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-3">
            <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-lg border border-zinc-800/60 bg-zinc-900/20 p-3">
                <div className="h-4 w-full bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-full bg-zinc-800/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-3">
          <div className="h-4 w-24 bg-zinc-800 rounded animate-pulse" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
              <div className="h-4 flex-1 bg-zinc-800 rounded animate-pulse" />
              <div className="h-3 w-12 bg-zinc-800/50 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
