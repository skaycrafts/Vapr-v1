import 'server-only';
import type { Enquiry } from '@/lib/enquiry-shape';
import { deskEmail, guestEmail } from './email-template';

/**
 * Posting the two letters.
 *
 * Configured or silent, never half-done: with no provider key this does
 * nothing and says so to the caller, and the enquiry is still saved. An
 * alert that fails must never cost the enquiry it was announcing, which is
 * why every path here returns rather than throws.
 *
 * Resend's HTTP API, over `fetch`, so no mail dependency enters the build.
 *   RESEND_API_KEY   the provider key
 *   VAPR_FROM_EMAIL  the sender, on a domain verified with the provider
 *   VAPR_DESK_EMAIL  where the desk's copy goes
 */

export type NotifyResult = { sent: boolean; reason?: string };

type Letter = { to: string; subject: string; html: string; text: string; replyTo?: string };

async function send(letter: Letter): Promise<NotifyResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { sent: false, reason: 'no email provider configured' };

  // Resend's sandbox sender works without a verified domain, which is what
  // makes this testable before anyone owns vapr-whatever.com. It can only
  // deliver to the account's own address, so a real `VAPR_FROM_EMAIL` on a
  // verified domain is required before a guest ever receives one of these.
  const from = process.env.VAPR_FROM_EMAIL?.trim() || 'VAPR <onboarding@resend.dev>';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [letter.to],
        subject: letter.subject,
        html: letter.html,
        text: letter.text,
        ...(letter.replyTo ? { reply_to: letter.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return { sent: false, reason: `provider returned ${response.status} ${detail.slice(0, 180)}` };
    }
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : 'request failed' };
  }
}

/** The acknowledgement the guest is promised on the closing screen. */
export async function notifyGuest(enquiry: Enquiry): Promise<NotifyResult> {
  if (!enquiry.email) return { sent: false, reason: 'the guest gave no email address' };
  const letter = guestEmail(enquiry);
  return send({
    to: enquiry.email,
    subject: letter.subject,
    html: letter.html,
    text: letter.text,
    // A reply to the acknowledgement should reach the desk, not the robot.
    replyTo: process.env.VAPR_DESK_EMAIL?.trim() || undefined,
  });
}

/** The desk's copy, which is the one that has to arrive. */
export async function notifyDesk(enquiry: Enquiry): Promise<NotifyResult> {
  const to = process.env.VAPR_DESK_EMAIL?.trim();
  if (!to) return { sent: false, reason: 'no desk address configured' };
  const letter = deskEmail(enquiry);
  return send({
    to,
    subject: letter.subject,
    html: letter.html,
    text: letter.text,
    replyTo: enquiry.email ?? undefined,
  });
}
