// Wires the payment logic to Supabase (Deno). Each function's index.ts calls serve() with its action.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { PaymentError, type Deps } from './payments.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

type Action = (deps: Deps, user: { id: string; email?: string }, body: any) => Promise<unknown>;

export function serve(action: Action) {
  Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
    try {
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeKey) throw new PaymentError('Payments are not set up yet (missing STRIPE_SECRET_KEY)', 500);

      // Server key: bypasses row level security, so every check on who may pay is done in payments.ts.
      const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
      const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
      const { data: { user } } = await admin.auth.getUser(token);
      if (!user) throw new PaymentError('Please sign in again', 401);

      const deps: Deps = {
        stripeKey,
        fetch,
        getBooking: async (id) => (await admin.from('bookings').select('*').eq('id', id).maybeSingle()).data,
        isSitterUser: async (sitterId, userId) =>
          !!(await admin.from('sitters').select('id').eq('id', sitterId).eq('user_id', userId).maybeSingle()).data,
        sitterName: async (sitterId) => (await admin.from('sitters').select('name').eq('id', sitterId).single()).data?.name ?? 'your sitter',
        saveSession: async (bookingId, sessionId) => {
          const { error } = await admin.from('bookings').update({ stripe_session_id: sessionId }).eq('id', bookingId);
          if (error) throw new Error(error.message);
        },
        markPaid: async (bookingId) => {
          const { error } = await admin.from('bookings').update({ paid_at: new Date().toISOString() }).eq('id', bookingId).is('paid_at', null);
          if (error) throw new Error(error.message);
        },
      };
      return json(await action(deps, user, await req.json()));
    } catch (e) {
      const status = e instanceof PaymentError ? e.status : 500;
      return json({ error: (e as Error).message }, status);
    }
  });
}
