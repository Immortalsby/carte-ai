export default function AdminLoading() {
  return (
    <div className="animate-pulse">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-40 rounded-lg bg-gray-200" />
          <div className="mt-2 h-4 w-24 rounded bg-gray-100" />
        </div>
        <div className="h-4 w-32 rounded bg-gray-100" />
      </div>

      {/* Primary KPIs */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="h-4 w-16 rounded bg-gray-100" />
            <div className="mt-2 h-7 w-20 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Secondary KPIs */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="h-4 w-20 rounded bg-gray-100" />
            <div className="mt-2 h-7 w-16 rounded bg-gray-200" />
            <div className="mt-1 h-3 w-24 rounded bg-gray-50" />
          </div>
        ))}
      </div>

      {/* Quota bar placeholder */}
      <div className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
        <div className="h-4 w-32 rounded bg-gray-100" />
        <div className="mt-3 h-3 rounded-full bg-gray-100" />
      </div>

      {/* Charts placeholder */}
      <div className="mt-8 space-y-6">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="h-4 w-24 rounded bg-gray-100" />
          <div className="mt-4 h-[220px] rounded bg-gray-50" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="h-4 w-20 rounded bg-gray-100" />
            <div className="mt-4 h-[220px] rounded bg-gray-50" />
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="h-4 w-28 rounded bg-gray-100" />
            <div className="mt-4 h-[220px] rounded bg-gray-50" />
          </div>
        </div>
      </div>
    </div>
  );
}
