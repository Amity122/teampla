"use client";

import Link from "next/link";
import { RandomizerPanel } from "@/components/randomizer/RandomizerPanel";
import { useTeamsStore } from "@/store/teamsStore";

export default function RandomizerPage() {
  const { currentTeams } = useTeamsStore();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Randomizer</h1>
          <p className="mt-1 text-sm text-gray-500">
            Configure constraints, then generate balanced teams.
          </p>
        </div>
        <Link href="/presets" className="text-sm text-blue-600 hover:underline">
          Presets →
        </Link>
      </div>

      <RandomizerPanel />

      {currentTeams.length > 0 && (
        <div className="mt-6">
          <Link
            href="/teams"
            className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            View Teams & Adjust →
          </Link>
        </div>
      )}
    </main>
  );
}
