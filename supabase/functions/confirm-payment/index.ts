// Checks with Stripe whether a booking has been paid and records it. Body: { bookingId }
import { serve } from '../_shared/handler.ts';
import { confirmPayment } from '../_shared/payments.ts';

serve((deps, user, body) => confirmPayment(deps, user.id, String(body.bookingId)));
