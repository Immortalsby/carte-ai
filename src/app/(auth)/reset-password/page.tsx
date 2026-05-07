"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { type AuthLocale, detectAuthLocale, getAuthDict } from "@/lib/auth-i18n";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const errorParam = searchParams.get("error");

  const [locale, setLocale] = useState<AuthLocale>("en");
  useEffect(() => { setLocale(detectAuthLocale()); }, []);
  const t = getAuthDict(locale);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(
    errorParam === "INVALID_TOKEN" ? t.invalidResetLink : "",
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return t.pwMin8;
    if (!/[A-Z]/.test(pw)) return t.pwUppercase;
    if (!/[a-z]/.test(pw)) return t.pwLowercase;
    if (!/[0-9]/.test(pw)) return t.pwNumber;
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirmPassword) { setError(t.passwordsNoMatch); return; }

    if (!token) {
      setError(t.invalidResetLinkShort);
      return;
    }

    setLoading(true);
    try {
      const { error: apiError } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (apiError) {
        setError(apiError.message ?? t.resetFailed);
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
        <h1 className="mt-3 text-xl font-bold text-foreground">{t.passwordResetSuccess}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t.passwordResetSuccessDesc}
        </p>
        <a
          href="/login"
          className="mt-6 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t.signIn}
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="CarteAI" className="mx-auto h-12 w-12" />
      <h1 className="mt-3 text-center text-xl font-bold text-foreground">{t.setNewPassword}</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        {t.setNewPasswordDesc}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="password"
          name="new-password"
          autoComplete="new-password"
          placeholder={t.newPasswordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        {password && (
          <ul className="space-y-0.5 text-xs">
            <li className={password.length >= 8 ? "text-green-500" : "text-muted-foreground"}>
              {password.length >= 8 ? "\u2713" : "\u2022"} {t.pwMin8}
            </li>
            <li className={/[A-Z]/.test(password) ? "text-green-500" : "text-muted-foreground"}>
              {/[A-Z]/.test(password) ? "\u2713" : "\u2022"} {t.pwUppercase}
            </li>
            <li className={/[a-z]/.test(password) ? "text-green-500" : "text-muted-foreground"}>
              {/[a-z]/.test(password) ? "\u2713" : "\u2022"} {t.pwLowercase}
            </li>
            <li className={/[0-9]/.test(password) ? "text-green-500" : "text-muted-foreground"}>
              {/[0-9]/.test(password) ? "\u2713" : "\u2022"} {t.pwNumber}
            </li>
          </ul>
        )}
        <input
          type="password"
          name="confirm-password"
          autoComplete="new-password"
          placeholder={t.confirmNewPasswordPlaceholder}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-500">{t.passwordsNoMatch}</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading || !token}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? t.resetting : t.resetPassword}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        <a href="/forgot-password" className="text-foreground underline">
          {t.requestNewLink}
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
