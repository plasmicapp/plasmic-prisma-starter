import type { NextAuthConfig } from "next-auth";

/*
 * In order to log in through your browser and expose the logged in state
 * to the Plasmic studio you would need to additionally configure cookies.
 * This is only needed in development mode, in production mode these
 * policies need to be disabled for security reasons.
 **/
const devCookiesConfig: NextAuthConfig["cookies"] = {
  sessionToken: {
    options: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    },
  },
  callbackUrl: {
    options: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    },
  },
  csrfToken: {
    options: {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    },
  },
};

// Edge-safe config: no Prisma, no Node.js-only imports.
// Used by middleware and extended by auth.ts.
export const nextAuthConfig: NextAuthConfig = {
  providers: [], // populated in auth.ts
  cookies: process.env.NODE_ENV !== "production" ? devCookiesConfig : undefined,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, roleName: token?.roleName || (user as { role?: { name?: string } })?.role?.name, id: token.id ?? user?.id };
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          roleName: token.roleName as string | null,
        },
      };
    },
  },
};