"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRandomizerStore } from "@/store/randomizerStore";
import { useTeamsStore } from "@/store/teamsStore";
import { ConflictBanner } from "./ConflictBanner";
import type { GenerateTeamsResponse, PrimaryTeam } from "@/lib/types";

const SPECIALIZATION_OPTIONS: PrimaryTeam[] = [
  "Backend", "Frontend", "DevOps", "QA / Testing",
  "Mobile", "Data / Analytics", "Full Stack",
];

export function RandomizerPanel() {
  const { config, isGenerating, setConfig, setGenerating } = useRandomizerStore();
  const { setGeneratedTeams, conflicts } = useTeamsStore();
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/teams/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config, persist: true }),
      });
      const data: GenerateTeamsResponse = await res.json();
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Failed to generate teams.");
        return;
      }
      setGeneratedTeams(data.teams, data.conflicts, data.sessionId);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function toggleSpec(spec: PrimaryTeam) {
    const has = config.requiredSpecializations.includes(spec);
    setConfig({
      requiredSpecializations: has
        ? config.requiredSpecializations.filter((s) => s !== spec)
        : [...config.requiredSpecializations, spec],
    });
  }

  return (
    <div className="flex flex-col gap-6 rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800">Randomizer Settings</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Number of Teams"
          type="number"
          min={1}
          value={config.numTeams}
          onChange={(e) => setConfig({ numTeams: parseInt(e.target.value, 10) || 1 })}
        />
        <Input
          label="Min Members / Team"
          type="number"
          min={1}
          placeholder="No minimum"
          value={config.minMembers ?? ""}
          onChange={(e) => setConfig({ minMembers: e.target.value ? parseInt(e.target.value, 10) : undefined })}
        />
        <Input
          label="Max Members / Team"
          type="number"
          min={1}
          placeholder="No maximum"
          value={config.maxMembers ?? ""}
          onChange={(e) => setConfig({ maxMembers: e.target.value ? parseInt(e.target.value, 10) : undefined })}
        />
      </div>

      {/* Constraints */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-700">Constraints</p>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={config.requireSeniorPerTeam}
            onChange={(e) => setConfig({ requireSeniorPerTeam: e.target.checked })}
            className="rounded"
          />
          Require at least one Senior / Lead per team
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={config.groupByShift}
            onChange={(e) => setConfig({ groupByShift: e.target.checked })}
            className="rounded"
          />
          Prefer shift compatibility grouping
        </label>
      </div>

      {/* Required specializations */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-700">Required Specializations (per team)</p>
        <div className="flex flex-wrap gap-2">
          {SPECIALIZATION_OPTIONS.map((spec) => {
            const active = config.requiredSpecializations.includes(spec);
            return (
              <button
                key={spec}
                type="button"
                onClick={() => toggleSpec(spec)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "border-blue-500 bg-blue-100 text-blue-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {spec}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</p>
      )}

      <ConflictBanner conflicts={conflicts} />

      <Button onClick={handleGenerate} loading={isGenerating} size="lg">
        Generate Teams
      </Button>
    </div>
  );
}
