// Run with: node --test supabase/functions/_shared/payments.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { confirmPayment, createCheckout, type BookingRow, type Deps } from './payments.ts';

const OWNER = 'owner-1';
const SITTER_USER = 'sitter-user-1';

function setup(booking: Partial<BookingRow> = {}, stripeSession: Record<string, unknown> = {}) {
  const row: BookingRow = {
    id: 'b1', owner_id: OWNER, sitter_id: 's1', status: 'accepted', total: 420, paid_at: null, stripe_session_id: null, ...booking,
  };
  const calls: { url: string; body?: string; auth?: string }[] = [];
  const deps: Deps = {
    stripeKey: 'sk_test_x',
    fetch: (async (url: string, init: any) => {
      calls.push({ url, body: init.body, auth: init.headers.Authorization });
      const data = init.method === 'POST'
        ? { id: 'cs_1', url: 'https://checkout.stripe.com/c/pay/cs_1' }
        : { id: 'cs_1', payment_status: 'paid', amount_total: 42000, currency: 'ron', metadata: { booking_id: 'b1' }, ...stripeSession };
      return new Response(JSON.stringify(data), { status: 200 });
    }) as typeof fetch,
    getBooking: async (id) => (id === row.id ? row : null),
    isSitterUser: async (sitterId, userId) => sitterId === 's1' && userId === SITTER_USER,
    sitterName: async () => 'Bianca',
    saveSession: async (_id, sid) => { row.stripe_session_id = sid; },
    markPaid: async () => { row.paid_at = '2026-10-08T12:00:00Z'; },
  };
  return { row, deps, calls };
}

test('creates a checkout in RON for the booking total and remembers the session', async () => {
  const { row, deps, calls } = setup();
  const res = await createCheckout(deps, OWNER, 'o@x.io', 'b1', 'https://deploy-preview-2--pet-sitter-finder.netlify.app/?x=1');
  assert.equal(res.url, 'https://checkout.stripe.com/c/pay/cs_1');
  assert.equal(row.stripe_session_id, 'cs_1');
  const body = new URLSearchParams(calls[0].body);
  assert.equal(calls[0].url, 'https://api.stripe.com/v1/checkout/sessions');
  assert.equal(calls[0].auth, 'Bearer sk_test_x');
  assert.equal(body.get('line_items[0][price_data][unit_amount]'), '42000');
  assert.equal(body.get('line_items[0][price_data][currency]'), 'ron');
  assert.equal(body.get('metadata[booking_id]'), 'b1');
  assert.equal(body.get('success_url'), 'https://deploy-preview-2--pet-sitter-finder.netlify.app/?paid=b1');
});

test('unknown return addresses fall back to the live site', async () => {
  const { deps, calls } = setup();
  await createCheckout(deps, OWNER, undefined, 'b1', 'https://evil.example/phish');
  assert.equal(new URLSearchParams(calls[0].body).get('cancel_url'), 'https://pet-sitter-finder.netlify.app/?unpaid=b1');
});

test('only the owner of an accepted, unpaid booking can pay', async () => {
  await assert.rejects(createCheckout(setup().deps, 'someone-else', undefined, 'b1'), /Booking not found/);
  await assert.rejects(createCheckout(setup({ status: 'pending' }).deps, OWNER, undefined, 'b1'), /once the sitter has accepted/);
  await assert.rejects(createCheckout(setup({ paid_at: 'x' }).deps, OWNER, undefined, 'b1'), /already paid/);
});

test('confirm marks the booking paid when Stripe says so', async () => {
  const { row, deps } = setup({ stripe_session_id: 'cs_1' });
  assert.deepEqual(await confirmPayment(deps, OWNER, 'b1'), { paid: true });
  assert.ok(row.paid_at);
});

test('the sitter can also check payment; strangers cannot', async () => {
  assert.deepEqual(await confirmPayment(setup({ stripe_session_id: 'cs_1' }).deps, SITTER_USER, 'b1'), { paid: true });
  await assert.rejects(confirmPayment(setup({ stripe_session_id: 'cs_1' }).deps, 'stranger', 'b1'), /Booking not found/);
});

test('confirm does not mark paid for unpaid, mismatched or wrong-amount sessions', async () => {
  for (const s of [{ payment_status: 'unpaid' }, { metadata: { booking_id: 'other' } }, { amount_total: 100 }, { currency: 'eur' }]) {
    const { row, deps } = setup({ stripe_session_id: 'cs_1' }, s);
    assert.deepEqual(await confirmPayment(deps, OWNER, 'b1'), { paid: false });
    assert.equal(row.paid_at, null);
  }
  const { deps, calls } = setup();
  assert.deepEqual(await confirmPayment(deps, OWNER, 'b1'), { paid: false });
  assert.equal(calls.length, 0);
});
