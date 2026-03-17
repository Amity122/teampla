import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Teampla</h1>
        <p className="mt-3 text-lg text-gray-500">
          Intelligent IT team formation — balanced, fair, and workload-aware.
        </p>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Link
          href="/profile"
          className="rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-700 transition-colors"
        >
          My Profile
        </Link>
        <Link
          href="/randomizer"
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Team Randomizer
        </Link>
        <Link
          href="/presets"
          className="rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Presets
        </Link>
      </div>
    </main>
  );
}
