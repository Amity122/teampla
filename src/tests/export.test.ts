/**
 * PRD §12.5 — Export Functions
 */

import { describe, expect, test } from "vitest";
import { formatSlack, formatCSV, formatPlainText } from "@/lib/export";
import { buildSampleTeams, buildMember } from "./testUtils";
import type { Team } from "@/lib/types";

describe("Export Functions", () => {
  describe("Slack Format", () => {
    test("UT-EX-01: generates valid Slack-formatted output", () => {
      const teams = buildSampleTeams();
      const output = formatSlack(teams);
      expect(output).toContain("*Team Alpha*");
      expect(output).toContain("• ");
      expect(typeof output).toBe("string");
    });

    test("UT-EX-02: each member appears exactly once in Slack output", () => {
      const teams = buildSampleTeams();
      const output = formatSlack(teams);
      const memberNames = teams.flatMap((t) => t.members.map((e) => e.member.name));
      memberNames.forEach((name) => {
        const count = (output.match(new RegExp(name, "g")) || []).length;
        expect(count).toBe(1);
      });
    });
  });

  describe("CSV Format", () => {
    test("UT-EX-03: generates a CSV with the correct headers", () => {
      const teams = buildSampleTeams();
      const csv = formatCSV(teams);
      const headers = csv.split("\n")[0];
      expect(headers).toBe("Team,Name,Skill Level,Specialization,Shift,Active Projects");
    });

    test("UT-EX-04: CSV row count equals total member count plus header", () => {
      const teams = buildSampleTeams(); // 10 total members
      const csv = formatCSV(teams);
      const rows = csv.trim().split("\n");
      expect(rows.length).toBe(11); // 1 header + 10 members
    });

    test("UT-EX-05: CSV handles member names with commas correctly (quoted)", () => {
      const teams: Team[] = [
        {
          id: "t1", name: "Team Alpha", sessionId: "s1", presetId: null,
          createdAt: new Date().toISOString(),
          members: [{ member: buildMember({ name: "De Leon, Juan" }), manuallySwapped: false }],
        },
      ];
      const csv = formatCSV(teams);
      expect(csv).toContain('"De Leon, Juan"');
    });
  });

  describe("Plain Text", () => {
    test("UT-EX-06: plain text output contains all team names and members", () => {
      const teams = buildSampleTeams();
      const text = formatPlainText(teams);
      teams.forEach((team) => {
        expect(text).toContain(team.name);
        team.members.forEach((e) => expect(text).toContain(e.member.name));
      });
    });
  });
});
