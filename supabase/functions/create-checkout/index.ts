// Starts a Stripe Checkout payment for an accepted booking. Body: { bookingId, returnUrl? }
import { serve } from '../_shared/handler.ts';
import { createCheckout } from '../_shared/payments.ts';

serve((deps, user, body) => createCheckout(deps, user.id, user.email, String(body.bookingId), body.returnUrl));
