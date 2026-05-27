export function AdminLoadingSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <main className="admin-shell">
      <div className="admin-container space-y-6">
        <div className="admin-panel animate-pulse space-y-3">
          <div className="h-4 w-24 rounded bg-[#eaded3]" />
          <div className="h-8 w-56 rounded bg-[#eaded3]" />
          <div className="h-4 w-96 max-w-full rounded bg-[#efe4da]" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="admin-metric animate-pulse">
              <div className="h-3 w-24 rounded bg-[#eaded3]" />
              <div className="mt-3 h-8 w-16 rounded bg-[#e8ddd2]" />
            </div>
          ))}
        </div>

        <div className="admin-panel animate-pulse space-y-4">
          <div className="grid gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-20 rounded-xl bg-[#f3eae1]" />
            ))}
          </div>
          <div className="flex justify-end">
            <div className="h-10 w-36 rounded-md bg-[#eaded3]" />
          </div>
        </div>

        <div className="admin-surface animate-pulse">
          <div className="h-14 border-b border-[#eaded3] bg-[#f6f7f7]" />
          <div className="space-y-3 p-4">
            {Array.from({ length: rows }).map((_, index) => (
              <div key={index} className="grid gap-3 rounded-xl bg-[#fffaf5] p-3 md:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr_0.5fr_0.8fr]">
                {Array.from({ length: 6 }).map((__, cellIndex) => (
                  <div key={cellIndex} className="h-8 rounded bg-[#efe4da]" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
