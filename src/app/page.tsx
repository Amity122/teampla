"use client";

import { RandomizerPanel } from "@/components/randomizer/RandomizerPanel";
import { TeamBoard } from "@/components/teams/TeamBoard";
import { ExportMenu } from "@/components/export/ExportMenu";
import { MembersPanel } from "@/components/workspace/MembersPanel";
import { useTeamsStore } from "@/store/teamsStore";

export default function WorkspacePage() {
  const { currentTeams } = useTeamsStore();

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div className="w-[268px] shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden">

        {/* Randomizer section */}
        <div className="shrink-0 overflow-y-auto border-b border-gray-100" style={{ maxHeight: "58vh" }}>
          <div className="px-3 py-3">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Randomizer
            </p>
            <RandomizerPanel />
          </div>
        </div>

        {/* Members section — fills remaining space */}
        <div className="flex-1 overflow-hidden min-h-0">
          <MembersPanel />
        </div>
      </div>

      {/* ── Main: Team Board ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
          <div>
            <h1 className="text-sm font-semibold text-gray-900">Team Board</h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Drag members between teams to adjust. Warnings are advisory — you have final say.
            </p>
          </div>
          <ExportMenu />
        </div>

        {/* Board content */}
        <div className="flex-1 overflow-auto p-4">
          {currentTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">No teams generated yet</p>
                <p className="text-xs text-gray-400 mt-1">Configure the randomizer on the left and click Generate Teams.</p>
              </div>
            </div>
          ) : (
            <TeamBoard />
          )}
        </div>
      </div>
    </div>
  );
}
