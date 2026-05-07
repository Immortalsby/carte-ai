"use client";

import { useEffect, useState } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { type AuthLocale, detectAuthLocale, getAuthDict } from "@/lib/auth-i18n";

export default function WelcomePage() {
  const { data: session, isPending } = useSession();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [locale, setLocale] = useState<AuthLocale>("en");
  useEffect(() => { setLocale(detectAuthLocale()); }, []);
  const t = getAuthDict(locale);

  // Fetch approved status from custom endpoint (useSession doesn't include it)
  const [approved, setApproved] = useState<boolean | null>(null);

  useEffect(() => {
    if (session?.user?.emailVerified) {
      fetch("/api/admin/users/me")
        .then((r) => r.json())
        .then((data) => {
          if (data.approved) {
            window.location.href = "/admin";
          } else {
            setApproved(false);
          }
        })
        .catch(() => setApproved(false));
    }
  }, [session]);

  async function handleResend() {
    setResending(true);
    try {
      await authClient.sendVerificationEmail({
        email: session?.user?.email ?? "",
        callbackURL: "/welcome",
      });
      setResent(true);
    } catch {
      // silent
    } finally {
      setResending(false);
    }
  }

  if (isPending) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-muted" />
        <div className="mt-3 mx-auto h-6 w-48 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="CarteAI" className="mx-auto h-12 w-12" />
        <h1 className="mt-3 text-xl font-bold text-foreground">{t.sessionExpired}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {t.sessionExpiredDesc}
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

  const userName = session.user.name || "there";
  const emailVerified = session.user.emailVerified;

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="CarteAI" className="mx-auto h-12 w-12" />
      <h1 className="mt-3 text-xl font-bold text-foreground">
        {t.welcome(userName)}
      </h1>

      {/* Step indicators */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm">
        <StepDot done={emailVerified} num={1} />
        <div className={`h-px w-8 ${emailVerified ? "bg-emerald-500" : "bg-border"}`} />
        <StepDot done={approved === true} num={2} />
      </div>

      {/* State 1: Email not verified */}
      {!emailVerified && (
        <>
          <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <div className="text-2xl">📧</div>
            <h2 className="mt-2 text-sm font-semibold text-foreground">
              {t.stepVerifyEmail}
            </h2>
            <p
              className="mt-2 text-sm text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: t.stepVerifyEmailDesc(session.user.email) }}
            />
          </div>

          <div className="mt-4 flex flex-col gap-2">
            <button
              onClick={handleResend}
              disabled={resending || resent}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              {resent ? t.emailSentBang : resending ? t.sending : t.resendEmail}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              {t.iVerified}
            </button>
          </div>
        </>
      )}

      {/* State 2: Email verified, pending approval */}
      {emailVerified && approved === false && (
        <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="text-2xl">⏳</div>
          <h2 className="mt-2 text-sm font-semibold text-foreground">
            {t.stepAccountReview}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t.stepAccountReviewDesc}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {t.notifyByEmail}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {t.checkStatus}
          </button>
        </div>
      )}

      {/* Loading state while checking approval */}
      {emailVerified && approved === null && (
        <div className="mt-6 text-sm text-muted-foreground">{t.checkingStatus}</div>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        {t.wrongEmail}{" "}
        <a href="/register" className="text-foreground underline">
          {t.signUpAgain}
        </a>
      </p>
    </div>
  );
}

function StepDot({ done, num }: { done: boolean; num: number }) {
  return (
    <div
      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
        done
          ? "bg-emerald-500 text-white"
          : "border border-border bg-muted text-muted-foreground"
      }`}
    >
      {done ? "✓" : num}
    </div>
  );
}
