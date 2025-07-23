'use client';

import { DataProvider, GlobalActionsProvider } from "@plasmicapp/loader-nextjs";
import { signIn, signOut, useSession } from "next-auth/react";

import React from "react";

export function UserSession({
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const session = useSession();

  const logout = async (redirectTo = "/login") => {
    await signOut();
    window.location.pathname = redirectTo;
  };

  const login = async (provider: string, redirectTo = "/", payload: Record<string, string>) => {
    if (!provider) {
      console.error("No provider specified for login.");
      return;
    }
    if (provider === "credentials" && !payload) {
      console.error("No payload provided for credentials login.");
      return;
    }
    signIn(provider, { callbackUrl: redirectTo, ...payload });
  };

  const actions = React.useMemo(
    () => ({
      logout,
      login,
    }),
    [],
  );

  return (
    <GlobalActionsProvider contextName="UserSession" actions={actions}>
      <DataProvider name="auth" data={session || {}}>
        {children}
      </DataProvider>
    </GlobalActionsProvider>
  );
}
