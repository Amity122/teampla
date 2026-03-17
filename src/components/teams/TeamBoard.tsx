"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useState } from "react";
import { TeamCard } from "./TeamCard";
import { MemberCard } from "./MemberCard";
import { Button } from "@/components/ui/Button";
import { useTeamsStore } from "@/store/teamsStore";
import type { Member } from "@/lib/types";

export function TeamBoard() {
  const { currentTeams, swapHistory, lastSwapWarning, swapMembersBetweenTeams, undoLastSwap, resetToGenerated, clearWarning } =
    useTeamsStore();

  const [activeMember, setActiveMember] = useState<{ member: Member; teamId: string } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveMember(null);
    if (!over || active.id === over.id) return;

    // active.id format: "teamId:memberId"
    const [fromTeamId, fromMemberId] = String(active.id).split(":");
    const overStr = String(over.id);

    // Determine drop target team and member
    let toTeamId: string;
    let toMemberId: string | null = null;

    if (overStr.includes(":")) {
      // Dropped onto another member card
      [toTeamId, toMemberId] = overStr.split(":");
    } else {
      // Dropped onto a team container
      toTeamId = overStr;
      const toTeam = currentTeams.find((t) => t.id === toTeamId);
      if (!toTeam || toTeam.members.length === 0) return;
      toMemberId = toTeam.members[toTeam.members.length - 1].member.id;
    }

    if (!toMemberId || fromTeamId === toTeamId) return;

    swapMembersBetweenTeams(fromMemberId, fromTeamId, toMemberId, toTeamId);
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
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="secondary"
          size="sm"
          disabled={swapHistory.length === 0}
          onClick={undoLastSwap}
        >
          ↩ Undo
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={swapHistory.length === 0}
          onClick={resetToGenerated}
        >
          Reset to Generated
        </Button>
      </div>

      {/* Skill imbalance warning */}
      {lastSwapWarning && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <span>⚠️</span>
          <span className="flex-1">{lastSwapWarning.message}</span>
          <button onClick={clearWarning} className="text-amber-500 hover:text-amber-700 shrink-0">✕</button>
        </div>
      )}

      {/* Team board */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={(e) => {
        const [teamId, memberId] = String(e.active.id).split(":");
        const team = currentTeams.find((t) => t.id === teamId);
        const entry = team?.members.find((m) => m.member.id === memberId);
        if (entry) setActiveMember({ member: entry.member, teamId });
      }}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {currentTeams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
        <DragOverlay>
          {activeMember && (
            <MemberCard member={activeMember.member} teamId={activeMember.teamId} disabled />
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
