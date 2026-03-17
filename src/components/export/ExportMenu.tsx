"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useTeamsStore } from "@/store/teamsStore";
import { formatSlack, formatPlainText } from "@/lib/export";

export function ExportMenu() {
  const { currentTeams, sessionId } = useTeamsStore();
  const [copying, setCopying] = useState(false);

  if (currentTeams.length === 0 || !sessionId) return null;

  async function exportCSV() {
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, format: "csv" }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teams.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function copyToClipboard(format: "slack" | "plain_text") {
    setCopying(true);
    const text = format === "slack" ? formatSlack(currentTeams) : formatPlainText(currentTeams);
    await navigator.clipboard.writeText(text);
    setTimeout(() => setCopying(false), 1500);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-medium text-gray-500">Export:</span>
      <Button variant="secondary" size="sm" onClick={() => copyToClipboard("slack")}>
        {copying ? "Copied!" : "Copy Slack"}
      </Button>
      <Button variant="secondary" size="sm" onClick={exportCSV}>
        Download CSV
      </Button>
      <Button variant="ghost" size="sm" onClick={() => copyToClipboard("plain_text")}>
        Copy Plain Text
      </Button>
    </div>
  );
}
