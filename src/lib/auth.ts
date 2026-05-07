import { betterAuth } from "better-auth";
import { createAuthMiddleware, APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as authSchema from "@/lib/db/auth-schema";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  sendAdminNewUserNotification,
  sendUserRegistrationEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "@/lib/email";

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    sendVerificationEmail: async ({ user, url }: { user: { name: string; email: string }; url: string }) => {
      sendVerificationEmail({ name: user.name, email: user.email, url })
        .catch((err) => console.error("Verification email failed:", err));
    },
    sendResetPassword: async ({ user, url }) => {
      sendPasswordResetEmail({ name: user.name, email: user.email, url })
        .catch((err) => console.error("Password reset email failed:", err));
    },
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh every 24h
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      // Verify Turnstile token on email auth endpoints
      if (
        ctx.path === "/sign-up/email" ||
        ctx.path === "/request-password-reset"
      ) {
        const token = ctx.body?.turnstileToken as string | undefined;
        if (!token) {
          throw new APIError("BAD_REQUEST", {
            message: "Bot verification required",
          });
        } else {
          const valid = await verifyTurnstile(token);
          if (!valid) {
            throw new APIError("BAD_REQUEST", {
              message: "Bot verification failed. Please try again.",
            });
          }
        }
      }

      // Server-side password complexity enforcement
      if (ctx.path === "/sign-up/email" || ctx.path === "/reset-password") {
        const pw = (ctx.path === "/reset-password"
          ? ctx.body?.newPassword
          : ctx.body?.password) as string | undefined;
        if (pw) {
          if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) {
            throw new APIError("BAD_REQUEST", {
              message: "Password must include uppercase, lowercase, and a number.",
            });
          }
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // Send welcome + admin notification after email verification (not signup)
      if (ctx.path === "/verify-email") {
        const user = ctx.context.newSession?.user ?? (ctx.body as Record<string, unknown>)?.user as { name: string; email: string } | undefined;
        if (user?.email) {
          Promise.all([
            sendUserRegistrationEmail({ name: user.name, email: user.email }),
            sendAdminNewUserNotification({ name: user.name, email: user.email }),
          ]).catch((err) => console.error("Post-verification email failed:", err));
        }
      }
    }),
  },
});
