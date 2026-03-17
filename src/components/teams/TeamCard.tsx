"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { MemberCard } from "./MemberCard";
import type { Team } from "@/lib/types";

interface TeamCardProps {
  team: Team;
  disabled?: boolean;
}

export function TeamCard({ team, disabled }: TeamCardProps) {
  const { setNodeRef, isOver } = useDroppable({ id: team.id });

  const avgLoad =
    team.members.length > 0
      ? (team.members.reduce((s, e) => s + e.member.activeProjectCount, 0) / team.members.length).toFixed(1)
      : "—";

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-gray-50 p-4 min-w-[220px] w-[260px] transition-colors",
        isOver && "border-blue-400 bg-blue-50"
      )}
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{team.name}</h3>
        <span className="text-xs text-gray-400">
          {team.members.length} member{team.members.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-col gap-2 min-h-[80px] rounded-lg p-1 transition-colors",
          isOver && "bg-blue-100/50",
          team.members.length === 0 && isOver && "border-2 border-dashed border-blue-300"
        )}
      >
        {team.members.map((entry) => (
          <MemberCard
            key={entry.member.id}
            member={entry.member}
            teamId={team.id}
            manuallySwapped={entry.manuallySwapped}
            disabled={disabled}
          />
        ))}
        {team.members.length === 0 && (
          <p className="text-center text-xs text-gray-400 py-4">No members</p>
        )}
      </div>

      <p className="text-xs text-gray-400 border-t pt-2">
        Avg load: {avgLoad} projects
      </p>
    </div>
  );
}
