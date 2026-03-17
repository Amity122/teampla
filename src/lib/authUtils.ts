import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Require an authenticated session. Returns the session or a 401 Response.
 * Usage in route handlers:
 *   const result = await requireAuth();
 *   if (result instanceof Response) return result;
 *   const { session } = result;
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { session };
}
