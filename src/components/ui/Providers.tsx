"use client";

import { ThemeProvider } from "next-themes";
import { ToastProvider } from "./Toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
