"use client";

import { useEffect } from "react";
import { MemberForm } from "@/components/members/MemberForm";
import type { z } from "zod";
import type { MemberCreateSchema } from "@/lib/validators";

type FormValues = z.infer<typeof MemberCreateSchema>;

interface AddMemberModalProps {
  onClose: () => void;
  onAdded: () => void;
}

export function AddMemberModal({ onClose, onAdded }: AddMemberModalProps) {
  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(data: FormValues) {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      onAdded();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg mx-4 bg-white rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Add Member</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Add a team member to the randomizer pool.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Scrollable form body */}
        <div className="overflow-y-auto px-5 py-4">
          <MemberForm onSubmit={handleSubmit} />
        </div>
      </div>
    </div>
  );
}
