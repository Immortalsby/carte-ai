"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        An unexpected error occurred. Please try again.
        {error.digest && <span className="block mt-1 text-xs text-muted-foreground/60">Ref: {error.digest}</span>}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
      >
        Try again
      </button>
    </div>
  );
}
