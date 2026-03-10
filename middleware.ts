import NextAuth from "next-auth";
import { nextAuthConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(nextAuthConfig);

export const config = {
  matcher: ["/:path((?!_next/|api/|favicon\\.ico|plasmic-host).*)"],
};