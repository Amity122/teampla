import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-compatible auth config — no Prisma adapter, no Node.js-only APIs.
 * Used by middleware (Edge runtime) to check if a session exists.
 * The full auth config (with Prisma adapter) lives in src/auth.ts.
 */
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      // Always allow auth routes and the login page
      if (pathname.startsWith("/api/auth") || pathname === "/login") {
        return true;
      }

      // Redirect unauthenticated users to /login
      if (!isLoggedIn) {
        return false; // NextAuth redirects to pages.signIn automatically
      }

      return true;
    },
  },
};
