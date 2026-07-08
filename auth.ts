import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { nextAuthConfig } from "./auth.config";

type PrismaAdapterClient = Parameters<typeof PrismaAdapter>[0];

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...nextAuthConfig,
  // @auth/prisma-adapter still types its input against @prisma/client.
  adapter: PrismaAdapter(prisma as unknown as PrismaAdapterClient),
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
          include: {
            role: {
              select: { name: true },
            },
          },
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
});
