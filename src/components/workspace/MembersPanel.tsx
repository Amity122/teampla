"use client";

import { useCallback, useEffect, useState } from "react";
import { WorkloadBadge } from "@/components/teams/WorkloadBadge";
import { AddMemberModal } from "./AddMemberModal";
import { cn, displayTeam } from "@/lib/utils";
import type { Member, ShiftSchedule } from "@/lib/types";

function ShiftIcon({ shift }: { shift: ShiftSchedule }) {
  if (shift === "Day Shift") {
    return (
      <span title="Day Shift">
        <svg className="w-3 h-3 text-amber-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4" /><line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="4" y2="12" /><line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>
    );
  }
  if (shift === "Afternoon Shift") {
    return (
      <span title="Afternoon Shift">
        <svg className="w-3 h-3 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 18a5 5 0 0 0-10 0" />
          <line x1="12" y1="2" x2="12" y2="9" />
          <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
          <line x1="2" y1="18" x2="4" y2="18" />
          <line x1="20" y1="18" x2="22" y2="18" />
          <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
        </svg>
      </span>
    );
  }
  return (
    <span title="Night Shift">
      <svg className="w-3 h-3 text-indigo-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </span>
  );
}

export function MembersPanel() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);

  const fetchMembers = useCallback(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        setMembers(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  async function handleDelete(id: string) {
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  const filtered = query.trim()
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.email.toLowerCase().includes(query.toLowerCase()) ||
          displayTeam(m).toLowerCase().includes(query.toLowerCase())
      )
    : members;

  return (
    <>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 shrink-0">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
            Members
            {members.length > 0 && (
              <span className="ml-1 text-gray-400 font-normal normal-case">({members.length})</span>
            )}
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="text-[10px] font-medium text-blue-600 hover:text-blue-700 leading-none"
          >
            + Add
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2 shrink-0">
          <div className="relative">
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-gray-50 pl-7 pr-6 py-1 text-[11px] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            />
            {query && (
              <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-[10px]">
                ✕
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0 px-2 pb-3">
          {loading ? (
            <p className="text-[11px] text-gray-400 px-1 py-3">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center gap-1.5">
              {members.length === 0 ? (
                <>
                  <p className="text-[11px] text-gray-400">No members yet.</p>
                  <button onClick={() => setShowModal(true)} className="text-[11px] text-blue-600 hover:underline">
                    Add your first member
                  </button>
                </>
              ) : (
                <p className="text-[11px] text-gray-400">No results for &ldquo;{query}&rdquo;</p>
              )}
            </div>
          ) : (
            <ul className="flex flex-col gap-px">
              {filtered.map((member, i) => (
                <li
                  key={member.id}
                  className={cn(
                    "group flex items-center gap-2 rounded px-2 py-1.5",
                    i % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-gray-800 truncate leading-tight">{member.name}</p>
                    <p className="text-[10px] text-gray-400 truncate leading-tight">{displayTeam(member)} · {member.skillLevel}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <ShiftIcon shift={member.shift} />
                    <WorkloadBadge count={member.activeProjectCount} />
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-opacity leading-none text-[10px]"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showModal && (
        <AddMemberModal
          onClose={() => setShowModal(false)}
          onAdded={fetchMembers}
        />
      )}
    </>
  );
}
