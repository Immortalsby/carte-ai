"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(
    errorParam === "INVALID_TOKEN" ? "This reset link is invalid or has expired. Please request a new one." : "",
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return "Password must be at least 8 characters.";
    if (!/[A-Z]/.test(pw)) return "Password must include an uppercase letter.";
    if (!/[a-z]/.test(pw)) return "Password must include a lowercase letter.";
    if (!/[0-9]/.test(pw)) return "Password must include a number.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }

    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setLoading(true);
    try {
      const { error: apiError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (apiError) {
        setError(apiError.message ?? "Failed to reset password. Please try again.");
      } else {
        setSuccess(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="CarteAI" className="mx-auto h-12 w-12" />
        <h1 className="mt-3 text-xl font-bold text-foreground">Password reset!</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your password has been updated successfully. You can now sign in with your new password.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="CarteAI" className="mx-auto h-12 w-12" />
      <h1 className="mt-3 text-center text-xl font-bold text-foreground">Set new password</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Choose a strong password with at least 8 characters, including uppercase, lowercase, and a number.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        {password && (
          <ul className="space-y-0.5 text-xs">
            <li className={password.length >= 8 ? "text-green-500" : "text-muted-foreground"}>
              {password.length >= 8 ? "\u2713" : "\u2022"} At least 8 characters
            </li>
            <li className={/[A-Z]/.test(password) ? "text-green-500" : "text-muted-foreground"}>
              {/[A-Z]/.test(password) ? "\u2713" : "\u2022"} One uppercase letter
            </li>
            <li className={/[a-z]/.test(password) ? "text-green-500" : "text-muted-foreground"}>
              {/[a-z]/.test(password) ? "\u2713" : "\u2022"} One lowercase letter
            </li>
            <li className={/[0-9]/.test(password) ? "text-green-500" : "text-muted-foreground"}>
              {/[0-9]/.test(password) ? "\u2713" : "\u2022"} One number
            </li>
          </ul>
        )}
        <input
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-500">Passwords do not match.</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !token}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Resetting..." : "Reset password"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <a href="/forgot-password" className="text-foreground underline">
          Request a new reset link
        </a>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-muted" />
        <div className="mt-3 mx-auto h-6 w-48 animate-pulse rounded bg-muted" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
