"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { TeamCard } from "./TeamCard";
import { MemberCard } from "./MemberCard";
import { Button } from "@/components/ui/Button";
import { useTeamsStore } from "@/store/teamsStore";
import { useRandomizerStore } from "@/store/randomizerStore";
import type { Member } from "@/lib/types";

export function TeamBoard() {
  const {
    currentTeams,
    swapHistory,
    lastSwapWarnings,
    swapMembersBetweenTeams,
    undoLastSwap,
    resetToGenerated,
    clearWarning,
  } = useTeamsStore();

  const pairingConstraints = useRandomizerStore((s) => s.config.pairingConstraints);

  const [activeMember, setActiveMember] = useState<{ member: Member; teamId: string } | null>(null);
  const [dropError, setDropError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setDropError(null);
    const [teamId, memberId] = String(event.active.id).split(":");
    const team = currentTeams.find((t) => t.id === teamId);
    const entry = team?.members.find((m) => m.member.id === memberId);
    if (entry) setActiveMember({ member: entry.member, teamId });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveMember(null);
    if (!over || active.id === over.id) return;

    const [fromTeamId, fromMemberId] = String(active.id).split(":");
    const overStr = String(over.id);

    let toTeamId: string;
    let toMemberId: string | null = null;

    if (overStr.includes(":")) {
      // Dropped onto a member card — swap those two members
      [toTeamId, toMemberId] = overStr.split(":");
    } else {
      // Dropped onto a team container
      toTeamId = overStr;
      const toTeam = currentTeams.find((t) => t.id === toTeamId);
      if (!toTeam) return;

      if (toTeam.members.length === 0) {
        setDropError("Can't drop onto an empty team — swap requires a member to exchange with.");
        setTimeout(() => setDropError(null), 3000);
        return;
      }

      // Swap with the last member in that team
      toMemberId = toTeam.members[toTeam.members.length - 1].member.id;
    }

    if (!toMemberId || fromTeamId === toTeamId) return;

    swapMembersBetweenTeams(fromMemberId, fromTeamId, toMemberId, toTeamId, pairingConstraints);
  }

  if (currentTeams.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-xl border-2 border-dashed border-gray-200">
        <p className="text-gray-400">Generate teams to see them here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button variant="secondary" size="sm" disabled={swapHistory.length === 0} onClick={undoLastSwap}>
          ↩ Undo
        </Button>
        <Button variant="ghost" size="sm" disabled={swapHistory.length === 0} onClick={resetToGenerated}>
          Reset
        </Button>
      </div>

      {/* Swap warnings */}
      {lastSwapWarnings.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {lastSwapWarnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-start gap-2 rounded-md border px-2.5 py-2 text-xs ${
                w.type === "CONSTRAINT_VIOLATED"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              <span>{w.type === "CONSTRAINT_VIOLATED" ? "🚫" : "⚠️"}</span>
              <span className="flex-1">{w.message}</span>
              {i === 0 && (
                <button onClick={clearWarning} className="text-gray-400 hover:text-gray-600 shrink-0">✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop error */}
      {dropError && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-xs text-red-700">
          <span>✕</span>
          <span>{dropError}</span>
        </div>
      )}

      {/* Team board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-3 md:flex-row md:gap-4 md:overflow-x-auto pb-4">
          {currentTeams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
        <DragOverlay dropAnimation={null}>
          {activeMember && (
            <div className="rotate-2 opacity-95 shadow-xl">
              <MemberCard
                member={activeMember.member}
                teamId={activeMember.teamId}
                disabled
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
