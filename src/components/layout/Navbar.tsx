"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  const { data: session } = useSession();

  if (!session) return null;

  const user = session.user;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/" className="font-bold text-lg text-brand-600 tracking-tight">
          Teampla
        </Link>
        <Link href="/randomizer" className="text-sm text-gray-600 hover:text-gray-900">
          Randomizer
        </Link>
        <Link href="/teams" className="text-sm text-gray-600 hover:text-gray-900">
          Teams
        </Link>
        <Link href="/presets" className="text-sm text-gray-600 hover:text-gray-900">
          Presets
        </Link>
        <Link href="/members" className="text-sm text-gray-600 hover:text-gray-900">
          Members
        </Link>
      </div>

      <div className="flex items-center gap-3">
        {user?.image && (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={32}
            height={32}
            className="rounded-full"
          />
        )}
        <span className="text-sm text-gray-700">{user?.name}</span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-500 hover:text-gray-800 ml-2"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
