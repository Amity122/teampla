"use client";

import { useRouter } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import type { MemberCreateSchema } from "@/lib/validators";
import type { z } from "zod";

type FormValues = z.infer<typeof MemberCreateSchema>;

export default function ProfilePage() {
  const router = useRouter();

  async function handleSubmit(data: FormValues) {
    const res = await fetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push("/");
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Fill in your details so the randomizer can build balanced teams.
        </p>
      </div>
      <ProfileForm onSubmit={handleSubmit} />
    </main>
  );
}
