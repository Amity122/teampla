/**
 * PRD §12.1 — Member Profile Validation
 */

import { describe, expect, test } from "vitest";
import {
  validateSkillLevel,
  validateTeam,
  validateShift,
  validateWeeklySchedule,
  validateProjectCount,
  MemberCreateSchema,
} from "@/lib/validators";
import { buildValidProfile } from "./testUtils";

describe("Member Profile Validation", () => {
  describe("Skill Level", () => {
    test("UT-MP-01: accepts valid skill levels", () => {
      ["Junior", "Mid-level", "Senior", "Lead"].forEach((level) => {
        expect(validateSkillLevel(level)).toBe(true);
      });
    });

    test("UT-MP-02: rejects invalid or empty skill level", () => {
      expect(validateSkillLevel("")).toBe(false);
      expect(validateSkillLevel("Intern")).toBe(false);
      expect(validateSkillLevel(null)).toBe(false);
    });
  });

  describe("Team / Specialization", () => {
    test("UT-MP-03: accepts valid team values", () => {
      ["Backend", "Frontend", "DevOps", "QA / Testing", "Mobile", "Data / Analytics", "Full Stack"].forEach(
        (team) => expect(validateTeam(team)).toBe(true)
      );
    });

    test("UT-MP-04: accepts 'Other' with a non-empty free-text value", () => {
      expect(validateTeam("Other", "Platform Engineering")).toBe(true);
    });

    test("UT-MP-05: rejects 'Other' with empty free-text", () => {
      expect(validateTeam("Other", "")).toBe(false);
      expect(validateTeam("Other", null)).toBe(false);
    });
  });

  describe("Shift Schedule", () => {
    test("UT-MP-06: accepts valid shifts", () => {
      ["Day Shift", "Afternoon Shift", "Night Shift"].forEach((shift) =>
        expect(validateShift(shift)).toBe(true)
      );
    });

    test("UT-MP-07: rejects invalid or missing shift", () => {
      expect(validateShift("Morning")).toBe(false);
      expect(validateShift("")).toBe(false);
    });
  });

  describe("Weekly Schedule", () => {
    test("UT-MP-08: accepts a complete 7-day schedule with valid values", () => {
      const schedule = {
        mon: "onsite", tue: "wfh", wed: "onsite",
        thu: "wfh", fri: "onsite", sat: "dayoff", sun: "dayoff",
      };
      expect(validateWeeklySchedule(schedule)).toBe(true);
    });

    test("UT-MP-09: rejects schedule with missing days", () => {
      expect(validateWeeklySchedule({ mon: "onsite", tue: "wfh" })).toBe(false);
    });

    test("UT-MP-10: rejects schedule with invalid day values", () => {
      const invalid = {
        mon: "remote", tue: "wfh", wed: "onsite",
        thu: "wfh", fri: "onsite", sat: "dayoff", sun: "dayoff",
      };
      expect(validateWeeklySchedule(invalid)).toBe(false);
    });
  });

  describe("Active Project Count", () => {
    test("UT-MP-11: accepts valid project count (0 to 10)", () => {
      [0, 1, 2, 3, 10].forEach((count) => expect(validateProjectCount(count)).toBe(true));
    });

    test("UT-MP-12: rejects negative values and non-integers", () => {
      expect(validateProjectCount(-1)).toBe(false);
      expect(validateProjectCount(1.5)).toBe(false);
      expect(validateProjectCount(null)).toBe(false);
    });
  });

  describe("Full Profile Submission", () => {
    test("UT-MP-13: validates a complete profile successfully", () => {
      const profile = buildValidProfile();
      const result = MemberCreateSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    test("UT-MP-14: rejects submission with missing required fields", () => {
      const result = MemberCreateSchema.safeParse({ name: "Juan dela Cruz" });
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(0);
    });
  });
});
