/* eslint-disable @typescript-eslint/no-unused-vars */
import NextAuth, { DefaultSession, DefaultJWT, DefaultUser} from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user?: {
      name?: string | null
      email?: string | null
      roleName?: string | null
    }
  }

  interface User extends DefaultUser {
    role?: {
      name: string 
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    roleName?: string;
  }
}
