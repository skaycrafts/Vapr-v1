import 'server-only';
import { CONTACT, LOCATIONS, SITE } from '@/lib/content';
import type { Enquiry } from '@/lib/enquiry-shape';

/**
 * The two letters an enquiry produces: one to the guest, one to the desk.
 *
 * ── Why this is written in tables ──────────────────────────────────────
 * Not nostalgia. Gmail strips `<style>` blocks on some clients, Outlook on
 * Windows renders through Word and ignores most of flexbox, grid and
 * `max-width` on divs, and every client disagrees about default margins. A
 * 600px table with inline styles is the one layout that survives all of
 * them, which is why every transactional mail you have ever received looks
 * like this underneath.
 *
 * ── Why there are no webfonts ─────────────────────────────────────────
 * Bodoni is the site's voice and cannot be relied on in mail: Gmail drops
 * `@font-face` entirely. The stack falls to Georgia, which is the closest
 * thing to a Didone that is already on the reader's machine, and the
 * wordmark gets the letter-spacing it has on the site so the shape of the
 * name is right even where the face is not.
 *
 * ── Why so much of it is conditional ──────────────────────────────────
 * The telephone number, the WhatsApp link and the desk address are all
 * configuration this site does not yet have. A letter that says "call us on
 * +91 00000 00000" is worse than one that does not mention the telephone,
 * so every one of those blocks is rendered only when its value exists.
 */

const INK = '#0E0F10';
const PANEL = '#17181A';
const PAPER = '#FBFAF8';
const MIST = '#A6A8AB';
const SMOKE = '#7E8184';
const HAIRLINE = '#2A2C2E';

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const esc = (value: string) =>
  value.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** `2026-09-11` → `Fri 11 September, 2026`. Local parts, never `Date.parse`. */
export function longDate(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  const at = new Date(y, m - 1, d);
  return `${DAYS[at.getDay()]} ${d} ${MONTHS[m - 1]}, ${y}`;
}

const nightsBetween = (from: string | null, to: string | null): number | null => {
  if (!from || !to) return null;
  const n = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
  return n > 0 ? n : null;
};

type Row = { label: string; value: string; href?: string };

const rows = (items: Row[]) =>
  items
    .map(
      ({ label, value, href }, i) => `
      <tr>
        <td style="padding:13px 16px 13px 0;border-top:${i === 0 ? '0' : `1px solid ${HAIRLINE}`};font-family:${SANS};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${SMOKE};vertical-align:top;white-space:nowrap;">${esc(label)}</td>
        <td style="padding:13px 0;border-top:${i === 0 ? '0' : `1px solid ${HAIRLINE}`};font-family:${SANS};font-size:15px;font-weight:600;color:${PAPER};vertical-align:top;">${
          href ? `<a href="${esc(href)}" style="color:${PAPER};text-decoration:underline;">${esc(value)}</a>` : esc(value)
        }</td>
      </tr>`
    )
    .join('');

/** The masthead both letters share. */
const head = (standfirst: string) => `
  <tr>
    <td bgcolor="${PAPER}" style="background:${PAPER};padding:30px 32px 26px;text-align:center;">
      <p style="margin:0 0 10px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#6B6E70;">${esc(standfirst)}</p>
      <p style="margin:0;font-family:${SERIF};font-size:34px;letter-spacing:.14em;color:${INK};">${SITE.name}</p>
    </td>
  </tr>`;

const shell = (inner: string) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<title>${SITE.name}</title>
</head>
<body style="margin:0;padding:0;background:${INK};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${INK}" style="background:${INK};">
    <tr>
      <td align="center" style="padding:28px 14px 40px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;">
          ${inner}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const footer = (location: ReturnType<typeof LOCATIONS.find>) => {
  const address = location
    ? `${location.street}, ${location.area}, ${SITE.city} ${location.postalCode}`
    : `${SITE.city}, ${SITE.region}`;
  return `
  <tr>
    <td style="padding:22px 8px 0;text-align:center;font-family:${SANS};font-size:12px;line-height:1.7;color:${SMOKE};">
      ${esc(SITE.name)} · ${esc(address)}
      ${CONTACT.phone ? `<br><a href="${esc(CONTACT.phoneHref!)}" style="color:${SMOKE};">${esc(CONTACT.phone)}</a>` : ''}
      ${CONTACT.email ? `<br><a href="mailto:${esc(CONTACT.email)}" style="color:${SMOKE};">${esc(CONTACT.email)}</a>` : ''}
    </td>
  </tr>`;
};

/* ── To the guest ─────────────────────────────────────────────────────── */

export function guestEmail(enquiry: Enquiry): { subject: string; html: string; text: string } {
  const location = LOCATIONS.find((l) => l.slug === enquiry.location);
  const hotel = location ? `${location.name} — ${location.area}, ${SITE.city}` : SITE.name;
  const nights = nightsBetween(enquiry.checkIn, enquiry.checkOut);

  const detail: Row[] = [
    { label: 'Guest name', value: enquiry.name },
    ...(enquiry.email ? [{ label: 'Email', value: enquiry.email, href: `mailto:${enquiry.email}` }] : []),
    ...(enquiry.phone ? [{ label: 'Phone', value: enquiry.phone }] : []),
    { label: 'Property', value: hotel },
    ...(enquiry.rooms
      ? [{ label: 'Rooms', value: `${enquiry.rooms} room${enquiry.rooms === 1 ? '' : 's'}` }]
      : []),
    ...(enquiry.checkIn ? [{ label: 'Check-in', value: longDate(enquiry.checkIn)! }] : []),
    ...(enquiry.checkOut ? [{ label: 'Check-out', value: longDate(enquiry.checkOut)! }] : []),
    ...(nights ? [{ label: 'Nights', value: `${nights}` }] : []),
    ...(enquiry.guests ? [{ label: 'Guests', value: `${enquiry.guests}` }] : []),
    { label: 'Reference', value: enquiry.ref },
  ];

  // Rendered only where a channel exists. With neither configured the letter
  // simply ends on the sign-off rather than inviting a call to nowhere.
  const reach =
    CONTACT.whatsapp || CONTACT.phone
      ? `
    <tr>
      <td style="padding:26px 0 0;font-family:${SANS};font-size:15px;line-height:1.7;color:${MIST};">
        ${
          CONTACT.whatsapp && CONTACT.phone
            ? `Prefer to talk now? Message us on WhatsApp, or call <a href="${esc(CONTACT.phoneHref!)}" style="color:${PAPER};">${esc(CONTACT.phone)}</a>.`
            : CONTACT.phone
              ? `Prefer to talk now? Call <a href="${esc(CONTACT.phoneHref!)}" style="color:${PAPER};">${esc(CONTACT.phone)}</a>.`
              : 'Prefer to talk now? Message us on WhatsApp.'
        }
      </td>
    </tr>
    ${
      CONTACT.whatsapp
        ? `<tr>
      <td style="padding:18px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td bgcolor="#25D366" style="border-radius:999px;">
              <a href="${esc(CONTACT.whatsapp)}" style="display:inline-block;padding:14px 26px;font-family:${SANS};font-size:15px;font-weight:700;color:#0B2E18;text-decoration:none;">Chat with us on WhatsApp</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
        : ''
    }`
      : '';

  const html = shell(`
    ${head(`${SITE.name} · ${location ? `${location.area}, ` : ''}${SITE.city}`)}
    <tr>
      <td bgcolor="${PANEL}" style="background:${PANEL};padding:34px 32px 36px;">
        <h1 style="margin:0 0 20px;font-family:${SANS};font-size:23px;font-weight:700;color:${PAPER};">We&rsquo;ve received your enquiry</h1>

        <p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.7;color:${MIST};">Dear <b style="color:${PAPER};">${esc(enquiry.name)}</b>,</p>
        <p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.7;color:${MIST};">Thank you for reaching out to ${esc(SITE.name)}.</p>
        <p style="margin:0 0 30px;font-family:${SANS};font-size:15px;line-height:1.7;color:${MIST};">We have received your enquiry, and our team will contact you within <b style="color:${PAPER};">30 minutes</b> to help with your stay.</p>

        <h2 style="margin:0 0 6px;font-family:${SANS};font-size:16px;font-weight:700;color:${PAPER};">Your request details</h2>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          ${rows(detail)}
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${reach}
          <tr>
            <td style="padding:28px 0 0;font-family:${SANS};font-size:15px;line-height:1.7;color:${MIST};">
              Thank you for considering ${esc(SITE.name)} — we look forward to welcoming you.
            </td>
          </tr>
          <tr>
            <td style="padding:22px 0 0;font-family:${SANS};font-size:15px;line-height:1.7;color:${SMOKE};">
              Warm regards,<br>The ${esc(SITE.name)}${location ? ` ${esc(location.shortName)}` : ''} team
            </td>
          </tr>
        </table>
      </td>
    </tr>
    ${footer(location)}`);

  const text = [
    `We've received your enquiry`,
    ``,
    `Dear ${enquiry.name},`,
    ``,
    `Thank you for reaching out to ${SITE.name}. Our team will contact you within 30 minutes to help with your stay.`,
    ``,
    `YOUR REQUEST DETAILS`,
    ...detail.map((r) => `${r.label}: ${r.value}`),
    ``,
    CONTACT.phone ? `Prefer to talk now? Call ${CONTACT.phone}.` : '',
    CONTACT.whatsapp ? `WhatsApp: ${CONTACT.whatsapp}` : '',
    ``,
    `Warm regards,`,
    `The ${SITE.name}${location ? ` ${location.shortName}` : ''} team`,
  ]
    .filter((line) => line !== undefined)
    .join('\n');

  return {
    subject: `We've received your enquiry — ${enquiry.ref}`,
    html,
    text,
  };
}

/* ── To the desk ──────────────────────────────────────────────────────── */

export function deskEmail(enquiry: Enquiry): { subject: string; html: string; text: string } {
  const location = LOCATIONS.find((l) => l.slug === enquiry.location);
  const nights = nightsBetween(enquiry.checkIn, enquiry.checkOut);

  const detail: Row[] = [
    { label: 'Guest', value: enquiry.name },
    ...(enquiry.phone ? [{ label: 'Phone', value: enquiry.phone, href: `tel:${enquiry.phone.replace(/[^\d+]/g, '')}` }] : []),
    ...(enquiry.email ? [{ label: 'Email', value: enquiry.email, href: `mailto:${enquiry.email}` }] : []),
    { label: 'Property', value: location?.name ?? enquiry.location },
    ...(enquiry.checkIn ? [{ label: 'Check-in', value: longDate(enquiry.checkIn)! }] : []),
    ...(enquiry.checkOut ? [{ label: 'Check-out', value: longDate(enquiry.checkOut)! }] : []),
    ...(nights ? [{ label: 'Nights', value: `${nights}` }] : []),
    ...(enquiry.guests ? [{ label: 'Guests', value: `${enquiry.guests}` }] : []),
    ...(enquiry.rooms ? [{ label: 'Rooms', value: `${enquiry.rooms}` }] : []),
    { label: 'Reference', value: enquiry.ref },
  ];

  const html = shell(`
    ${head('New enquiry')}
    <tr>
      <td bgcolor="${PANEL}" style="background:${PANEL};padding:34px 32px 36px;">
        <h1 style="margin:0 0 6px;font-family:${SANS};font-size:23px;font-weight:700;color:${PAPER};">${esc(enquiry.name)} — ${esc(location?.shortName ?? enquiry.location)}</h1>
        <p style="margin:0 0 26px;font-family:${SANS};font-size:15px;line-height:1.7;color:${MIST};">The guest has been told the desk will call within 30 minutes.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          ${rows(detail)}
        </table>
        ${
          enquiry.message
            ? `<p style="margin:24px 0 0;padding-left:14px;border-left:2px solid ${HAIRLINE};font-family:${SANS};font-size:15px;line-height:1.7;color:${MIST};white-space:pre-wrap;">${esc(enquiry.message)}</p>`
            : ''
        }
      </td>
    </tr>
    ${footer(location)}`);

  const text = [
    `New enquiry — ${enquiry.ref}`,
    ...detail.map((r) => `${r.label}: ${r.value}`),
    enquiry.message ? `\n${enquiry.message}` : '',
  ].join('\n');

  return { subject: `Enquiry ${enquiry.ref} — ${enquiry.name}`, html, text };
}
