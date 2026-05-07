import { Resend } from "resend";
import { _previewWelcomeEmail, _previewAdminEmail, _previewPasswordResetEmail, _previewVerificationEmail, _previewAccountActivatedEmail } from "./email-preview";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_HELLO = "CarteAI <hello@carte-ai.link>";
const FROM_NOREPLY = "CarteAI <noreply@carte-ai.link>";
const ADMIN_EMAIL =
  process.env.FOUNDER_EMAILS?.split(",")[0]?.trim() || "boyuan@carte-ai.link";

/**
 * Send a verification email to confirm the user's email address.
 */
export async function sendVerificationEmail(data: {
  name: string;
  email: string;
  url: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM_NOREPLY,
    to: data.email,
    subject: "Verify your CarteAI email",
    html: _previewVerificationEmail(data),
  });
}

/**
 * Send a branded welcome email to the newly registered user.
 */
export async function sendUserRegistrationEmail(user: {
  name: string;
  email: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM_HELLO,
    to: user.email,
    subject: "Welcome to CarteAI \u2014 Your AI Dining Concierge",
    html: _previewWelcomeEmail(user),
  });
}

/**
 * Notify admin (founder) that a new user has registered.
 */
export async function sendAdminNewUserNotification(user: {
  name: string;
  email: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM_HELLO,
    to: ADMIN_EMAIL,
    subject: `[CarteAI] New registration: ${user.name.replace(/[\r\n]/g, "").slice(0, 50)}`,
    html: _previewAdminEmail(user),
  });
}

/**
 * Send an account-activated notification when admin approves a user.
 */
export async function sendAccountActivatedEmail(user: {
  name: string;
  email: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM_HELLO,
    to: user.email,
    subject: "Your CarteAI account is activated! / Votre compte est activé ! / 您的账户已激活！",
    html: _previewAccountActivatedEmail(user),
  });
}

/**
 * Send a password reset email.
 */
export async function sendPasswordResetEmail(data: {
  name: string;
  email: string;
  url: string;
}) {
  if (!process.env.RESEND_API_KEY) return;

  await resend.emails.send({
    from: FROM_NOREPLY,
    to: data.email,
    subject: "Reset your CarteAI password",
    html: _previewPasswordResetEmail(data),
  });
}
