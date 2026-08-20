import { Resend } from "resend";

let resendInstance: Resend | null = null;

/** Lazily creates the Resend client — never at module load time, so builds don't fail without the key set. */
export function getResend(): Resend {
  if (resendInstance) return resendInstance;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set. Add it to your environment variables (see .env.example).");
  }

  resendInstance = new Resend(apiKey);
  return resendInstance;
}

/** The "From" address emails are sent from — must be a verified domain in Resend. */
export const EMAIL_FROM = process.env.EMAIL_FROM ?? "Teelte <onboarding@resend.dev>";

/** Where admin notification emails (new waitlist signups, etc.) are sent. */
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
