// ─── Enums ────────────────────────────────────────────────────────────────────

export type SkillLevel = "Junior" | "Mid-level" | "Senior" | "Lead";

export type PrimaryTeam =
  | "Backend"
  | "Frontend"
  | "DevOps"
  | "QA / Testing"
  | "Mobile"
  | "Data / Analytics"
  | "Full Stack"
  | "Other";

export type ShiftSchedule = "Day Shift" | "Afternoon Shift" | "Night Shift";

export type ScheduleStatus = "onsite" | "wfh" | "dayoff";

export type ExportFormat = "slack" | "csv" | "plain_text";

// ─── Domain Models ────────────────────────────────────────────────────────────

export type WeeklySchedule = {
  mon: ScheduleStatus;
  tue: ScheduleStatus;
  wed: ScheduleStatus;
  thu: ScheduleStatus;
  fri: ScheduleStatus;
  sat: ScheduleStatus;
  sun: ScheduleStatus;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  skillLevel: SkillLevel;
  primaryTeam: PrimaryTeam;
  otherTeamName: string | null;
  shift: ShiftSchedule;
  weeklySchedule: WeeklySchedule;
  activeProjectCount: number;
  updatedAt: string; // ISO string
};

export type TeamMemberInfo = {
  member: Member;
  manuallySwapped: boolean;
};

export type Team = {
  id: string;
  name: string;
  sessionId: string;
  presetId: string | null;
  createdAt: string; // ISO string
  members: TeamMemberInfo[];
};

export type Preset = {
  id: string;
  name: string;
  config: RandomizerConfig;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

// ─── Randomizer ───────────────────────────────────────────────────────────────

export type RandomizerConfig = {
  numTeams: number;
  minMembers?: number;
  maxMembers?: number;
  requireSeniorPerTeam: boolean;
  requiredSpecializations: PrimaryTeam[];
  groupByShift: boolean;
  memberIds?: string[];
  seed?: number;
};

export type ConflictInfo = {
  type:
    | "EMPTY_POOL"
    | "INSUFFICIENT_SENIORS"
    | "INSUFFICIENT_SPECIALIZATION"
    | "SIZE_VIOLATION";
  message: string;
};

export type GenerateTeamsResponse = {
  sessionId: string;
  teams: Team[];
  conflicts: ConflictInfo[];
  generatedAt: string;
  config: RandomizerConfig;
};

export type GenerateTeamsRequest = {
  config: RandomizerConfig;
  presetId?: string;
  persist?: boolean;
};

// ─── API Helpers ──────────────────────────────────────────────────────────────

export type ApiError = { error: string };
