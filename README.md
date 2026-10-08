# Pet Sitter Finder (prototype)

One Expo (React Native) codebase that runs on iOS, Android and the web.
All data is sample data stored on the device (AsyncStorage / localStorage); there is no server yet.

## Run it

```bash
npm install
npx expo start          # press w for web, or scan the QR code with Expo Go on your phone
npx expo start --web    # web only
npx expo export --platform web   # static web build in dist/
```

## What it does

- **Welcome**: choose "I need a pet sitter" (owner) or "I want to pet sit" (sitter).
- **Owner**: search sitters by city/area/name, filter by pet type, service and availability, sort by rating or price;
  view a sitter profile with services, prices and reviews; save favourites; request a booking (pets, service, dates, notes, price quote);
  track and cancel bookings; manage your pets.
- **Sitter** (acts as the sample sitter Maria Ionescu): accept or decline incoming requests, see upcoming stays and confirmed earnings,
  edit availability, price, services, accepted pets and bio.
- Requests sent to other sample sitters are auto-accepted after a few seconds. Requests to Maria are answered by switching to sitter mode
  (Account tab), which demos the full owner-to-sitter loop.

## Layout

- `App.tsx`: role gate, tab bar and a small screen stack
- `src/store.tsx`: app state (reducer) and persistence
- `src/data.ts`: sample sitters, pets and bookings
- `src/screens/`: one file per screen
- `src/pricing.ts`: quote rule (walks are half the base rate; each extra pet adds 30%)

## Not built yet

Real accounts and sign-in, a backend and database, payments, chat, maps/location search, photos, push notifications, reviews after a stay.
