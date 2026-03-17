import type { ConflictInfo } from "@/lib/types";

interface ConflictBannerProps {
  conflicts: ConflictInfo[];
}

export function ConflictBanner({ conflicts }: ConflictBannerProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-700 mb-2">
        ⚠️ {conflicts.length} constraint warning{conflicts.length !== 1 ? "s" : ""} — teams were still generated
      </p>
      <ul className="flex flex-col gap-1">
        {conflicts.map((c, i) => (
          <li key={i} className="text-sm text-amber-600">
            · {c.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
