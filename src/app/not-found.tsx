import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-bold">404</h1>
      <p className="mt-3 text-gray-500">Page not found</p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-black px-6 py-2 text-sm text-white hover:bg-gray-800"
      >
        Go home
      </Link>
    </main>
  );
}
