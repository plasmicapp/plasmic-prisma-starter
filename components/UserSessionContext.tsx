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
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error("Error during logout:", error);
      return {
        error,
      };
    }
    window.location.pathname = redirectTo;
  };

  const login = async (provider: string, redirectTo = "/", payload?: Record<string, string>) => {
    if (!provider) {
      console.error("No provider specified for login.");
      return;
    }
    if (provider === "credentials" && !payload) {
      console.error("No payload provided for credentials login.");
      return;
    }
    try {
      const result = await signIn(provider, {
        redirect: false,
        redirectTo,
        ...(payload ?? {}),
      });

      if (result?.error) {
        return {
          error: result.error,
          code: result.code,
        };
      }

      if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error("Error during login:", error);
      return {
        error
      };
    }
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
