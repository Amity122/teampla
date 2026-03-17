"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { cn, displayTeam, teamColors } from "@/lib/utils";
import { WorkloadBadge } from "./WorkloadBadge";
import { Badge } from "@/components/ui/Badge";
import type { Member, ShiftSchedule } from "@/lib/types";

interface MemberCardProps {
  member: Member;
  teamId: string;
  teamName?: string;
  manuallySwapped?: boolean;
  disabled?: boolean;
}

function ShiftIcon({ shift }: { shift: ShiftSchedule }) {
  if (shift === "Day Shift") {
    return (
      <span title="Day Shift">
        <svg className="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>
    );
  }
  if (shift === "Afternoon Shift") {
    return (
      <span title="Afternoon Shift">
        <svg className="w-3.5 h-3.5 text-orange-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 18a5 5 0 0 0-10 0" />
          <line x1="12" y1="2" x2="12" y2="9" />
          <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
          <line x1="2" y1="18" x2="4" y2="18" />
          <line x1="20" y1="18" x2="22" y2="18" />
          <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
        </svg>
      </span>
    );
  }
  return (
    <span title="Night Shift">
      <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </span>
  );
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
        {colors && <div className={cn("w-1 shrink-0 rounded-l-lg", colors.bg)} />}
        <div className="flex items-center justify-between gap-2 px-2 py-1.5 flex-1 min-w-0">
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900 text-xs leading-tight">{member.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <ShiftIcon shift={member.shift} />
              <p className="text-[10px] text-gray-400 truncate leading-tight">
                {member.skillLevel} · {displayTeam(member)}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            <WorkloadBadge count={member.activeProjectCount} />
            {manuallySwapped && (
              <Badge variant="yellow" className="text-[9px] px-1 py-0">adjusted</Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
