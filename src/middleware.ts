import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

// Use the edge-compatible config (no Prisma) for middleware
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: [
    // Match everything except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
