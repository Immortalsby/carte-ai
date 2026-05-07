import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // Use relative path in browser so auth works on any host (localhost, LAN IP, etc.)
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001"),
});

export const { signIn, signUp, signOut, useSession } = authClient;
