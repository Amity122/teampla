# Product Requirements Document — Teampla

**Version:** 1.0  
**Status:** Draft  
**Author:** Aaron  
**Last Updated:** March 17, 2026  
**Target Team:** IT Department

---

## 1. Overview

### 1.1 Product Summary

Teampla is a web application designed for IT departments to intelligently form balanced, fair, and workload-aware project teams. It enables team members to declare their skills, team alignment, shift schedules, and active project load — then uses that data to generate optimized team compositions with minimal manual intervention.

### 1.2 Problem Statement

Manually forming project teams in an IT department is time-consuming and often leads to:

- Skill imbalances across teams (e.g., all senior devs on one team, juniors on another)
- Overloading members who are already committed to multiple projects
- Ignoring schedule constraints (shift conflicts, WFH vs. on-site mismatches)
- Lack of transparency or member buy-in in the assignment process

### 1.3 Goals

- Allow each IT member to self-declare their profile (skill level, team, shift, schedule)
- Generate balanced teams based on skill, availability, and current project load
- Prioritize members with fewer active projects to prevent task overload
- Provide a drag-to-swap UI for manual adjustments after randomization
- Support saving team presets and exporting results (e.g., to Slack format)

### 1.4 Non-Goals (v1.0)

- Payroll or HR integration
- Cross-department team formation (IT only for v1)
- Real-time project tracking or task management
- Role-based access control beyond basic member/admin distinction

---

## 2. Users & Stakeholders

| Role | Description |
|---|---|
| **IT Member** | Inputs their own profile data; subject to team assignment |
| **Team Lead / Admin** | Manages the randomizer, reviews and adjusts generated teams, exports results |
| **IT Manager** | Views generated teams for planning; may have read-only access |

---

## 3. Core Features

### 3.1 Member Profile Input

Each IT member fills out a self-service profile with the following fields:

#### 3.1.1 Skill Level

- Options: `Junior`, `Mid-level`, `Senior`, `Lead`
- Used to ensure skill balance across generated teams

#### 3.1.2 Team / Specialization

- Options (multi-select or single primary):
  - `Backend`
  - `Frontend`
  - `DevOps`
  - `QA / Testing`
  - `Mobile`
  - `Data / Analytics`
  - `Full Stack`
  - `Other` (free-text field)

#### 3.1.3 Shift Schedule

- Select one primary shift:
  - `Day Shift` (e.g., 8AM–5PM)
  - `Afternoon Shift` (e.g., 2PM–11PM)
  - `Night Shift` (e.g., 10PM–7AM)

#### 3.1.4 Work Location Schedule

A weekly grid (Mon–Sun) where each day is tagged as:

- `On-Site`
- `Work From Home (WFH)`
- `Day Off`

This allows the randomizer to consider overlap in physical presence when needed.

#### 3.1.5 Active Project Count

- A numeric input (or dropdown: `0`, `1`, `2`, `3+`)
- Represents the number of active projects the member is currently committed to
- This is the primary fairness/load-balancing signal

---

### 3.2 Team Randomizer

The core feature of Teampla. Admins configure the randomizer settings and trigger team generation.

#### 3.2.1 Inputs / Constraints

| Constraint | Description |
|---|---|
| **Number of teams** | How many teams to generate |
| **Members per team** | Target team size (can be a range, e.g., 4–6) |
| **Skill balance** | Ensure each team has a mix of skill levels |
| **Specialization coverage** | Optionally require each team to have at least one Backend, one Frontend, etc. |
| **Shift compatibility** | Optionally group or separate members by shift |
| **Project load priority** | Members with fewer active projects are assigned first / weighted higher |

#### 3.2.2 Randomizer Algorithm (High-Level)

1. Sort members by `active_project_count` (ascending — least loaded first)
2. Apply hard constraints (e.g., at least one Senior per team)
3. Distribute members round-robin across teams, respecting skill and specialization targets
4. Shuffle within constraint bounds for variety
5. Flag any unresolvable conflicts for admin review

#### 3.2.3 Output

- Visual team cards showing each member's name, role, skill level, shift, and project load
- Color-coded indicators for workload (green = light, yellow = moderate, red = heavy)
- Summary row per team: avg. skill level, shift distribution, on-site days

---

### 3.3 Drag-to-Swap UI

After randomization, admins can manually adjust the output:

- Drag a member card from one team to another
- On drop, the app validates constraints and shows a warning if the swap violates balance rules (non-blocking — admin can override)
- Swapped members are visually highlighted to track manual changes
- An "Undo" button reverts the last swap
- A "Reset to Generated" button reverts all manual changes

---

### 3.4 Presets

Admins can save and reuse team configuration templates:

- Save current randomizer settings as a named preset (e.g., "Sprint Team — 4 Teams of 5")
- Load a preset to pre-fill randomizer configuration
- Delete or rename presets
- Presets are stored per organization/department

---

### 3.5 Export

Generated teams can be exported in multiple formats:

| Format | Description |
|---|---|
| **Slack format** | Pre-formatted message ready to paste into a Slack channel (team names as bold headers, members as bullet list) |
| **CSV** | Flat file with columns: Team, Name, Role, Skill Level, Shift, Project Count |
| **Copy to Clipboard** | Plain text copy of the full team breakdown |

---

## 4. User Flows

### 4.1 Member Profile Setup

```
Member visits Teampla → Signs in (SSO or invite link)
→ Fills out profile form (skill, team, shift, schedule, project count)
→ Saves profile → Confirmation screen
→ Profile is now visible to admins in the member pool
```

### 4.2 Admin: Generate Teams

```
Admin logs in → Opens Randomizer
→ Reviews member pool (filter by availability, shift, skill)
→ Sets constraints (team count, size, balance rules)
→ Clicks "Generate Teams"
→ Views team cards → Makes drag-to-swap adjustments
→ Saves preset (optional) → Exports to Slack / CSV
```

### 4.3 Member Updates Profile

```
Member logs in → Goes to "My Profile"
→ Updates active project count or schedule
→ Saves → Changes reflected in next randomizer run
```

---

## 5. Data Model (Simplified)

### Member

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Display name |
| `email` | String | Login identifier |
| `skill_level` | Enum | Junior, Mid, Senior, Lead |
| `primary_team` | Enum | Backend, Frontend, DevOps, etc. |
| `shift` | Enum | Day, Afternoon, Night |
| `weekly_schedule` | JSON | `{ mon: "onsite", tue: "wfh", ... }` |
| `active_project_count` | Integer | 0–10+ |
| `updated_at` | Timestamp | Last profile update |

### Team (Generated)

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | e.g., "Team Alpha" |
| `members` | Array[Member] | Assigned members |
| `preset_id` | UUID (nullable) | If generated from a preset |
| `created_at` | Timestamp | Generation timestamp |

### Preset

| Field | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | String | Preset label |
| `config` | JSON | Randomizer settings snapshot |
| `created_by` | UUID | Admin who saved it |

---

## 6. UX & Design Principles

- **Self-service first** — Members manage their own data; no manual admin entry per person
- **Transparency** — Members can see how they are categorized (though not other members' project counts)
- **Non-blocking overrides** — Admins always have final say; constraints are warnings, not hard locks in the UI
- **Mobile-aware** — Profile input should work on mobile; randomizer UI is desktop-first
- **Minimal friction** — Profile setup should take under 3 minutes

---

## 7. Technical Considerations

### 7.1 Frontend

- Framework: React (or Next.js for SSR support)
- Drag-and-drop: `dnd-kit` or `react-beautiful-dnd`
- State management: Zustand or Redux Toolkit

### 7.2 Backend

- REST or GraphQL API
- Auth: SSO (Google Workspace / Azure AD recommended for IT depts) or email invite
- Database: SQLite

### 7.3 Export

- Slack export: Plain text generation (no Slack API integration in v1 — copy-paste approach)
- CSV: Client-side generation via `papaparse` or server-generated download

---

## 8. Constraints & Assumptions

- All members are within the same IT department
- Members are responsible for keeping their project count up to date (no automated sync in v1)
- The randomizer does not guarantee 100% perfect balance — it optimizes within given constraints
- Shift and schedule data is advisory; the randomizer will warn but not block cross-shift team assignments

---

## 9. Success Metrics

| Metric | Target |
|---|---|
| Profile completion rate | ≥ 90% of IT members have a complete profile |
| Time to generate teams | < 30 seconds for up to 50 members |
| Admin satisfaction (survey) | ≥ 4/5 rating on fairness of generated teams |
| Overloaded member rate | 0 members with `active_project_count >= 3` assigned before lighter members |
| Export usage | ≥ 70% of generated teams are exported |

---

## 10. Out of Scope (Future Versions)

- Automated project count sync via Jira / Asana integration
- Member-to-member preference matching ("I work well with X")
- Historical team analytics (who has been teamed with whom)
- Multi-department support
- Slack bot integration for direct posting

---

## 11. Open Questions

1. Should members be able to see other members' profiles, or only admins?
2. Is there a need for an approval workflow before teams are finalized?
3. What happens when a member is on leave — should they be excluded from the pool automatically, or flagged manually?
4. Should the weekly schedule be recurrent (default week) or per-project (specific date range)?
5. Who owns the "active project count" field — the member themselves, or the admin?

---

*This document is a living PRD and should be updated as requirements evolve through discovery and stakeholder feedback.*

---

## 12. Unit Tests & Test Cases

This section defines the unit tests and test cases that must pass before each feature is considered complete. Tests are organized by feature area and follow the **Arrange → Act → Assert** pattern.

---

### 12.1 Member Profile Validation

#### Unit Tests

```typescript
// memberProfile.test.ts

describe("Member Profile Validation", () => {

  describe("Skill Level", () => {
    test("UT-MP-01: accepts valid skill levels", () => {
      const validLevels = ["Junior", "Mid-level", "Senior", "Lead"];
      validLevels.forEach(level => {
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
      const validTeams = ["Backend", "Frontend", "DevOps", "QA / Testing", "Mobile", "Data / Analytics", "Full Stack"];
      validTeams.forEach(team => {
        expect(validateTeam(team)).toBe(true);
      });
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
      const validShifts = ["Day Shift", "Afternoon Shift", "Night Shift"];
      validShifts.forEach(shift => {
        expect(validateShift(shift)).toBe(true);
      });
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
        thu: "wfh", fri: "onsite", sat: "dayoff", sun: "dayoff"
      };
      expect(validateWeeklySchedule(schedule)).toBe(true);
    });

    test("UT-MP-09: rejects schedule with missing days", () => {
      const incomplete = { mon: "onsite", tue: "wfh" };
      expect(validateWeeklySchedule(incomplete)).toBe(false);
    });

    test("UT-MP-10: rejects schedule with invalid day values", () => {
      const invalid = {
        mon: "remote", tue: "wfh", wed: "onsite",
        thu: "wfh", fri: "onsite", sat: "dayoff", sun: "dayoff"
      };
      expect(validateWeeklySchedule(invalid)).toBe(false);
    });
  });

  describe("Active Project Count", () => {
    test("UT-MP-11: accepts valid project count (0 to 10)", () => {
      [0, 1, 2, 3, 10].forEach(count => {
        expect(validateProjectCount(count)).toBe(true);
      });
    });

    test("UT-MP-12: rejects negative values and non-integers", () => {
      expect(validateProjectCount(-1)).toBe(false);
      expect(validateProjectCount(1.5)).toBe(false);
      expect(validateProjectCount(null)).toBe(false);
    });
  });

  describe("Full Profile Submission", () => {
    test("UT-MP-13: saves a valid complete profile successfully", async () => {
      const profile = buildValidProfile();
      const result = await saveProfile(profile);
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    test("UT-MP-14: rejects submission with missing required fields", async () => {
      const incompleteProfile = { name: "Juan dela Cruz" };
      const result = await saveProfile(incompleteProfile);
      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
```

---

### 12.2 Randomizer Algorithm

#### Unit Tests

```typescript
// randomizer.test.ts

describe("Team Randomizer", () => {

  describe("Project Load Priority", () => {
    test("UT-RZ-01: members with fewer projects are assigned before heavier ones", () => {
      const members = [
        buildMember({ name: "A", active_project_count: 3 }),
        buildMember({ name: "B", active_project_count: 0 }),
        buildMember({ name: "C", active_project_count: 1 }),
      ];
      const sorted = sortByProjectLoad(members);
      expect(sorted[0].name).toBe("B");
      expect(sorted[1].name).toBe("C");
      expect(sorted[2].name).toBe("A");
    });

    test("UT-RZ-02: members with equal project count maintain relative order (stable sort)", () => {
      const members = [
        buildMember({ name: "X", active_project_count: 1 }),
        buildMember({ name: "Y", active_project_count: 1 }),
      ];
      const sorted = sortByProjectLoad(members);
      expect(sorted[0].name).toBe("X");
      expect(sorted[1].name).toBe("Y");
    });
  });

  describe("Skill Balance", () => {
    test("UT-RZ-03: each generated team has at least one Senior or Lead when possible", () => {
      const members = [
        buildMember({ skill_level: "Senior" }),
        buildMember({ skill_level: "Junior" }),
        buildMember({ skill_level: "Lead" }),
        buildMember({ skill_level: "Junior" }),
      ];
      const teams = generateTeams(members, { teamCount: 2, requireSeniorPerTeam: true });
      teams.forEach(team => {
        const hasSenior = team.members.some(m => ["Senior", "Lead"].includes(m.skill_level));
        expect(hasSenior).toBe(true);
      });
    });

    test("UT-RZ-04: flags conflict when there are not enough Seniors for all teams", () => {
      const members = [
        buildMember({ skill_level: "Senior" }),
        buildMember({ skill_level: "Junior" }),
        buildMember({ skill_level: "Junior" }),
        buildMember({ skill_level: "Junior" }),
      ];
      const result = generateTeams(members, { teamCount: 2, requireSeniorPerTeam: true });
      expect(result.conflicts.length).toBeGreaterThan(0);
      expect(result.conflicts[0].type).toBe("INSUFFICIENT_SENIORS");
    });
  });

  describe("Specialization Coverage", () => {
    test("UT-RZ-05: each team includes at least one Backend and one Frontend when required", () => {
      const members = [
        buildMember({ primary_team: "Backend" }),
        buildMember({ primary_team: "Frontend" }),
        buildMember({ primary_team: "Backend" }),
        buildMember({ primary_team: "Frontend" }),
      ];
      const teams = generateTeams(members, {
        teamCount: 2,
        requiredSpecializations: ["Backend", "Frontend"]
      });
      teams.forEach(team => {
        const specs = team.members.map(m => m.primary_team);
        expect(specs).toContain("Backend");
        expect(specs).toContain("Frontend");
      });
    });
  });

  describe("Team Size", () => {
    test("UT-RZ-06: generated teams respect the target size range", () => {
      const members = Array.from({ length: 10 }, (_, i) => buildMember({ name: `Member${i}` }));
      const teams = generateTeams(members, { teamCount: 2, minSize: 4, maxSize: 6 });
      teams.forEach(team => {
        expect(team.members.length).toBeGreaterThanOrEqual(4);
        expect(team.members.length).toBeLessThanOrEqual(6);
      });
    });

    test("UT-RZ-07: all members are assigned — no one is left out", () => {
      const members = Array.from({ length: 9 }, (_, i) => buildMember({ name: `M${i}` }));
      const teams = generateTeams(members, { teamCount: 3 });
      const totalAssigned = teams.reduce((sum, t) => sum + t.members.length, 0);
      expect(totalAssigned).toBe(9);
    });

    test("UT-RZ-08: handles uneven distribution gracefully (e.g., 10 members into 3 teams)", () => {
      const members = Array.from({ length: 10 }, (_, i) => buildMember({ name: `M${i}` }));
      const teams = generateTeams(members, { teamCount: 3 });
      const sizes = teams.map(t => t.members.length).sort();
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
    });
  });

  describe("Edge Cases", () => {
    test("UT-RZ-09: returns empty result with an empty member pool", () => {
      const result = generateTeams([], { teamCount: 2 });
      expect(result.teams).toHaveLength(0);
      expect(result.conflicts).toContainEqual(expect.objectContaining({ type: "EMPTY_POOL" }));
    });

    test("UT-RZ-10: handles single-member pool gracefully", () => {
      const members = [buildMember({ name: "Solo" })];
      const result = generateTeams(members, { teamCount: 1 });
      expect(result.teams[0].members[0].name).toBe("Solo");
    });

    test("UT-RZ-11: does not assign the same member to multiple teams", () => {
      const members = Array.from({ length: 6 }, (_, i) => buildMember({ id: `id-${i}` }));
      const teams = generateTeams(members, { teamCount: 2 });
      const allIds = teams.flatMap(t => t.members.map(m => m.id));
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });
  });
});
```

---

### 12.3 Drag-to-Swap UI

#### Unit Tests

```typescript
// dragSwap.test.ts

describe("Drag-to-Swap Logic", () => {

  test("UT-DS-01: successfully swaps two members between teams", () => {
    const { teamA, teamB } = buildTwoTeams();
    const memberFromA = teamA.members[0];
    const memberFromB = teamB.members[0];
    const result = swapMembers(teamA, memberFromA, teamB, memberFromB);
    expect(result.teamA.members).toContain(memberFromB);
    expect(result.teamB.members).toContain(memberFromA);
  });

  test("UT-DS-02: emits a constraint warning when swap violates skill balance (non-blocking)", () => {
    const { teamA, teamB } = buildImbalancedTeams();
    const result = swapMembers(teamA, teamA.members[0], teamB, teamB.members[0]);
    expect(result.warning).toBeDefined();
    expect(result.warning.type).toBe("SKILL_IMBALANCE");
    expect(result.success).toBe(true);
  });

  test("UT-DS-03: undo reverts the last swap correctly", () => {
    const { teamA, teamB } = buildTwoTeams();
    const original = deepClone({ teamA, teamB });
    const afterSwap = swapMembers(teamA, teamA.members[0], teamB, teamB.members[0]);
    const afterUndo = undoLastSwap(afterSwap.history);
    expect(afterUndo.teamA.members).toEqual(original.teamA.members);
    expect(afterUndo.teamB.members).toEqual(original.teamB.members);
  });

  test("UT-DS-04: 'Reset to Generated' restores original team composition", () => {
    const original = buildGeneratedTeams();
    const modified = applyMultipleSwaps(original, 3);
    const reset = resetToGenerated(modified, original);
    expect(reset).toEqual(original);
  });

  test("UT-DS-05: swapped members are flagged as manually modified", () => {
    const { teamA, teamB } = buildTwoTeams();
    const result = swapMembers(teamA, teamA.members[0], teamB, teamB.members[0]);
    const movedMember = result.teamA.members.find(m => m.id === teamB.members[0].id);
    expect(movedMember.manuallySwapped).toBe(true);
  });
});
```

---

### 12.4 Preset Management

#### Unit Tests

```typescript
// presets.test.ts

describe("Preset Management", () => {

  test("UT-PR-01: saves a preset with a valid name and config", async () => {
    const config = buildValidConfig();
    const result = await savePreset("Sprint Week 10 — 4 Teams", config);
    expect(result.success).toBe(true);
    expect(result.preset.id).toBeDefined();
  });

  test("UT-PR-02: rejects preset with empty name", async () => {
    const result = await savePreset("", buildValidConfig());
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/name is required/i);
  });

  test("UT-PR-03: loads a saved preset and pre-fills randomizer config", async () => {
    const preset = await getPreset("preset-id-123");
    const config = loadPresetConfig(preset);
    expect(config.teamCount).toBe(preset.config.teamCount);
    expect(config.minSize).toBe(preset.config.minSize);
  });

  test("UT-PR-04: deletes a preset and confirms it no longer exists", async () => {
    const { id } = await savePreset("To Delete", buildValidConfig());
    await deletePreset(id);
    const result = await getPreset(id);
    expect(result).toBeNull();
  });

  test("UT-PR-05: renames a preset successfully", async () => {
    const { id } = await savePreset("Old Name", buildValidConfig());
    await renamePreset(id, "New Name");
    const updated = await getPreset(id);
    expect(updated.name).toBe("New Name");
  });
});
```

---

### 12.5 Export

#### Unit Tests

```typescript
// export.test.ts

describe("Export Functions", () => {

  describe("Slack Format", () => {
    test("UT-EX-01: generates valid Slack-formatted output", () => {
      const teams = buildSampleTeams();
      const output = exportToSlack(teams);
      expect(output).toContain("*Team Alpha*");
      expect(output).toContain("• ");
      expect(typeof output).toBe("string");
    });

    test("UT-EX-02: each member appears exactly once in Slack output", () => {
      const teams = buildSampleTeams();
      const output = exportToSlack(teams);
      const memberNames = teams.flatMap(t => t.members.map(m => m.name));
      memberNames.forEach(name => {
        const count = (output.match(new RegExp(name, "g")) || []).length;
        expect(count).toBe(1);
      });
    });
  });

  describe("CSV Format", () => {
    test("UT-EX-03: generates a CSV with the correct headers", () => {
      const teams = buildSampleTeams();
      const csv = exportToCSV(teams);
      const headers = csv.split("\n")[0];
      expect(headers).toBe("Team,Name,Role,Skill Level,Shift,Project Count");
    });

    test("UT-EX-04: CSV row count equals total member count plus header", () => {
      const teams = buildSampleTeams(); // 10 total members
      const csv = exportToCSV(teams);
      const rows = csv.trim().split("\n");
      expect(rows.length).toBe(11); // 1 header + 10 members
    });

    test("UT-EX-05: CSV handles member names with commas correctly (quoted)", () => {
      const teams = [buildTeamWithMember({ name: "De Leon, Juan" })];
      const csv = exportToCSV(teams);
      expect(csv).toContain('"De Leon, Juan"');
    });
  });

  describe("Clipboard Copy", () => {
    test("UT-EX-06: plain text output contains all team names and members", () => {
      const teams = buildSampleTeams();
      const text = exportToPlainText(teams);
      teams.forEach(team => {
        expect(text).toContain(team.name);
        team.members.forEach(m => expect(text).toContain(m.name));
      });
    });
  });
});
```

---

### 12.6 End-to-End Test Cases

These are integration/E2E scenarios that validate full user flows.

| ID | Scenario | Steps | Expected Result |
|---|---|---|---|
| **E2E-01** | Member completes profile setup | 1. Visit Teampla → 2. Sign in → 3. Fill all profile fields → 4. Save | Profile saved; member appears in admin's member pool |
| **E2E-02** | Admin generates a balanced team of 4 | 1. Login as admin → 2. Set: 1 team, 4 members → 3. Click Generate | One team of 4 members is displayed with skill and load data |
| **E2E-03** | Admin generates teams with skill balance constraint | 1. 8 members (2 Senior, 2 Mid, 4 Junior) → 2. Generate 2 teams with skill balance ON | Each team has 1 Senior, 1 Mid, 2 Junior |
| **E2E-04** | Project load priority is respected | 1. Member A has 0 projects, Member B has 3 → 2. Generate 1 team, 1 slot remaining | Member A is assigned first; B is deprioritized |
| **E2E-05** | Admin swaps two members post-generation | 1. Generate teams → 2. Drag member from Team 1 to Team 2 | Members swap; both cards update; swap is flagged as manual |
| **E2E-06** | Undo a swap | 1. Perform a swap → 2. Click Undo | Teams revert to pre-swap state |
| **E2E-07** | Reset all manual swaps | 1. Perform 3 swaps → 2. Click "Reset to Generated" | All teams revert to the originally generated state |
| **E2E-08** | Save and reload a preset | 1. Configure randomizer → 2. Save as "Sprint 11" → 3. Reload page → 4. Load "Sprint 11" | Randomizer fields are pre-filled with saved config |
| **E2E-09** | Export teams to Slack format | 1. Generate teams → 2. Click "Export → Slack" | Formatted text is copied; pasting into Slack renders correctly |
| **E2E-10** | Export teams to CSV | 1. Generate teams → 2. Click "Export → CSV" | A `.csv` file downloads with correct headers and all member data |
| **E2E-11** | Profile update reflects in next randomizer run | 1. Member updates project count from 1 to 3 → 2. Admin runs randomizer | Updated count is used in load-balancing calculation |
| **E2E-12** | Constraint conflict is surfaced for admin | 1. Only 1 Senior in pool → 2. Generate 3 teams with Senior-per-team required | Teams are generated; a conflict warning displays for teams missing a Senior |
| **E2E-13** | Incomplete profile is rejected on save | 1. Fill only name and email → 2. Click Save | Validation errors shown per missing field; form not submitted |
| **E2E-14** | Member cannot view other members' project counts | 1. Login as member → 2. Navigate to team view or member list | Own profile visible; other members' project counts are hidden |
| **E2E-15** | Performance: generate teams for 50 members in under 30s | 1. Load 50 member profiles → 2. Generate 5 teams of 10 | Teams generated and rendered in < 30 seconds |

---

### 12.7 Test Utilities (Shared Fixtures)

```typescript
// testUtils.ts

export const buildMember = (overrides = {}) => ({
  id: crypto.randomUUID(),
  name: "Test Member",
  email: "test@example.com",
  skill_level: "Mid-level",
  primary_team: "Backend",
  shift: "Day Shift",
  weekly_schedule: {
    mon: "onsite", tue: "wfh", wed: "onsite",
    thu: "wfh", fri: "onsite", sat: "dayoff", sun: "dayoff"
  },
  active_project_count: 1,
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const buildValidProfile = () => buildMember();

export const buildValidConfig = () => ({
  teamCount: 2,
  minSize: 3,
  maxSize: 5,
  requireSeniorPerTeam: false,
  requiredSpecializations: [],
  shiftCompatibility: false,
});

export const buildSampleTeams = () => [
  {
    id: "team-1",
    name: "Team Alpha",
    members: Array.from({ length: 5 }, (_, i) => buildMember({ name: `Alpha Member ${i + 1}` })),
  },
  {
    id: "team-2",
    name: "Team Beta",
    members: Array.from({ length: 5 }, (_, i) => buildMember({ name: `Beta Member ${i + 1}` })),
  },
];

export const buildTwoTeams = () => ({
  teamA: {
    id: "team-a",
    name: "Team A",
    members: [buildMember({ id: "m1", name: "Alice" }), buildMember({ id: "m2", name: "Bob" })],
  },
  teamB: {
    id: "team-b",
    name: "Team B",
    members: [buildMember({ id: "m3", name: "Carlos" }), buildMember({ id: "m4", name: "Diana" })],
  },
});
```

---

*All unit tests should be run via the project's test runner (e.g., `jest` or `vitest`) as part of CI/CD. E2E tests should be run via Playwright or Cypress against a staging environment before each release.*