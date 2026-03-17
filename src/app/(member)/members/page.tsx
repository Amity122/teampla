"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { WorkloadBadge } from "@/components/teams/WorkloadBadge";
import { cn, displayTeam } from "@/lib/utils";
import type { Member } from "@/lib/types";

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/members")
      .then((r) => r.json())
      .then((data) => {
        setMembers(data);
        setLoading(false);
      });
  }, []);

  async function handleDelete(id: string) {
    await fetch(`/api/members/${id}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="mt-1 text-sm text-gray-500">
            All members available in the randomizer pool.
          </p>
        </div>
        <Link href="/members/add">
          <Button>+ Add Member</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : members.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-gray-200 text-center">
          <p className="text-gray-400 mb-3">No members yet.</p>
          <Link href="/members/add">
            <Button variant="secondary" size="sm">Add your first member</Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Team</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Skill</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Shift</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Load</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {members.map((member, i) => (
                <tr
                  key={member.id}
                  className={cn("border-b border-gray-100 last:border-0", i % 2 === 0 ? "bg-white" : "bg-gray-50/50")}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{displayTeam(member)}</td>
                  <td className="px-4 py-3 text-gray-600">{member.skillLevel}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{member.shift}</td>
                  <td className="px-4 py-3">
                    <WorkloadBadge count={member.activeProjectCount} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
