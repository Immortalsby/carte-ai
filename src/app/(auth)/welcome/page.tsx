"use client";

import { useEffect, useState } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { type AuthLocale, detectAuthLocale, getAuthDict } from "@/lib/auth-i18n";
import { Envelope, Check } from "@phosphor-icons/react";

export default function WelcomePage() {
  const { data: session, isPending } = useSession();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [locale, setLocale] = useState<AuthLocale>("en");
  useEffect(() => { setLocale(detectAuthLocale()); }, []);
  const t = getAuthDict(locale);

  // Auto-approve on email verification — redirect to admin immediately
  const [approveError, setApproveError] = useState(false);
  useEffect(() => {
    if (!session?.user?.emailVerified) return;
    let cancelled = false;
    const check = () => {
      fetch("/api/admin/users/me", { method: "POST" })
        .then((r) => r.json())
        .then((data) => {
          if (!cancelled && data.approved) {
            window.location.href = "/admin";
          }
        })
        .catch(() => { if (!cancelled) setApproveError(true); });
    };
    check();
    // Poll every 3s in case email verification hasn't propagated yet
    const interval = setInterval(check, 3000);
    return () => { cancelled = true; clearInterval(interval); };
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

      {/* Step indicator */}
      <div className="mt-6 flex items-center justify-center gap-2 text-sm">
        <StepDot done={emailVerified} num={1} />
      </div>

      {/* State 1: Email not verified */}
      {!emailVerified && (
        <>
          <div className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
            <Envelope weight="duotone" className="h-7 w-7 text-amber-500" />
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

      {/* Email verified — redirecting */}
      {emailVerified && (
        <div className="mt-6 text-sm text-muted-foreground">
          {approveError ? (
            <>
              <p className="text-red-500">{"Network error"}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                {t.checkStatus}
              </button>
            </>
          ) : (
            t.checkingStatus
          )}
        </div>
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
      {done ? <Check weight="bold" className="h-4 w-4" /> : num}
    </div>
  );
}
