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
