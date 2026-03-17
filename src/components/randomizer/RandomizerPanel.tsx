"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRandomizerStore } from "@/store/randomizerStore";
import { useTeamsStore } from "@/store/teamsStore";
import { ConflictBanner } from "./ConflictBanner";
import type { GenerateTeamsResponse, Member, PairingConstraint, PrimaryTeam } from "@/lib/types";

const SPECIALIZATION_OPTIONS: PrimaryTeam[] = [
  "Backend", "Frontend", "DevOps", "QA / Testing",
  "Mobile", "Data / Analytics", "Full Stack",
];

const MAX_CONSTRAINTS = 7;

export function RandomizerPanel() {
  const { config, isGenerating, setConfig, setGenerating } = useRandomizerStore();
  const { setGeneratedTeams, conflicts } = useTeamsStore();
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data: Member[]) => setMembers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const constraints = config.pairingConstraints ?? [];
  const avoidConstraints = constraints.filter((c) => c.type === "avoid");
  const preferConstraints = constraints.filter((c) => c.type === "prefer");

  function addConstraint(type: "avoid" | "prefer") {
    const current = type === "avoid" ? avoidConstraints : preferConstraints;
    if (current.length >= MAX_CONSTRAINTS) return;
    setConfig({
      pairingConstraints: [
        ...constraints,
        { memberIdA: "", memberIdB: "", type },
      ],
    });
  }

  function updateConstraint(index: number, patch: Partial<PairingConstraint>) {
    const updated = constraints.map((c, i) => (i === index ? { ...c, ...patch } : c));
    setConfig({ pairingConstraints: updated });
  }

  function removeConstraint(index: number) {
    setConfig({ pairingConstraints: constraints.filter((_, i) => i !== index) });
  }

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

      {/* Pairing Constraints */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-gray-700">Member Pairing Constraints</p>
        <p className="text-xs text-gray-400">Up to {MAX_CONSTRAINTS} pairs each. Best-effort — a warning is shown if a constraint can't be honored.</p>

        {/* Avoid pairs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-600">
              🚫 Should NOT be on the same team ({avoidConstraints.length}/{MAX_CONSTRAINTS})
            </span>
            <button
              type="button"
              disabled={avoidConstraints.length >= MAX_CONSTRAINTS || members.length < 2}
              onClick={() => addConstraint("avoid")}
              className="text-xs text-rose-600 hover:text-rose-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Add pair
            </button>
          </div>
          {constraints.map((c, i) =>
            c.type !== "avoid" ? null : (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={c.memberIdA}
                  onChange={(e) => updateConstraint(i, { memberIdA: e.target.value })}
                  className="flex-1 rounded-md border border-gray-200 text-xs px-2 py-1.5 bg-white text-gray-700"
                >
                  <option value="">— Member A —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} disabled={m.id === c.memberIdB}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-400 shrink-0">not with</span>
                <select
                  value={c.memberIdB}
                  onChange={(e) => updateConstraint(i, { memberIdB: e.target.value })}
                  className="flex-1 rounded-md border border-gray-200 text-xs px-2 py-1.5 bg-white text-gray-700"
                >
                  <option value="">— Member B —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} disabled={m.id === c.memberIdA}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeConstraint(i)}
                  className="text-gray-400 hover:text-red-500 shrink-0 text-sm"
                >
                  ✕
                </button>
              </div>
            )
          )}
        </div>

        {/* Prefer pairs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600">
              ✅ Works well together ({preferConstraints.length}/{MAX_CONSTRAINTS})
            </span>
            <button
              type="button"
              disabled={preferConstraints.length >= MAX_CONSTRAINTS || members.length < 2}
              onClick={() => addConstraint("prefer")}
              className="text-xs text-emerald-600 hover:text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              + Add pair
            </button>
          </div>
          {constraints.map((c, i) =>
            c.type !== "prefer" ? null : (
              <div key={i} className="flex items-center gap-2">
                <select
                  value={c.memberIdA}
                  onChange={(e) => updateConstraint(i, { memberIdA: e.target.value })}
                  className="flex-1 rounded-md border border-gray-200 text-xs px-2 py-1.5 bg-white text-gray-700"
                >
                  <option value="">— Member A —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} disabled={m.id === c.memberIdB}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-gray-400 shrink-0">with</span>
                <select
                  value={c.memberIdB}
                  onChange={(e) => updateConstraint(i, { memberIdB: e.target.value })}
                  className="flex-1 rounded-md border border-gray-200 text-xs px-2 py-1.5 bg-white text-gray-700"
                >
                  <option value="">— Member B —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} disabled={m.id === c.memberIdA}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeConstraint(i)}
                  className="text-gray-400 hover:text-red-500 shrink-0 text-sm"
                >
                  ✕
                </button>
              </div>
            )
          )}
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
