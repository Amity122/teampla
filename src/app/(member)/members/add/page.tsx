"use client";

import { useRouter } from "next/navigation";
import { MemberForm } from "@/components/members/MemberForm";
import type { z } from "zod";
import type { MemberCreateSchema } from "@/lib/validators";

type FormValues = z.infer<typeof MemberCreateSchema>;

export default function AddMemberPage() {
  const router = useRouter();

  async function handleSubmit(data: FormValues) {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/members");
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8">
        <a href="/members" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          ← Back to Members
        </a>
        <h1 className="text-2xl font-bold text-gray-900">Add Member</h1>
        <p className="mt-1 text-sm text-gray-500">
          Add a team member to the pool so they can be included in team generation.
        </p>
      </div>
      <MemberForm onSubmit={handleSubmit} />
    </main>
  );
}
