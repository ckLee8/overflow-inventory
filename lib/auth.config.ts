import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible Auth.js config (no Node/Prisma imports).
 * Used by middleware; full Credentials provider lives in lib/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;

      if (path.startsWith("/login")) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      if (!isLoggedIn) {
        return false;
      }

      if (path.startsWith("/admin")) {
        return auth?.user?.role === "ADMIN";
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.sub = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.role) {
          session.user.role = token.role as "ADMIN" | "MANAGER" | "STAFF";
        }
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
