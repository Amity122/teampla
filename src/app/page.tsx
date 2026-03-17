"use client";

import { useState } from "react";
import { RandomizerPanel } from "@/components/randomizer/RandomizerPanel";
import { TeamBoard } from "@/components/teams/TeamBoard";
import { ExportMenu } from "@/components/export/ExportMenu";
import { MembersPanel } from "@/components/workspace/MembersPanel";
import { useTeamsStore } from "@/store/teamsStore";
import { cn } from "@/lib/utils";

type MobileTab = "randomizer" | "members" | "teams";

const TABS: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
  {
    id: "randomizer",
    label: "Randomizer",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
        <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
      </svg>
    ),
  },
  {
    id: "members",
    label: "Members",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "teams",
    label: "Teams",
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

function EmptyBoard() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">No teams generated yet</p>
        <p className="text-xs text-gray-400 mt-1">Configure the randomizer and click Generate Teams.</p>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const { currentTeams } = useTeamsStore();
  const [activeTab, setActiveTab] = useState<MobileTab>("randomizer");

  return (
    <>
      {/* ── Desktop layout (md+) ──────────────────────────────────── */}
      <div className="hidden md:flex h-screen overflow-hidden bg-gray-50">

        {/* Left panel */}
        <div className="w-[268px] shrink-0 flex flex-col bg-white border-r border-gray-200 overflow-hidden">
          <div className="shrink-0 overflow-y-auto border-b border-gray-100" style={{ maxHeight: "58vh" }}>
            <div className="px-3 py-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Randomizer</p>
              <RandomizerPanel />
            </div>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <MembersPanel />
          </div>
        </div>

        {/* Main: Team Board */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200">
            <div>
              <h1 className="text-sm font-semibold text-gray-900">Team Board</h1>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Drag members between teams to adjust. Warnings are advisory.
              </p>
            </div>
            <ExportMenu />
          </div>
          <div className="flex-1 overflow-auto p-4">
            {currentTeams.length === 0 ? <EmptyBoard /> : <TeamBoard />}
          </div>
        </div>
      </div>

      {/* ── Mobile layout (< md) ──────────────────────────────────── */}
      <div className="flex md:hidden flex-col h-screen overflow-hidden bg-gray-50">

        {/* Mobile section header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <h1 className="text-sm font-semibold text-gray-900">
            {activeTab === "randomizer" && "Randomizer"}
            {activeTab === "members" && "Members"}
            {activeTab === "teams" && "Team Board"}
          </h1>
          {activeTab === "teams" && <ExportMenu />}
        </div>

        {/* Mobile content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {activeTab === "randomizer" && (
            <div className="h-full overflow-y-auto px-4 py-3">
              <RandomizerPanel />
            </div>
          )}
          {activeTab === "members" && <MembersPanel />}
          {activeTab === "teams" && (
            <div className="h-full overflow-auto p-3">
              {currentTeams.length === 0 ? <EmptyBoard /> : <TeamBoard />}
            </div>
          )}
        </div>

        {/* Bottom tab bar */}
        <div className="shrink-0 flex border-t border-gray-200 bg-white safe-area-bottom">
          {TABS.map(({ id, label, icon }) => {
            const active = activeTab === id;
            const showDot = id === "teams" && currentTeams.length > 0;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors relative",
                  active ? "text-blue-600" : "text-gray-400 hover:text-gray-600"
                )}
              >
                {icon}
                {label}
                {showDot && (
                  <span className="absolute top-2 right-[calc(50%-14px)] w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
