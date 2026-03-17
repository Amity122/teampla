"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn, displayTeam, teamColors } from "@/lib/utils";
import { WorkloadBadge } from "./WorkloadBadge";
import { Badge } from "@/components/ui/Badge";
import type { Member } from "@/lib/types";

interface MemberCardProps {
  member: Member;
  teamId: string;
  teamName?: string;
  manuallySwapped?: boolean;
  disabled?: boolean;
}

export function MemberCard({ member, teamId, teamName, manuallySwapped, disabled }: MemberCardProps) {
  const dragId = `${teamId}:${member.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    disabled,
  });

  const colors = teamName ? teamColors(teamName) : null;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-lg border bg-white shadow-sm select-none touch-none overflow-hidden",
        isDragging && "opacity-40 shadow-lg ring-2 ring-blue-500",
        manuallySwapped && "border-amber-300 bg-amber-50",
        !disabled && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex">
        {/* Team color strip */}
        {colors && (
          <div className={cn("w-1 shrink-0 rounded-l-lg", colors.bg)} />
        )}
        <div className="flex items-start justify-between gap-2 p-3 flex-1 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-medium text-gray-900 text-sm">{member.name}</p>
              {colors && teamName && (
                <span className={cn("text-[10px] font-medium shrink-0", colors.text)}>
                  {teamName.replace(/^Team\s+/i, "")}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {member.skillLevel} · {displayTeam(member)}
            </p>
            <p className="text-xs text-gray-400">{member.shift}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <WorkloadBadge count={member.activeProjectCount} />
            {manuallySwapped && (
              <Badge variant="yellow" className="text-[10px]">
                adjusted
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
