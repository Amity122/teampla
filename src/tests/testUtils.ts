/**
 * Shared test fixtures — mirrors PRD §12.7.
 */

import type { Member, RandomizerConfig, Team } from "@/lib/types";

export const buildMember = (overrides: Partial<Member> = {}): Member => ({
  id: crypto.randomUUID(),
  name: "Test Member",
  email: "test@example.com",
  skillLevel: "Mid-level",
  primaryTeam: "Backend",
  otherTeamName: null,
  shift: "Day Shift",
  weeklySchedule: {
    mon: "onsite", tue: "wfh", wed: "onsite",
    thu: "wfh", fri: "onsite", sat: "dayoff", sun: "dayoff",
  },
  activeProjectCount: 1,
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const buildValidProfile = () => buildMember();

export const buildValidConfig = (overrides: Partial<RandomizerConfig> = {}): RandomizerConfig => ({
  numTeams: 2,
  minMembers: 3,
  maxMembers: 5,
  requireSeniorPerTeam: false,
  requiredSpecializations: [],
  groupByShift: false,
  ...overrides,
});

export const buildSampleTeams = (): Team[] => [
  {
    id: "team-1",
    name: "Team Alpha",
    sessionId: "session-1",
    presetId: null,
    createdAt: new Date().toISOString(),
    members: Array.from({ length: 5 }, (_, i) =>
      ({ member: buildMember({ name: `Alpha Member ${i + 1}` }), manuallySwapped: false })
    ),
  },
  {
    id: "team-2",
    name: "Team Beta",
    sessionId: "session-1",
    presetId: null,
    createdAt: new Date().toISOString(),
    members: Array.from({ length: 5 }, (_, i) =>
      ({ member: buildMember({ name: `Beta Member ${i + 1}` }), manuallySwapped: false })
    ),
  },
];

export const buildTwoTeams = () => ({
  teamA: {
    id: "team-a",
    name: "Team A",
    sessionId: "session-1",
    presetId: null,
    createdAt: new Date().toISOString(),
    members: [
      { member: buildMember({ id: "m1", name: "Alice" }), manuallySwapped: false },
      { member: buildMember({ id: "m2", name: "Bob" }), manuallySwapped: false },
    ],
  } as Team,
  teamB: {
    id: "team-b",
    name: "Team B",
    sessionId: "session-1",
    presetId: null,
    createdAt: new Date().toISOString(),
    members: [
      { member: buildMember({ id: "m3", name: "Carlos" }), manuallySwapped: false },
      { member: buildMember({ id: "m4", name: "Diana" }), manuallySwapped: false },
    ],
  } as Team,
});
