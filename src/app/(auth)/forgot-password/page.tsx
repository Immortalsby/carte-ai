"use client";

import { useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the verification.");
      return;
    }

    setLoading(true);
    try {
      const { error: apiError } = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
        ...(turnstileToken ? { turnstileToken } : {}),
      } as Parameters<typeof authClient.requestPasswordReset>[0]);

      if (apiError) {
        setError(apiError.message ?? "Something went wrong. Please try again.");
        turnstileRef.current?.reset();
        setTurnstileToken(null);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="CarteAI" className="mx-auto h-12 w-12" />
        <h1 className="mt-3 text-xl font-bold text-foreground">Check your email</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          If an account exists for <strong className="text-foreground">{email}</strong>, we&apos;ve sent a password reset link. Please check your inbox and spam folder.
        </p>
        <a
          href="/login"
          className="mt-6 inline-block text-sm text-foreground underline"
        >
          Back to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="CarteAI" className="mx-auto h-12 w-12" />
      <h1 className="mt-3 text-center text-xl font-bold text-foreground">Reset your password</h1>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Enter the email address associated with your account and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
        />

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
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Remember your password?{" "}
        <a href="/login" className="text-foreground underline">
          Sign in
        </a>
      </p>
    </div>
  );
}
