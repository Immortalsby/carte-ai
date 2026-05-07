import Link from "next/link";

export default function RestaurantNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold">Restaurant not found</h1>
      <p className="mt-3 text-gray-500">
        This QR code may be outdated or the restaurant has not been set up yet.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-black px-6 py-2 text-sm text-white hover:bg-gray-800"
      >
        Go to CarteAI
      </Link>
    </main>
  );
}
