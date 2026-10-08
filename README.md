# Pet Sitter Finder (prototype)

One Expo (React Native) codebase that runs on iOS, Android and the web.
Accounts and data live in Supabase (Postgres + Auth). The database schema and access rules are in `supabase/schema.sql`.

## Connect Supabase (one time)

1. In the Supabase dashboard open **SQL Editor**, paste all of `supabase/schema.sql` and press **Run**.
2. Open **Project Settings > API**, copy the **anon public** key and put it in `.env` as `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Optional, for quicker testing: **Authentication > Sign In / Providers > Email**, turn off **Confirm email** so new accounts can sign in straight away.
   With it on, new users must click the link in their confirmation email first.

## Run it

```bash
npm install
npx expo start          # press w for web, or scan the QR code with Expo Go on your phone
npx expo start --web    # web only
npx expo export --platform web   # static web build in dist/
```

## What it does

- **Sign up / sign in** with email and password, choosing "Find a sitter" (owner) or "Pet sit" (sitter) at sign-up. Password reset by email. Sessions stay signed in.
- **Owner**: search sitters by city/area/name, filter by pet type, service and availability, sort by rating or price;
  view a sitter profile with services, prices and reviews; save favourites; request a booking (pets, service, dates, notes, price quote);
  track and cancel bookings; manage your pets.
- **Sitter**: accept or decline incoming requests, see upcoming stays and confirmed earnings,
  edit name, city, availability, price, services, accepted pets and bio. A new sitter's listing stays hidden until they set "Taking bookings".
- The six demo sitters have no account, so the database accepts bookings with them instantly. To try the full loop, create one sitter
  account and one owner account and book the sitter.

## Security rules (enforced in the database, not the app)

- Owners see only their own pets, favourites and bookings; sitters see only requests sent to them.
- Only signed-in users can browse sitters. Sitters can edit only their own listing and cannot change their rating, reviews or verified badge.
- After a booking is made only its status can change: the owner may cancel; the sitter may accept, decline, or cancel an accepted stay.
- The booking price is recalculated by the database, so it cannot be tampered with from the app.

## Layout

- `App.tsx`: role gate, tab bar and a small screen stack
- `src/supabase.ts`: Supabase client (session stored with AsyncStorage)
- `src/store.tsx`: loads and saves data through Supabase
- `src/screens/AuthScreen.tsx`: sign in, sign up and password reset
- `supabase/schema.sql`: tables, triggers, row level security policies and demo sitters
- `src/screens/`: one file per screen
- `src/pricing.ts`: quote rule (walks are half the base rate; each extra pet adds 30%)

## Not built yet

Sign-in with Google or Apple, payments, chat, maps/location search, photos, push notifications, reviews after a stay.
