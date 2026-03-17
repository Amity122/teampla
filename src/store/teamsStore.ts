"use client";

import { create } from "zustand";
import { swapMembers } from "@/lib/randomizer";
import type { ConflictInfo, PairingConstraint, Team } from "@/lib/types";

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
  /** Advisory warnings from the last swap */
  lastSwapWarnings: { type: string; message: string }[];

  // Actions
  setGeneratedTeams: (teams: Team[], conflicts: ConflictInfo[], sessionId: string) => void;
  swapMembersBetweenTeams: (
    memberIdA: string,
    teamIdA: string,
    memberIdB: string,
    teamIdB: string,
    pairingConstraints?: PairingConstraint[]
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
  lastSwapWarnings: [],

  setGeneratedTeams(teams, conflicts, sessionId) {
    set({
      currentTeams: teams,
      generatedTeams: teams,
      swapHistory: [],
      conflicts,
      sessionId,
      lastSwapWarnings: [],
    });
  },

  swapMembersBetweenTeams(memberIdA, teamIdA, memberIdB, teamIdB, pairingConstraints) {
    const { currentTeams, swapHistory } = get();
    const { teams: updated, warnings } = swapMembers(
      currentTeams,
      memberIdA,
      teamIdA,
      memberIdB,
      teamIdB,
      pairingConstraints
    );
    set({
      swapHistory: [...swapHistory, currentTeams],
      currentTeams: updated,
      lastSwapWarnings: warnings,
    });
  },

  undoLastSwap() {
    const { swapHistory } = get();
    if (swapHistory.length === 0) return;
    const previous = swapHistory[swapHistory.length - 1];
    set({
      currentTeams: previous,
      swapHistory: swapHistory.slice(0, -1),
      lastSwapWarnings: [],
    });
  },

  resetToGenerated() {
    const { generatedTeams } = get();
    set({ currentTeams: generatedTeams, swapHistory: [], lastSwapWarnings: [] });
  },

  clearWarning() {
    set({ lastSwapWarnings: [] });
  },
}));
