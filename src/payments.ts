import { Linking, Platform } from 'react-native';
import { supabase } from './supabase';

// Calls one of our Supabase Edge Functions and returns its JSON, with the server's error message on failure.
async function callFunction<T>(name: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) {
    const detail = await (error as any).context?.json?.().catch(() => null);
    throw new Error(detail?.error ?? 'Could not reach the payment service. Please try again.');
  }
  return data as T;
}

// Web: Stripe sends the user back with ?paid=<booking id> after paying, or ?unpaid=<booking id> if they went back.
const query = Platform.OS === 'web' && typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
export const stripeReturn = query?.get('paid')
  ? { bookingId: query.get('paid')!, paid: true }
  : query?.get('unpaid')
    ? { bookingId: query.get('unpaid')!, paid: false }
    : null;

// Removes the Stripe return info from the address bar so a reload doesn't show the notice again.
export function clearStripeReturn() {
  if (stripeReturn) window.history.replaceState(null, '', window.location.pathname);
}

// Opens Stripe's checkout page for an accepted booking.
export async function startPayment(bookingId: string) {
  const returnUrl = Platform.OS === 'web' ? `${window.location.origin}/` : undefined;
  const { url } = await callFunction<{ url: string }>('create-checkout', { bookingId, returnUrl });
  if (Platform.OS === 'web') window.location.assign(url);
  else await Linking.openURL(url);
}

// Asks the server to check with Stripe whether the booking has been paid.
export const confirmPayment = (bookingId: string) => callFunction<{ paid: boolean }>('confirm-payment', { bookingId });
