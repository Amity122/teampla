"use client";

import { create } from "zustand";
import { swapMembers } from "@/lib/randomizer";
import type { ConflictInfo, Team } from "@/lib/types";

interface TeamsState {
  /** Live team state shown in the board UI */
  currentTeams: Team[];
  /** Immutable snapshot of the originally generated teams (for "Reset to Generated") */
  generatedTeams: Team[];
  /** Undo stack — each entry is the full teams state before a swap */
  swapHistory: Team[][];
  /** Conflicts from the last randomizer run */
  conflicts: ConflictInfo[];
  /** Session ID of the current randomizer run */
  sessionId: string | null;
  /** Advisory warning from the last swap */
  lastSwapWarning: { type: string; message: string } | null;

  // Actions
  setGeneratedTeams: (teams: Team[], conflicts: ConflictInfo[], sessionId: string) => void;
  swapMembersBetweenTeams: (
    memberIdA: string,
    teamIdA: string,
    memberIdB: string,
    teamIdB: string
  ) => void;
  undoLastSwap: () => void;
  resetToGenerated: () => void;
  clearWarning: () => void;
}

export const useTeamsStore = create<TeamsState>((set, get) => ({
  currentTeams: [],
  generatedTeams: [],
  swapHistory: [],
  conflicts: [],
  sessionId: null,
  lastSwapWarning: null,

  setGeneratedTeams(teams, conflicts, sessionId) {
    set({
      currentTeams: teams,
      generatedTeams: teams,
      swapHistory: [],
      conflicts,
      sessionId,
      lastSwapWarning: null,
    });
  },

  swapMembersBetweenTeams(memberIdA, teamIdA, memberIdB, teamIdB) {
    const { currentTeams, swapHistory } = get();
    const { teams: updated, warning } = swapMembers(
      currentTeams,
      memberIdA,
      teamIdA,
      memberIdB,
      teamIdB
    );
    set({
      swapHistory: [...swapHistory, currentTeams],
      currentTeams: updated,
      lastSwapWarning: warning ?? null,
    });
  },

  undoLastSwap() {
    const { swapHistory } = get();
    if (swapHistory.length === 0) return;
    const previous = swapHistory[swapHistory.length - 1];
    set({
      currentTeams: previous,
      swapHistory: swapHistory.slice(0, -1),
      lastSwapWarning: null,
    });
  },

  resetToGenerated() {
    const { generatedTeams } = get();
    set({ currentTeams: generatedTeams, swapHistory: [], lastSwapWarning: null });
  },

  clearWarning() {
    set({ lastSwapWarning: null });
  },
}));
