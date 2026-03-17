import { z } from "zod";

// ─── Enum schemas ─────────────────────────────────────────────────────────────

export const SkillLevelSchema = z.enum(["Junior", "Mid-level", "Senior", "Lead"]);

export const PrimaryTeamSchema = z.enum([
  "Backend",
  "Frontend",
  "DevOps",
  "QA / Testing",
  "Mobile",
  "Data / Analytics",
  "Full Stack",
  "Other",
]);

export const ShiftScheduleSchema = z.enum([
  "Day Shift",
  "Afternoon Shift",
  "Night Shift",
]);

export const ScheduleStatusSchema = z.enum(["onsite", "wfh", "dayoff"]);

// ─── WeeklySchedule ───────────────────────────────────────────────────────────

export const WeeklyScheduleSchema = z.object({
  mon: ScheduleStatusSchema,
  tue: ScheduleStatusSchema,
  wed: ScheduleStatusSchema,
  thu: ScheduleStatusSchema,
  fri: ScheduleStatusSchema,
  sat: ScheduleStatusSchema,
  sun: ScheduleStatusSchema,
});

// ─── Member ───────────────────────────────────────────────────────────────────

export const MemberCreateSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    skillLevel: SkillLevelSchema,
    primaryTeam: PrimaryTeamSchema,
    otherTeamName: z.string().optional().nullable(),
    shift: ShiftScheduleSchema,
    weeklySchedule: WeeklyScheduleSchema,
    activeProjectCount: z
      .number()
      .int("Must be a whole number")
      .min(0, "Cannot be negative"),
    isAdmin: z.boolean().default(false),
  })
  .refine(
    (data) =>
      data.primaryTeam !== "Other" ||
      (data.otherTeamName && data.otherTeamName.trim().length > 0),
    {
      message: "Please specify your team name when selecting 'Other'",
      path: ["otherTeamName"],
    }
  );

export const MemberUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    skillLevel: SkillLevelSchema.optional(),
    primaryTeam: PrimaryTeamSchema.optional(),
    otherTeamName: z.string().optional().nullable(),
    shift: ShiftScheduleSchema.optional(),
    weeklySchedule: WeeklyScheduleSchema.optional(),
    activeProjectCount: z.number().int().min(0).optional(),
    isAdmin: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.primaryTeam !== "Other" ||
      !data.primaryTeam ||
      (data.otherTeamName && data.otherTeamName.trim().length > 0),
    {
      message: "Please specify your team name when selecting 'Other'",
      path: ["otherTeamName"],
    }
  );

// ─── Randomizer ───────────────────────────────────────────────────────────────

export const RandomizerConfigSchema = z.object({
  numTeams: z.number().int().min(1, "At least 1 team required"),
  minMembers: z.number().int().min(1).optional(),
  maxMembers: z.number().int().min(1).optional(),
  requireSeniorPerTeam: z.boolean().default(true),
  requiredSpecializations: z.array(PrimaryTeamSchema).default([]),
  groupByShift: z.boolean().default(false),
  memberIds: z.array(z.string()).optional(),
  seed: z.number().int().optional(),
});

export const GenerateTeamsRequestSchema = z.object({
  config: RandomizerConfigSchema,
  presetId: z.string().optional(),
  persist: z.boolean().default(false),
});

// ─── Preset ───────────────────────────────────────────────────────────────────

export const PresetCreateSchema = z.object({
  name: z.string().min(1, "Preset name is required"),
  config: RandomizerConfigSchema,
});

export const PresetUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  config: RandomizerConfigSchema.optional(),
});

// ─── Export ───────────────────────────────────────────────────────────────────

export const ExportRequestSchema = z.object({
  sessionId: z.string().min(1),
  format: z.enum(["slack", "csv", "plain_text"]),
});

// ─── Standalone validation helpers (used in PRD §12.1 unit tests) ─────────────

export function validateSkillLevel(value: unknown): boolean {
  return SkillLevelSchema.safeParse(value).success;
}

export function validateTeam(value: unknown, otherName?: unknown): boolean {
  if (!PrimaryTeamSchema.safeParse(value).success) return false;
  if (value === "Other") {
    return typeof otherName === "string" && otherName.trim().length > 0;
  }
  return true;
}

export function validateShift(value: unknown): boolean {
  return ShiftScheduleSchema.safeParse(value).success;
}

export function validateWeeklySchedule(value: unknown): boolean {
  return WeeklyScheduleSchema.safeParse(value).success;
}

export function validateProjectCount(value: unknown): boolean {
  return (
    z.number().int().min(0).safeParse(value).success
  );
}
