"use client";

import { useState, useEffect } from "react";
import { signIn } from "@/lib/auth-client";
import { type AuthLocale, detectAuthLocale, getAuthDict } from "@/lib/auth-i18n";

export default function LoginPage() {
  const [locale, setLocale] = useState<AuthLocale>("en");
  useEffect(() => { setLocale(detectAuthLocale()); }, []);
  const t = getAuthDict(locale);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const anyLoading = loading || googleLoading;

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn.email(
        { email, password },
        {
          onSuccess: () => {
            window.location.href = "/admin";
          },
          onError: () => {
            setError(t.invalidCredentials);
            setLoading(false);
          },
        },
      );
    } catch {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    await signIn.social({ provider: "google", callbackURL: "/admin" });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="CarteAI" className="mx-auto h-12 w-12" />
      <h1 className="mt-3 text-center text-xl font-bold text-foreground">{t.signInTitle}</h1>

      <button
        onClick={handleGoogleLogin}
        disabled={anyLoading}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
      >
        {googleLoading ? (
          <Spinner />
        ) : (
          <GoogleIcon />
        )}
        {googleLoading ? t.redirecting : t.continueWithGoogle}
      </button>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t.or}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleEmailLogin} method="post" className="space-y-3">
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder={t.passwordPlaceholder}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />

        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={anyLoading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? t.signingIn : t.signIn}
        </button>
        <p className="text-right">
          <a href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground underline">
            {t.forgotPassword}
          </a>
        </p>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {t.noAccount}{" "}
        <a href="/register" className="text-foreground underline">
          {t.signUp}
        </a>
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
