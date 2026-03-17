"use client";

import { create } from "zustand";
import type { RandomizerConfig } from "@/lib/types";

const DEFAULT_CONFIG: RandomizerConfig = {
  numTeams: 2,
  minMembers: undefined,
  maxMembers: undefined,
  requireSeniorPerTeam: true,
  requiredSpecializations: [],
  groupByShift: false,
  memberIds: undefined,
  seed: undefined,
  pairingConstraints: [],
};

interface RandomizerState {
  config: RandomizerConfig;
  isGenerating: boolean;
  setConfig: (config: Partial<RandomizerConfig>) => void;
  loadPreset: (config: RandomizerConfig) => void;
  resetConfig: () => void;
  setGenerating: (v: boolean) => void;
}

export const useRandomizerStore = create<RandomizerState>((set) => ({
  config: DEFAULT_CONFIG,
  isGenerating: false,

  setConfig(partial) {
    set((state) => ({ config: { ...state.config, ...partial } }));
  },

  loadPreset(config) {
    set({ config });
  },

  resetConfig() {
    set({ config: DEFAULT_CONFIG });
  },

  setGenerating(v) {
    set({ isGenerating: v });
  },
}));
