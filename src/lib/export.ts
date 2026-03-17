/**
 * Export formatters — pure functions, no side effects.
 * Ported from app/services/export.py.
 */

import type { Team } from "./types";
import { displayTeam } from "./utils";

export function formatSlack(teams: Team[]): string {
  return teams
    .map((team) => {
      const header = `*${team.name}*`;
      const rows = team.members.map(({ member, manuallySwapped }) => {
        const projects = `${member.activeProjectCount} project${member.activeProjectCount !== 1 ? "s" : ""}`;
        const flag = manuallySwapped ? " _(manually adjusted)_" : "";
        return `• ${member.name} (${member.skillLevel} · ${displayTeam(member)} · ${member.shift} · ${projects})${flag}`;
      });
      return [header, ...rows].join("\n");
    })
    .join("\n\n");
}

export function formatCSV(teams: Team[]): string {
  const header = "Team,Name,Skill Level,Specialization,Shift,Active Projects";
  const rows = teams.flatMap((team) =>
    team.members.map(({ member }) => {
      const cells = [
        team.name,
        member.name,
        member.skillLevel,
        displayTeam(member),
        member.shift,
        String(member.activeProjectCount),
      ].map((v) => (v.includes(",") ? `"${v}"` : v));
      return cells.join(",");
    })
  );
  return [header, ...rows].join("\n");
}

export function formatPlainText(teams: Team[]): string {
  return teams
    .map((team) => {
      const divider = "-".repeat(team.name.length);
      const rows = team.members.map(({ member, manuallySwapped }) => {
        const projects = `${member.activeProjectCount} project${member.activeProjectCount !== 1 ? "s" : ""}`;
        const flag = manuallySwapped ? " [manually adjusted]" : "";
        return `  - ${member.name} (${member.skillLevel}, ${displayTeam(member)}, ${member.shift}, ${projects})${flag}`;
      });
      return [team.name, divider, ...rows].join("\n");
    })
    .join("\n\n");
}
