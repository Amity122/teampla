import type { ConflictInfo } from "@/lib/types";

interface ConflictBannerProps {
  conflicts: ConflictInfo[];
}

export function ConflictBanner({ conflicts }: ConflictBannerProps) {
  if (conflicts.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2">
      <p className="text-[10px] font-semibold text-amber-700 mb-1">
        ⚠️ {conflicts.length} warning{conflicts.length !== 1 ? "s" : ""} — teams were still generated
      </p>
      <ul className="flex flex-col gap-0.5">
        {conflicts.map((c, i) => (
          <li key={i} className="text-[10px] text-amber-600">
            · {c.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
