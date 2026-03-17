"use client";

import { cn } from "@/lib/utils";
import type { ScheduleStatus, WeeklySchedule } from "@/lib/types";

const DAYS: { key: keyof WeeklySchedule; label: string }[] = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
];

const STATUS_CYCLE: ScheduleStatus[] = ["onsite", "wfh", "dayoff"];

const STATUS_STYLES: Record<ScheduleStatus, string> = {
  onsite: "bg-blue-100 text-blue-700 border-blue-200",
  wfh: "bg-green-100 text-green-700 border-green-200",
  dayoff: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<ScheduleStatus, string> = {
  onsite: "On-Site",
  wfh: "WFH",
  dayoff: "Day Off",
};

interface WeeklyScheduleGridProps {
  value: WeeklySchedule;
  onChange: (value: WeeklySchedule) => void;
  disabled?: boolean;
}

export function WeeklyScheduleGrid({ value, onChange, disabled }: WeeklyScheduleGridProps) {
  function toggle(day: keyof WeeklySchedule) {
    if (disabled) return;
    const current = value[day];
    const nextIndex = (STATUS_CYCLE.indexOf(current) + 1) % STATUS_CYCLE.length;
    onChange({ ...value, [day]: STATUS_CYCLE[nextIndex] });
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">Weekly Schedule</span>
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            disabled={disabled}
            className={cn(
              "flex flex-col items-center gap-0.5 rounded-lg border px-1 py-2 text-xs font-medium transition-colors",
              STATUS_STYLES[value[key]],
              !disabled && "cursor-pointer hover:opacity-80",
              disabled && "cursor-default opacity-60"
            )}
          >
            <span className="font-semibold">{label}</span>
            <span className="text-[10px] leading-tight">{STATUS_LABELS[value[key]]}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400">Click a day to cycle: On-Site → WFH → Day Off</p>
    </div>
  );
}
