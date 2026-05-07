"use client";

export default function CustomerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">Oops!</h1>
      <p className="mt-2 text-sm text-gray-500">
        We couldn&apos;t load the menu. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-black px-6 py-2 text-sm text-white hover:bg-gray-800"
      >
        Retry
      </button>
    </main>
  );
}
