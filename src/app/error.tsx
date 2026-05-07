"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        An unexpected error occurred. Please try again.
        {error.digest && <span className="block mt-1 text-xs text-muted-foreground/60">Ref: {error.digest}</span>}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-black px-6 py-2 text-sm text-white hover:bg-gray-800"
      >
        Try again
      </button>
    </main>
  );
}
