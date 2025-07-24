import CredentialsProvider from "next-auth/providers/credentials";
import NextAuth, { NextAuthConfig } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

export const { handlers, auth, signIn, signOut} = NextAuth({
  adapter: PrismaAdapter(prisma),
  cookies: process.env.NODE_ENV !== "production" ? devCookiesConfig : undefined,
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (typeof credentials?.email !== "string" || typeof credentials?.password !== "string") {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, id: token.id ?? user?.id };
    },
    async session({ session, token }) {
      return { ...session, user: { ...session.user, id: token.id as string } };
    },
  },
});