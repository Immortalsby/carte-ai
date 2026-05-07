export default function CustomerLoading() {
  return (
    <main className="mx-auto max-w-lg animate-pulse px-4 py-6">
      <div className="mx-auto h-8 w-48 rounded bg-gray-200" />
      <div className="mx-auto mt-2 h-4 w-24 rounded bg-gray-100" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-100" />
        ))}
      </div>
    </main>
  );
}
