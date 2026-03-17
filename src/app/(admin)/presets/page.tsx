"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRandomizerStore } from "@/store/randomizerStore";
import type { Preset, RandomizerConfig } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function PresetsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config, loadPreset } = useRandomizerStore();
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/presets");
    const data = await res.json();
    setPresets(data);
  }

  useEffect(() => { load(); }, []);

  async function savePreset() {
    if (!saveName.trim()) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: saveName.trim(), config }),
    });
    if (res.ok) {
      setSaveName("");
      load();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save preset.");
    }
    setSaving(false);
  }

  async function deletePreset(id: string) {
    await fetch(`/api/presets/${id}`, { method: "DELETE" });
    load();
  }

  function applyPreset(preset: Preset) {
    loadPreset(preset.config as RandomizerConfig);
    router.push("/randomizer");
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Presets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Save your current randomizer settings as a named preset to reuse later.
        </p>
      </div>

      {/* Save current config */}
      <div className="mb-8 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Save Current Settings</h2>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Sprint Team — 4 Teams of 5"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={savePreset} loading={saving} disabled={!saveName.trim()}>
            Save
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {/* Preset list */}
      <div className="flex flex-col gap-3">
        {presets.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No presets saved yet.</p>
        ) : (
          presets.map((preset) => (
            <div
              key={preset.id}
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <p className="font-medium text-gray-800 text-sm">{preset.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(preset.config as RandomizerConfig).numTeams} teams
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => applyPreset(preset)}>
                  Load
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deletePreset(preset.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
