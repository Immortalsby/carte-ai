"use client";

import { useState, useRef, useEffect } from "react";
import { signUp, signIn } from "@/lib/auth-client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { type AuthLocale, detectAuthLocale, getAuthDict } from "@/lib/auth-i18n";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export default function RegisterPage() {
  const [locale, setLocale] = useState<AuthLocale>("en");
  useEffect(() => { setLocale(detectAuthLocale()); }, []);
  const t = getAuthDict(locale);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return t.pwMin8;
    if (!/[A-Z]/.test(pw)) return t.pwUppercase;
    if (!/[a-z]/.test(pw)) return t.pwLowercase;
    if (!/[0-9]/.test(pw)) return t.pwNumber;
    return null;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirmPassword) { setError(t.passwordsNoMatch); return; }

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError(t.pleaseVerify);
      return;
    }

    setLoading(true);
    try {
      await signUp.email(
        {
          name,
          email,
          password,
          ...(turnstileToken ? { turnstileToken } : {}),
        } as Parameters<typeof signUp.email>[0],
        {
          onSuccess: () => {
            window.location.href = "/welcome";
          },
          onError: (ctx) => {
            const msg = ctx.error.message;
            const safe = msg?.includes("password") || msg?.includes("Password")
              || msg?.includes("email") || msg?.includes("already")
              || msg?.includes("verification") || msg?.includes("Bot")
              ? msg
              : t.registrationFailed;
            setError(safe);
            turnstileRef.current?.reset();
            setTurnstileToken(null);
          },
        },
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    await signIn.social({ provider: "google", callbackURL: "/admin" });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="CarteAI" className="mx-auto h-12 w-12" />
      <h1 className="mt-3 text-center text-xl font-bold text-foreground">{t.createAccountTitle}</h1>

      <button
        onClick={handleGoogleLogin}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
      >
        <GoogleIcon />
        {t.continueWithGoogle}
      </button>

      <div className="my-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">{t.or}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleRegister} method="post" className="space-y-3">
        <input
          type="text"
          name="name"
          autoComplete="name"
          placeholder={t.namePlaceholder}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
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
          autoComplete="new-password"
          placeholder={t.passwordHint}
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
          placeholder={t.confirmPasswordPlaceholder}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />
        {confirmPassword && password !== confirmPassword && (
          <p className="text-xs text-red-500">{t.passwordsNoMatch}</p>
        )}

        {/* Cloudflare Turnstile — invisible mode */}
        {TURNSTILE_SITE_KEY && (
          <Turnstile
            ref={turnstileRef}
            siteKey={TURNSTILE_SITE_KEY}
            onSuccess={setTurnstileToken}
            onError={() => setTurnstileToken(null)}
            onExpire={() => setTurnstileToken(null)}
            options={{ size: "invisible" }}
          />
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? t.creatingAccount : t.createAccount}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {t.alreadyHaveAccount}{" "}
        <a href="/login" className="text-foreground underline">
          {t.signIn}
        </a>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}
