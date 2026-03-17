/**
 * Team generation algorithm — pure function, no side effects.
 *
 * Ported from app/services/randomizer.py. Algorithm steps (per PRD §3.2.2):
 *  1. Guard checks
 *  2. Sort by active_project_count ascending
 *  3. Seed one Senior/Lead per team (if require_senior_per_team)
 *  4. Seed required specializations
 *  5. Shuffle remaining within project-count groups for variety
 *  6. Round-robin distribute remaining members
 *  7. Optional shift-affinity grouping
 *  8. Intra-team display shuffle (seniors first)
 *  9. Validate size constraints
 * 10. Build and return response
 */

import type {
  ConflictInfo,
  GenerateTeamsResponse,
  Member,
  RandomizerConfig,
  SkillLevel,
  Team,
  TeamMemberInfo,
} from "./types";

const TEAM_NAMES = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon",
  "Zeta", "Eta", "Theta", "Iota", "Kappa",
  "Lambda", "Mu", "Nu", "Xi", "Omicron",
  "Pi", "Rho", "Sigma", "Tau", "Upsilon",
];

const SENIOR_LEVELS: SkillLevel[] = ["Senior", "Lead"];

function teamName(index: number): string {
  return index < TEAM_NAMES.length ? `Team ${TEAM_NAMES[index]}` : `Team ${index + 1}`;
}

/** Seeded linear congruential generator — returns a [0,1) float. */
function makePrng(seed: number) {
  let s = seed >>> 0;
  return (): number => {
    s = Math.imul(s, 1664525) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

function shuffle<T>(arr: T[], random: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isSenior(m: Member): boolean {
  return SENIOR_LEVELS.includes(m.skillLevel);
}

function newId(): string {
  return crypto.randomUUID();
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function generateTeams(
  members: Member[],
  config: RandomizerConfig
): GenerateTeamsResponse {
  const sessionId = newId();
  const conflicts: ConflictInfo[] = [];
  const now = new Date().toISOString();
  const random = config.seed != null ? makePrng(config.seed) : Math.random;

  // Step 1 — Guard
  if (members.length === 0) {
    return {
      sessionId,
      teams: [],
      conflicts: [{ type: "EMPTY_POOL", message: "No members in the pool." }],
      generatedAt: now,
      config,
    };
  }

  const numTeams = config.numTeams;

  if (members.length < numTeams) {
    conflicts.push({
      type: "SIZE_VIOLATION",
      message: `Only ${members.length} member(s) for ${numTeams} teams. Some teams will be empty.`,
    });
  }

  // Step 2 — Sort by project load
  let pool: Member[] = [...members].sort(
    (a, b) => a.activeProjectCount - b.activeProjectCount
  );

  // team_slots[i] = array of { member, manuallySwapped }
  const slots: Array<Array<{ member: Member; manuallySwapped: boolean }>> = Array.from(
    { length: numTeams },
    () => []
  );
  const assignedIds = new Set<string>();

  function assign(teamIdx: number, member: Member) {
    slots[teamIdx].push({ member, manuallySwapped: false });
    assignedIds.add(member.id);
    pool = pool.filter((m) => m.id !== member.id);
  }

  // Step 3 — Seed one Senior/Lead per team
  if (config.requireSeniorPerTeam) {
    const seniors = pool.filter(isSenior);
    if (seniors.length < numTeams) {
      conflicts.push({
        type: "INSUFFICIENT_SENIORS",
        message: `Only ${seniors.length} Senior/Lead member(s) for ${numTeams} team(s). ${numTeams - seniors.length} team(s) will lack a senior.`,
      });
    }
    const shuffledSeniors = shuffle(seniors, random);
    shuffledSeniors.forEach((s, i) => assign(i % numTeams, s));
  }

  // Step 4 — Seed required specializations
  for (const spec of config.requiredSpecializations) {
    for (let ti = 0; ti < numTeams; ti++) {
      const alreadyHas = slots[ti].some((e) => e.member.primaryTeam === spec);
      if (alreadyHas) continue;
      const candidate = pool.find((m) => m.primaryTeam === spec);
      if (!candidate) {
        conflicts.push({
          type: "INSUFFICIENT_SPECIALIZATION",
          message: `No available ${spec} member for team ${ti + 1}.`,
        });
        continue;
      }
      assign(ti, candidate);
    }
  }

  // Step 5 — Shuffle remaining within project-count groups
  const groups = new Map<number, Member[]>();
  for (const m of pool) {
    const g = groups.get(m.activeProjectCount) ?? [];
    g.push(m);
    groups.set(m.activeProjectCount, g);
  }
  let shuffledPool: Member[] = [];
  for (const key of [...groups.keys()].sort((a, b) => a - b)) {
    shuffledPool = shuffledPool.concat(shuffle(groups.get(key)!, random));
  }

  // Steps 6 & 7 — Round-robin (with optional shift affinity)
  const startIdx = slots.reduce(
    (minI, slot, i, arr) => (slot.length < arr[minI].length ? i : minI),
    0
  );

  if (config.groupByShift && shuffledPool.length > 0) {
    const dominantShift = (slot: typeof slots[0]) => {
      if (slot.length === 0) return null;
      const counts: Record<string, number> = {};
      for (const { member } of slot) counts[member.shift] = (counts[member.shift] ?? 0) + 1;
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    };
    for (const member of shuffledPool) {
      const preferred = slots
        .map((slot, i) => ({ i, match: dominantShift(slot) === member.shift }))
        .filter((x) => x.match)
        .map((x) => x.i);
      const target =
        preferred.length > 0
          ? preferred.reduce((a, b) => (slots[a].length <= slots[b].length ? a : b))
          : slots.reduce((minI, slot, i, arr) => (slot.length < arr[minI].length ? i : minI), 0);
      slots[target].push({ member, manuallySwapped: false });
    }
  } else {
    shuffledPool.forEach((member, offset) => {
      const teamIdx = (startIdx + offset) % numTeams;
      slots[teamIdx].push({ member, manuallySwapped: false });
    });
  }

  // Step 8 — Intra-team display order: seniors first, then ascending by project load
  for (const slot of slots) {
    const seniors = slot.filter((e) => isSenior(e.member));
    const others = slot
      .filter((e) => !isSenior(e.member))
      .sort((a, b) => a.member.activeProjectCount - b.member.activeProjectCount);
    slot.splice(0, slot.length, ...seniors, ...others);
  }

  // Step 9 — Validate sizes
  slots.forEach((slot, i) => {
    if (config.minMembers != null && slot.length < config.minMembers) {
      conflicts.push({
        type: "SIZE_VIOLATION",
        message: `Team ${i + 1} has ${slot.length} member(s), below minimum of ${config.minMembers}.`,
      });
    }
    if (config.maxMembers != null && slot.length > config.maxMembers) {
      conflicts.push({
        type: "SIZE_VIOLATION",
        message: `Team ${i + 1} has ${slot.length} member(s), above maximum of ${config.maxMembers}.`,
      });
    }
    if (config.requireSeniorPerTeam && !slot.some((e) => isSenior(e.member))) {
      conflicts.push({
        type: "INSUFFICIENT_SENIORS",
        message: `Team ${i + 1} has no Senior or Lead member.`,
      });
    }
  });

  // Step 10 — Build response
  const teams: Team[] = slots.map((slot, i) => ({
    id: newId(),
    name: teamName(i),
    sessionId,
    presetId: null,
    createdAt: now,
    members: slot.map(
      ({ member, manuallySwapped }): TeamMemberInfo => ({ member, manuallySwapped })
    ),
  }));

  return { sessionId, teams, conflicts, generatedAt: now, config };
}

// ─── Swap helpers (used by teamsStore) ───────────────────────────────────────

export type SwapResult = {
  teams: Team[];
  warning?: { type: string; message: string };
};

export function swapMembers(
  teams: Team[],
  memberIdA: string,
  teamIdA: string,
  memberIdB: string,
  teamIdB: string
): SwapResult {
  const updated = teams.map((t) => ({ ...t, members: [...t.members] }));

  const teamA = updated.find((t) => t.id === teamIdA);
  const teamB = updated.find((t) => t.id === teamIdB);
  if (!teamA || !teamB) return { teams };

  const idxA = teamA.members.findIndex((e) => e.member.id === memberIdA);
  const idxB = teamB.members.findIndex((e) => e.member.id === memberIdB);
  if (idxA === -1 || idxB === -1) return { teams };

  const memberA = { ...teamA.members[idxA], manuallySwapped: true };
  const memberB = { ...teamB.members[idxB], manuallySwapped: true };

  teamA.members[idxA] = { member: memberB.member, manuallySwapped: true };
  teamB.members[idxB] = { member: memberA.member, manuallySwapped: true };

  // Advisory skill-imbalance warning (non-blocking per PRD §3.3)
  const aIsSenior = SENIOR_LEVELS.includes(memberA.member.skillLevel);
  const bIsSenior = SENIOR_LEVELS.includes(memberB.member.skillLevel);
  const warning =
    aIsSenior !== bIsSenior
      ? {
          type: "SKILL_IMBALANCE",
          message:
            "This swap may create a skill imbalance — one team may gain more senior members than the other.",
        }
      : undefined;

  return { teams: updated, warning };
}
