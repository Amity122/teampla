import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Return the workload colour token for a given active project count. */
export function workloadColor(count: number): "green" | "yellow" | "red" {
  if (count === 0) return "green";
  if (count <= 2) return "yellow";
  return "red";
}

/** Display the team name, falling back to the free-text value for "Other". */
export function displayTeam(member: {
  primaryTeam: string;
  otherTeamName?: string | null;
}): string {
  return member.primaryTeam === "Other" && member.otherTeamName
    ? member.otherTeamName
    : member.primaryTeam;
}

/**
 * Map a generated team name (e.g. "Team Alpha") to a Tailwind bg + text color pair.
 * Returns classes for a colored indicator dot/strip.
 */
const TEAM_COLOR_MAP: Record<string, { bg: string; text: string; border: string }> = {
  Alpha:   { bg: "bg-blue-500",   text: "text-blue-700",   border: "border-blue-400" },
  Beta:    { bg: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-400" },
  Gamma:   { bg: "bg-purple-500", text: "text-purple-700", border: "border-purple-400" },
  Delta:   { bg: "bg-orange-500", text: "text-orange-700", border: "border-orange-400" },
  Epsilon: { bg: "bg-rose-500",   text: "text-rose-700",   border: "border-rose-400" },
  Zeta:    { bg: "bg-pink-500",   text: "text-pink-700",   border: "border-pink-400" },
  Eta:     { bg: "bg-yellow-500", text: "text-yellow-700", border: "border-yellow-400" },
  Theta:   { bg: "bg-teal-500",   text: "text-teal-700",   border: "border-teal-400" },
  Iota:    { bg: "bg-indigo-500", text: "text-indigo-700", border: "border-indigo-400" },
  Kappa:   { bg: "bg-cyan-500",   text: "text-cyan-700",   border: "border-cyan-400" },
  Lambda:  { bg: "bg-lime-500",   text: "text-lime-700",   border: "border-lime-400" },
  Mu:      { bg: "bg-amber-500",  text: "text-amber-700",  border: "border-amber-400" },
  Nu:      { bg: "bg-sky-500",    text: "text-sky-700",    border: "border-sky-400" },
  Xi:      { bg: "bg-violet-500", text: "text-violet-700", border: "border-violet-400" },
  Omicron: { bg: "bg-red-500",    text: "text-red-700",    border: "border-red-400" },
  Pi:      { bg: "bg-green-500",  text: "text-green-700",  border: "border-green-400" },
  Rho:     { bg: "bg-fuchsia-500",text: "text-fuchsia-700",border: "border-fuchsia-400" },
  Sigma:   { bg: "bg-blue-400",   text: "text-blue-600",   border: "border-blue-300" },
  Tau:     { bg: "bg-emerald-400",text: "text-emerald-600",border: "border-emerald-300" },
  Upsilon: { bg: "bg-purple-400", text: "text-purple-600", border: "border-purple-300" },
};

const FALLBACK_COLORS = { bg: "bg-gray-400", text: "text-gray-600", border: "border-gray-300" };

export function teamColors(teamName: string) {
  // "Team Alpha" → "Alpha"
  const suffix = teamName.replace(/^Team\s+/i, "");
  return TEAM_COLOR_MAP[suffix] ?? FALLBACK_COLORS;
}
