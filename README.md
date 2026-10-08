# Pet Sitter Finder (prototype)

One Expo (React Native) codebase that runs on iOS, Android and the web.
Accounts and data live in Supabase (Postgres + Auth). The database schema and access rules are in `supabase/schema.sql`.

## Connect Supabase (one time)

1. In the Supabase dashboard open **SQL Editor** and run each file in `supabase/migrations/` once, in order
   (`001_initial.sql`, then `002_profiles_pets_chat.sql`, …). Each new file only needs to be run once.
2. Open **Project Settings > API**, copy the **anon public** key and put it in `.env` as `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Email verification: keep **Authentication > Sign In / Providers > Email > Confirm email** turned on.
   In **Authentication > URL Configuration** set the Site URL to the live site and add it (and `https://*--pet-sitter-finder.netlify.app/**`
   for preview builds) under Redirect URLs, so confirmation links open the app.

## Payments (Stripe, one time)

Owners pay for an accepted booking through Stripe Checkout. Two Supabase Edge Functions in `supabase/functions/` talk to Stripe,
so the Stripe secret key never reaches the app.

1. Run `supabase/migrations/003_payments.sql` in the SQL Editor (as above).
2. In Stripe (test mode) copy the **Secret key** (`sk_test_…`). In Supabase open **Edge Functions > Secrets** and add it as
   `STRIPE_SECRET_KEY`. Never commit it or paste it anywhere else.
3. In Supabase open **Account > Access Tokens**, create a token, and add it to the GitHub repository under
   **Settings > Secrets and variables > Actions** as `SUPABASE_ACCESS_TOKEN`.
4. Merge to `main`. The **Deploy Supabase functions** GitHub Action deploys both functions (it can also be run by hand from the Actions tab).

Test card: `4242 4242 4242 4242`, any future date, any CVC. After paying, Stripe sends the owner back to the app, which asks
the server to check the payment with Stripe and marks the booking paid. A paid booking can't be cancelled in the app.

## Run it

```bash
npm install
npx expo start          # press w for web, or scan the QR code with Expo Go on your phone
npx expo start --web    # web only
npx expo export --platform web   # static web build in dist/
```

## What it does

- **Accounts**: email and password sign-up with email verification (resend link if it got lost), password reset. Sessions stay signed in.
- **One account, two modes**: everyone can look for sitters; "Become a sitter too" in Profile adds a sitter listing and a sitter mode.
- **Profile**: name, age, photo and "About me", shown to the people you book or chat with.
- **Pets** (owner mode): name, type, breed, age, size, temperament, "good to know" notes and a photo.
- **Find and book**: search sitters by city/area/name, filter by pet type and service, see each service's price and the extra-pet charge,
  save favourites, request a booking with a price quote, cancel, and pay by card once the sitter accepts.
- **Sitter mode**: accept or decline requests (with the owner's profile and their pets' details), see upcoming stays and earnings,
  set services with a price for each, extra-pet charge, pets accepted, city, experience and availability.
- **Chat**: owners and sitters message each other from a sitter's page, a booking or the Messages tab (refreshes every few seconds).
- The six demo sitters have no account: bookings with them are accepted instantly and they can't be messaged.

## Security rules (enforced in the database, not the app)

- Owners see only their own pets, favourites and bookings; sitters see only requests sent to them and the pets in those requests.
- Only the two people in a conversation can read or write it.
- Profiles (name, age, photo, about) are visible to signed-in users; only you can edit yours.
- Sitters can edit only their own listing, and cannot change their rating, reviews or verified badge. Nobody can book themselves.
- After a booking is made only its status can change: the owner may cancel; the sitter may accept, decline, or cancel an accepted stay.
- Booking prices are recalculated by the database from the sitter's prices.
- Only the server can mark a booking paid, after Stripe confirms the payment, amount and currency. Only the owner of an accepted booking can pay.
- Photos are stored in a public "photos" bucket; each user can only upload into their own folder.

## Layout

- `App.tsx`: role gate, tab bar and a small screen stack
- `src/supabase.ts`: Supabase client (session stored with AsyncStorage)
- `src/store.tsx`: loads and saves data through Supabase
- `src/screens/AuthScreen.tsx`: sign in, sign up, email confirmation and password reset
- `src/photos.ts`: photo picking and upload to Supabase Storage
- `supabase/migrations/`: database tables, triggers, row level security policies and demo sitters
- `src/screens/`: one file per screen
- `src/payments.ts` and `supabase/functions/`: Stripe checkout and payment check (`_shared/payments.ts` holds the rules, with tests)
- `src/pricing.ts`: quote rule (walks are half the base rate; each extra pet adds 30%)

## Not built yet

Refunds in the app (do them from the Stripe dashboard for now), payouts to sitters, sign-in with Google or Apple, maps/location search, push notifications, reviews after a stay.
