"use client";

import Link from "next/link";
import { TeamBoard } from "@/components/teams/TeamBoard";
import { ExportMenu } from "@/components/export/ExportMenu";
import { useTeamsStore } from "@/store/teamsStore";

export default function TeamsPage() {
  const { currentTeams } = useTeamsStore();

  return (
    <main className="px-4 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Board</h1>
            <p className="mt-1 text-sm text-gray-500">
              Drag members between teams to adjust. Changes are advisory — you have final say.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ExportMenu />
            <Link
              href="/randomizer"
              className="text-sm text-blue-600 hover:underline"
            >
              ← Back to Randomizer
            </Link>
          </div>
        </div>

        {currentTeams.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <p className="text-gray-400 text-lg">No teams generated yet.</p>
            <Link
              href="/randomizer"
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Go to Randomizer
            </Link>
          </div>
        ) : (
          <TeamBoard />
        )}
      </div>
    </main>
  );
}
