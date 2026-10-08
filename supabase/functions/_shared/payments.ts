// Payment logic shared by the create-checkout and confirm-payment functions.
// It has no imports so it runs the same in Supabase Edge Functions (Deno) and in local tests (Node).

export interface BookingRow {
  id: string;
  owner_id: string;
  sitter_id: string;
  status: string;
  total: number; // RON
  paid_at: string | null;
  stripe_session_id: string | null;
}

export interface Deps {
  stripeKey: string;
  fetch: typeof fetch;
  getBooking: (id: string) => Promise<BookingRow | null>;
  isSitterUser: (sitterId: string, userId: string) => Promise<boolean>;
  sitterName: (sitterId: string) => Promise<string>;
  saveSession: (bookingId: string, sessionId: string) => Promise<void>;
  markPaid: (bookingId: string) => Promise<void>;
}

export class PaymentError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// Stripe only redirects back to our own sites.
const allowedReturn = [
  /^https:\/\/pet-sitter-finder\.netlify\.app(\/|$)/,
  /^https:\/\/[a-z0-9-]+--pet-sitter-finder\.netlify\.app(\/|$)/,
  /^http:\/\/localhost(:\d+)?(\/|$)/,
];
export const DEFAULT_RETURN = 'https://pet-sitter-finder.netlify.app/';

async function stripe(deps: Deps, path: string, params?: Record<string, string>) {
  const res = await deps.fetch(`https://api.stripe.com/v1/${path}`, {
    method: params ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${deps.stripeKey}`,
      ...(params && { 'Content-Type': 'application/x-www-form-urlencoded' }),
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new PaymentError(data?.error?.message ?? 'Stripe request failed', 502);
  return data;
}

export async function createCheckout(deps: Deps, userId: string, email: string | undefined, bookingId: string, returnUrl?: string) {
  const booking = await deps.getBooking(bookingId);
  if (!booking || booking.owner_id !== userId) throw new PaymentError('Booking not found', 404);
  if (booking.paid_at) throw new PaymentError('This booking is already paid');
  if (booking.status !== 'accepted') throw new PaymentError('You can pay once the sitter has accepted the booking');

  const base = returnUrl && allowedReturn.some((r) => r.test(returnUrl)) ? returnUrl.split(/[?#]/)[0] : DEFAULT_RETURN;
  const name = await deps.sitterName(booking.sitter_id);
  const session = await stripe(deps, 'checkout/sessions', {
    mode: 'payment',
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'ron',
    'line_items[0][price_data][unit_amount]': String(Math.round(booking.total * 100)),
    'line_items[0][price_data][product_data][name]': `Pet sitting with ${name}`,
    client_reference_id: booking.id,
    'metadata[booking_id]': booking.id,
    ...(email && { customer_email: email }),
    success_url: `${base}?paid=${booking.id}`,
    cancel_url: `${base}?unpaid=${booking.id}`,
  });
  await deps.saveSession(booking.id, session.id);
  return { url: session.url as string };
}

// Asks Stripe whether the booking's checkout was paid, and records it if so.
export async function confirmPayment(deps: Deps, userId: string, bookingId: string) {
  const booking = await deps.getBooking(bookingId);
  if (!booking) throw new PaymentError('Booking not found', 404);
  if (booking.owner_id !== userId && !(await deps.isSitterUser(booking.sitter_id, userId))) {
    throw new PaymentError('Booking not found', 404);
  }
  if (booking.paid_at) return { paid: true };
  if (!booking.stripe_session_id) return { paid: false };

  const session = await stripe(deps, `checkout/sessions/${encodeURIComponent(booking.stripe_session_id)}`);
  const paid =
    session.payment_status === 'paid' &&
    session.metadata?.booking_id === booking.id &&
    session.amount_total === Math.round(booking.total * 100) &&
    session.currency === 'ron';
  if (paid) await deps.markPaid(booking.id);
  return { paid };
}
