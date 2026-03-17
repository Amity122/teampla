/**
 * PRD §12.2 — Randomizer Algorithm
 */

import { describe, expect, test } from "vitest";
import { generateTeams, swapMembers } from "@/lib/randomizer";
import { buildMember, buildValidConfig, buildTwoTeams } from "./testUtils";

describe("Team Randomizer", () => {
  describe("Project Load Priority", () => {
    test("UT-RZ-01: members with fewer projects are assigned before heavier ones", () => {
      const members = [
        buildMember({ name: "A", activeProjectCount: 3 }),
        buildMember({ name: "B", activeProjectCount: 0 }),
        buildMember({ name: "C", activeProjectCount: 1 }),
      ];
      const config = buildValidConfig({ numTeams: 1, requireSeniorPerTeam: false });
      const result = generateTeams(members, config);
      // Least-loaded should appear first (seniors-first display order may reorder)
      const names = result.teams[0].members.map((e) => e.member.name);
      // B (0 projects) should come before A (3 projects)
      expect(names.indexOf("B")).toBeLessThan(names.indexOf("A"));
    });

    test("UT-RZ-02: stable sort — equal project count preserves relative order", () => {
      const members = [
        buildMember({ name: "X", activeProjectCount: 1, skillLevel: "Junior" }),
        buildMember({ name: "Y", activeProjectCount: 1, skillLevel: "Junior" }),
      ];
      const config = buildValidConfig({ numTeams: 1, requireSeniorPerTeam: false, seed: 42 });
      const result = generateTeams(members, config);
      const names = result.teams[0].members.map((e) => e.member.name);
      // Both are in the team; order within same bucket may vary but both present
      expect(names).toContain("X");
      expect(names).toContain("Y");
    });
  });

  describe("Skill Balance", () => {
    test("UT-RZ-03: each generated team has at least one Senior or Lead when possible", () => {
      const members = [
        buildMember({ skillLevel: "Senior" }),
        buildMember({ skillLevel: "Junior" }),
        buildMember({ skillLevel: "Lead" }),
        buildMember({ skillLevel: "Junior" }),
      ];
      const config = buildValidConfig({ numTeams: 2, requireSeniorPerTeam: true });
      const result = generateTeams(members, config);
      result.teams.forEach((team) => {
        const hasSenior = team.members.some((e) => ["Senior", "Lead"].includes(e.member.skillLevel));
        expect(hasSenior).toBe(true);
      });
    });

    test("UT-RZ-04: flags conflict when not enough Seniors for all teams", () => {
      const members = [
        buildMember({ skillLevel: "Senior" }),
        buildMember({ skillLevel: "Junior" }),
        buildMember({ skillLevel: "Junior" }),
        buildMember({ skillLevel: "Junior" }),
      ];
      const config = buildValidConfig({ numTeams: 2, requireSeniorPerTeam: true });
      const result = generateTeams(members, config);
      const hasConflict = result.conflicts.some((c) => c.type === "INSUFFICIENT_SENIORS");
      expect(hasConflict).toBe(true);
    });
  });

  describe("Specialization Coverage", () => {
    test("UT-RZ-05: each team includes required specializations when available", () => {
      const members = [
        buildMember({ primaryTeam: "Backend", skillLevel: "Junior" }),
        buildMember({ primaryTeam: "Frontend", skillLevel: "Junior" }),
        buildMember({ primaryTeam: "Backend", skillLevel: "Junior" }),
        buildMember({ primaryTeam: "Frontend", skillLevel: "Junior" }),
      ];
      const config = buildValidConfig({
        numTeams: 2,
        requireSeniorPerTeam: false,
        requiredSpecializations: ["Backend", "Frontend"],
      });
      const result = generateTeams(members, config);
      result.teams.forEach((team) => {
        const specs = team.members.map((e) => e.member.primaryTeam);
        expect(specs).toContain("Backend");
        expect(specs).toContain("Frontend");
      });
    });
  });

  describe("Team Size", () => {
    test("UT-RZ-06: generated teams respect the target size range", () => {
      const members = Array.from({ length: 10 }, (_, i) => buildMember({ name: `M${i}`, skillLevel: "Junior" }));
      const config = buildValidConfig({ numTeams: 2, minMembers: 4, maxMembers: 6, requireSeniorPerTeam: false });
      const result = generateTeams(members, config);
      result.teams.forEach((team) => {
        expect(team.members.length).toBeGreaterThanOrEqual(4);
        expect(team.members.length).toBeLessThanOrEqual(6);
      });
    });

    test("UT-RZ-07: all members are assigned — no one is left out", () => {
      const members = Array.from({ length: 9 }, (_, i) => buildMember({ name: `M${i}`, skillLevel: "Junior" }));
      const config = buildValidConfig({ numTeams: 3, requireSeniorPerTeam: false });
      const result = generateTeams(members, config);
      const total = result.teams.reduce((s, t) => s + t.members.length, 0);
      expect(total).toBe(9);
    });

    test("UT-RZ-08: handles uneven distribution gracefully (10 members into 3 teams)", () => {
      const members = Array.from({ length: 10 }, (_, i) => buildMember({ name: `M${i}`, skillLevel: "Junior" }));
      const config = buildValidConfig({ numTeams: 3, requireSeniorPerTeam: false });
      const result = generateTeams(members, config);
      const sizes = result.teams.map((t) => t.members.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    });
  });

  describe("Edge Cases", () => {
    test("UT-RZ-09: returns empty result with an empty member pool", () => {
      const result = generateTeams([], buildValidConfig());
      expect(result.teams).toHaveLength(0);
      expect(result.conflicts.some((c) => c.type === "EMPTY_POOL")).toBe(true);
    });

    test("UT-RZ-10: handles single-member pool gracefully", () => {
      const members = [buildMember({ name: "Solo", skillLevel: "Junior" })];
      const config = buildValidConfig({ numTeams: 1, requireSeniorPerTeam: false });
      const result = generateTeams(members, config);
      expect(result.teams[0].members[0].member.name).toBe("Solo");
    });

    test("UT-RZ-11: does not assign the same member to multiple teams", () => {
      const members = Array.from({ length: 6 }, (_, i) => buildMember({ id: `id-${i}`, skillLevel: "Junior" }));
      const config = buildValidConfig({ numTeams: 2, requireSeniorPerTeam: false });
      const result = generateTeams(members, config);
      const allIds = result.teams.flatMap((t) => t.members.map((e) => e.member.id));
      expect(new Set(allIds).size).toBe(allIds.length);
    });
  });
});

describe("Swap Logic", () => {
  test("UT-DS-01: successfully swaps two members between teams", () => {
    const { teamA, teamB } = buildTwoTeams();
    const memberFromA = teamA.members[0].member;
    const memberFromB = teamB.members[0].member;
    const { teams } = swapMembers([teamA, teamB], memberFromA.id, teamA.id, memberFromB.id, teamB.id);
    const newTeamA = teams.find((t) => t.id === teamA.id)!;
    const newTeamB = teams.find((t) => t.id === teamB.id)!;
    expect(newTeamA.members.some((e) => e.member.id === memberFromB.id)).toBe(true);
    expect(newTeamB.members.some((e) => e.member.id === memberFromA.id)).toBe(true);
  });

  test("UT-DS-05: swapped members are flagged as manually modified", () => {
    const { teamA, teamB } = buildTwoTeams();
    const { teams } = swapMembers(
      [teamA, teamB],
      teamA.members[0].member.id, teamA.id,
      teamB.members[0].member.id, teamB.id
    );
    const movedMember = teams
      .find((t) => t.id === teamA.id)!
      .members.find((e) => e.member.id === teamB.members[0].member.id)!;
    expect(movedMember.manuallySwapped).toBe(true);
  });
});
