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
 *
 *   RESEND_API_KEY   the provider key — a secret, environment only, never
 *                    in this repository. Nothing sends until it is set.
 *   VAPR_FROM_EMAIL  overrides the sender below
 *   VAPR_DESK_EMAIL  overrides the desk address below
 *
 * The two addresses have defaults and the key does not, which is the whole
 * point: an address is a business fact and belongs with the rest of the
 * business facts, while a key is a credential and belongs nowhere near
 * them. It also means one variable to set rather than three, and two fewer
 * ways for a deployment to be half-configured.
 */

/**
 * Who the guest hears from. `vaprrooms.com` is verified with the provider,
 * so any address on it can send.
 *
 * Spelled `enquiers` because that is what the desk asked for. If it was
 * meant to be `enquiries`, it is `VAPR_FROM_EMAIL` and nothing else — the
 * mailbox need not exist for sending, and replies go to the desk address
 * below rather than to this one.
 */
const FROM = 'VAPR <enquiers@vaprrooms.com>';

/** Where the enquiry itself lands. */
const DESK = 'vapr.enquiry@gmail.com';

export type NotifyResult = { sent: boolean; reason?: string };

type Letter = { to: string; subject: string; html: string; text: string; replyTo?: string };

async function send(letter: Letter): Promise<NotifyResult> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { sent: false, reason: 'no email provider configured' };

  const from = process.env.VAPR_FROM_EMAIL?.trim() || FROM;

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
    replyTo: process.env.VAPR_DESK_EMAIL?.trim() || DESK,
  });
}

/** The desk's copy, which is the one that has to arrive. */
export async function notifyDesk(enquiry: Enquiry): Promise<NotifyResult> {
  const to = process.env.VAPR_DESK_EMAIL?.trim() || DESK;
  const letter = deskEmail(enquiry);
  return send({
    to,
    subject: letter.subject,
    html: letter.html,
    text: letter.text,
    replyTo: enquiry.email ?? undefined,
  });
}
