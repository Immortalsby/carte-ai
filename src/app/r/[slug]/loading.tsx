export default function CustomerLoading() {
  return (
    <main className="mx-auto max-w-lg animate-pulse px-4 py-6 bg-carte-bg min-h-screen">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto h-7 w-48 rounded bg-carte-surface" />
        <div className="mx-auto mt-2 h-4 w-28 rounded bg-carte-surface" />
      </div>

      {/* Language switcher */}
      <div className="mt-4 flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-16 rounded-full bg-carte-surface" />
        ))}
      </div>

      {/* Category tabs */}
      <div className="mt-4 flex gap-2 overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-7 w-20 shrink-0 rounded-full bg-carte-surface" />
        ))}
      </div>

      {/* Dish cards */}
      <div className="mt-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border border-carte-border p-4" style={{ backgroundColor: "var(--carte-surface)" }}>
            <div className="flex items-center justify-between">
              <div className="h-4 w-36 rounded bg-carte-border" />
              <div className="h-4 w-12 rounded bg-carte-border" />
            </div>
            <div className="mt-2 h-3 w-full rounded bg-carte-border" />
            <div className="mt-1 h-3 w-2/3 rounded bg-carte-border" />
          </div>
        ))}
      </div>
    </main>
  );
}
