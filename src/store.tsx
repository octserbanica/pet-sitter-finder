import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { conversationKey } from './chat';
import { confirmPayment, startPayment } from './payments';
import { pickAndUploadPhoto } from './photos';
import { supabase } from './supabase';
import { Booking, BookingStatus, Message, Mode, Pet, Profile, Service, Sitter } from './types';

// Database rows use snake_case; the app uses camelCase.
const toSitter = (r: any): Sitter => ({
  id: r.id, userId: r.user_id, name: r.name, avatar: r.avatar, photoUrl: r.photo_url, city: r.city,
  neighborhood: r.neighborhood, rating: Number(r.rating), reviews: r.reviews, prices: r.prices ?? {},
  extraPetPercent: r.extra_pet_percent ?? 30, price: r.price, years: r.years, verified: r.verified,
  available: r.available, services: r.services, accepts: r.accepts, bio: r.bio, reviewList: r.review_list ?? [],
});
const toPet = (r: any): Pet => ({
  id: r.id, ownerId: r.owner_id, name: r.name, type: r.type, breed: r.breed, age: r.age, size: r.size,
  temperament: r.temperament ?? [], notes: r.notes, photoUrl: r.photo_url,
});
const toBooking = (r: any): Booking => ({
  id: r.id, ownerId: r.owner_id, sitterId: r.sitter_id, ownerName: r.owner_name, pets: r.pets, petIds: r.pet_ids ?? [],
  service: r.service, start: String(r.start).slice(0, 10), nights: r.nights, note: r.note, total: r.total,
  status: r.status, createdAt: Date.parse(r.created_at), paidAt: r.paid_at ? Date.parse(r.paid_at) : null,
  checkoutStarted: !!r.stripe_session_id,
});
const toProfile = (r: any): Profile => ({
  id: r.id, fullName: r.full_name, age: r.age, about: r.about ?? '', avatarUrl: r.avatar_url,
});
const toMessage = (r: any): Message => ({
  id: r.id, ownerId: r.owner_id, sitterId: r.sitter_id, senderId: r.sender_id, body: r.body, createdAt: Date.parse(r.created_at),
});

export interface NewBooking {
  sitterId: string;
  petIds: string[];
  service: Service;
  start: string;
  nights: number;
  note: string;
  total: number; // shown to the user; the database recalculates it
}

export type PetInput = Omit<Pet, 'id' | 'ownerId'>;
export type SitterInput = Pick<Sitter, 'city' | 'neighborhood' | 'available' | 'prices' | 'extraPetPercent' | 'accepts' | 'bio' | 'years'>;

interface Store {
  session: Session | null;
  email: string;
  profile: Profile | null;
  mode: Mode;
  setMode: (m: Mode) => void;
  loading: boolean;
  loadError: string | null;
  sitters: Sitter[];
  myPets: Pet[];
  bookedPets: Pet[]; // other owners' pets in bookings sent to me as a sitter
  bookings: Booking[];
  favorites: string[];
  messages: Message[];
  following: string[]; // user ids I follow
  followers: string[]; // user ids following me
  follow: (userId: string) => Promise<void>;
  unfollow: (userId: string) => Promise<void>;
  unread: (ownerId: string, sitterId: string) => number;
  unreadTotal: number;
  markChatRead: (ownerId: string, sitterId: string) => void;
  people: Record<string, Profile>; // public profiles of people I have bookings or chats with
  mySitter: Sitter | undefined;
  refresh: () => Promise<void>;
  loadPeople: (ids: string[]) => Promise<void>;
  updateProfile: (p: Partial<Omit<Profile, 'id'>>) => Promise<void>;
  uploadPhoto: (name: string) => Promise<string | null>;
  savePet: (pet: PetInput, id?: string) => Promise<void>;
  removePet: (id: string) => Promise<void>;
  createBooking: (b: NewBooking) => Promise<void>;
  setBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  payBooking: (id: string) => Promise<void>;
  becomeSitter: () => Promise<void>;
  updateMySitter: (s: SitterInput) => Promise<void>;
  toggleFavorite: (sitterId: string) => Promise<void>;
  sendMessage: (ownerId: string, sitterId: string, body: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);
const MODE_KEY = 'pet-sitter-finder/mode';

const check = <T,>({ data, error }: { data: T; error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
  return data as NonNullable<T>;
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setModeState] = useState<Mode>('owner');
  const [dataLoading, setDataLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [people, setPeople] = useState<Record<string, Profile>>({});
  const [following, setFollowing] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);
  const [chatReads, setChatReads] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    AsyncStorage.getItem(MODE_KEY).then((m) => m && setModeState(m as Mode)).catch(() => {});
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  const loadPeople = useCallback(async (ids: string[]) => {
    const unique = [...new Set(ids)].filter(Boolean);
    if (!unique.length) return;
    const rows = check(await supabase.from('profiles').select('*').in('id', unique));
    setPeople((p) => ({ ...p, ...Object.fromEntries(rows.map((r: any) => [r.id, toProfile(r)])) }));
  }, []);

  const loadMessages = useCallback(async () => {
    const rows = check(await supabase.from('messages').select('*').order('created_at')).map(toMessage);
    setMessages(rows);
    return rows;
  }, []);

  // After someone opens Stripe checkout, ask the server whether the payment went through.
  const confirmPending = useCallback((rows: Booking[]) => {
    rows
      .filter((b) => b.status === 'accepted' && b.checkoutStarted && !b.paidAt)
      .forEach((b) =>
        confirmPayment(b.id)
          .then(async ({ paid }) => {
            if (!paid) return;
            const row = check(await supabase.from('bookings').select('*').eq('id', b.id).single());
            setBookings((list) => list.map((x) => (x.id === b.id ? toBooking(row) : x)));
          })
          .catch(() => {}),
      );
  }, []);

  // Follows and chat read markers. Failures here (e.g. before migration 004) don't block the app.
  const loadSocial = useCallback(async () => {
    if (!userId) return;
    try {
      const [out, inc, reads] = await Promise.all([
        supabase.from('follows').select('followee_id').eq('follower_id', userId),
        supabase.from('follows').select('follower_id').eq('followee_id', userId),
        supabase.from('chat_reads').select('*'),
      ]);
      const outIds = check(out).map((r: any) => r.followee_id as string);
      const inIds = check(inc).map((r: any) => r.follower_id as string);
      setFollowing(outIds);
      setFollowers(inIds);
      setChatReads(Object.fromEntries(check(reads).map((r: any) => [conversationKey(r.owner_id, r.sitter_id), Date.parse(r.read_at)])));
      await loadPeople([...outIds, ...inIds]);
    } catch {
      // keep whatever we had
    }
  }, [userId, loadPeople]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [p, s, pe, b, f] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('sitters').select('*'),
      supabase.from('pets').select('*').order('created_at'),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('favorites').select('sitter_id'),
    ]);
    setProfile(toProfile(check(p)));
    const sitterRows = check(s).map(toSitter);
    const bookingRows = check(b).map(toBooking);
    setSitters(sitterRows);
    setPets(check(pe).map(toPet));
    setBookings(bookingRows);
    confirmPending(bookingRows);
    setFavorites(check(f).map((r: any) => r.sitter_id));
    const msgs = await loadMessages();
    await loadSocial();
    const sitterOwners = Object.fromEntries(sitterRows.map((x) => [x.id, x.userId]));
    await loadPeople([
      ...bookingRows.map((x) => x.ownerId),
      ...msgs.flatMap((m) => [m.ownerId, sitterOwners[m.sitterId] ?? '']),
    ]);
  }, [userId, loadMessages, loadPeople, confirmPending, loadSocial]);

  useEffect(() => {
    if (!userId) {
      setProfile(null); setSitters([]); setPets([]); setBookings([]); setFavorites([]); setMessages([]); setPeople({});
      setFollowing([]); setFollowers([]); setChatReads({});
      return;
    }
    setDataLoading(true);
    setLoadError(null);
    refresh().catch((e) => setLoadError(e.message)).finally(() => setDataLoading(false));
  }, [userId, refresh]);

  // Check for new chat messages every few seconds while signed in.
  useEffect(() => {
    if (!userId) return;
    const timer = setInterval(() => {
      loadMessages()
        .then((msgs) => {
          const unknown = msgs.map((m) => m.ownerId).filter((id) => !people[id]);
          if (unknown.length) loadPeople(unknown).catch(() => {});
        })
        .catch(() => {});
    }, 5000);
    return () => clearInterval(timer);
  }, [userId, loadMessages, loadPeople, people]);

  // Mobile: when coming back from the Stripe page in the browser, check for the payment.
  const bookingsRef = useRef(bookings);
  bookingsRef.current = bookings;
  useEffect(() => {
    if (!userId || Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') confirmPending(bookingsRef.current);
    });
    return () => sub.remove();
  }, [userId, confirmPending]);

  const mySitter = sitters.find((s) => s.userId === userId);

  // Messages from the other person that arrived after I last opened the conversation.
  const unread = (ownerId: string, sitterId: string) => {
    const readAt = chatReads[conversationKey(ownerId, sitterId)] ?? 0;
    return messages.filter((m) => m.ownerId === ownerId && m.sitterId === sitterId && m.senderId !== userId && m.createdAt > readAt).length;
  };
  const unreadTotal = messages.filter((m) => m.senderId !== userId && m.createdAt > (chatReads[conversationKey(m.ownerId, m.sitterId)] ?? 0)).length;

  const store: Store = {
    session,
    email: session?.user.email ?? '',
    profile,
    mode,
    setMode: (m) => {
      setModeState(m);
      AsyncStorage.setItem(MODE_KEY, m).catch(() => {});
    },
    loading: !authReady || dataLoading || (!!userId && !profile && !loadError),
    loadError,
    sitters,
    myPets: pets.filter((p) => p.ownerId === userId),
    bookedPets: pets.filter((p) => p.ownerId !== userId),
    bookings,
    favorites,
    messages,
    people,
    mySitter,
    refresh,
    loadPeople,
    updateProfile: async (patch) => {
      const row = check(
        await supabase
          .from('profiles')
          .update({
            ...(patch.fullName !== undefined && { full_name: patch.fullName }),
            ...(patch.age !== undefined && { age: patch.age }),
            ...(patch.about !== undefined && { about: patch.about }),
            ...(patch.avatarUrl !== undefined && { avatar_url: patch.avatarUrl }),
          })
          .eq('id', userId!)
          .select()
          .single(),
      );
      setProfile(toProfile(row));
      // The database copies name and photo onto the sitter listing.
      if (mySitter) {
        const s = check(await supabase.from('sitters').select('*').eq('id', mySitter.id).single());
        setSitters((list) => list.map((x) => (x.id === mySitter.id ? toSitter(s) : x)));
      }
    },
    uploadPhoto: (name) => pickAndUploadPhoto(userId!, name),
    savePet: async (pet, id) => {
      const values = {
        name: pet.name, type: pet.type, breed: pet.breed, age: pet.age, size: pet.size,
        temperament: pet.temperament, notes: pet.notes, photo_url: pet.photoUrl,
      };
      const row = toPet(check(
        id
          ? await supabase.from('pets').update(values).eq('id', id).select().single()
          : await supabase.from('pets').insert(values).select().single(),
      ));
      setPets((list) => (id ? list.map((p) => (p.id === id ? row : p)) : [...list, row]));
    },
    removePet: async (id) => {
      check(await supabase.from('pets').delete().eq('id', id));
      setPets((list) => list.filter((p) => p.id !== id));
    },
    createBooking: async (b) => {
      const row = check(
        await supabase
          .from('bookings')
          .insert({ sitter_id: b.sitterId, pet_ids: b.petIds, service: b.service, start: b.start, nights: b.nights, note: b.note, total: b.total })
          .select()
          .single(),
      );
      setBookings((list) => [toBooking(row), ...list]);
    },
    setBookingStatus: async (id, status) => {
      const row = check(await supabase.from('bookings').update({ status }).eq('id', id).select().single());
      setBookings((list) => list.map((x) => (x.id === id ? toBooking(row) : x)));
    },
    payBooking: async (id) => {
      await startPayment(id);
      // On web the page navigates away; on mobile, remember a checkout is open so returning confirms it.
      setBookings((list) => list.map((x) => (x.id === id ? { ...x, checkoutStarted: true } : x)));
    },
    becomeSitter: async () => {
      // The database fills in the name and photo from the profile.
      const row = check(
        await supabase
          .from('sitters')
          .insert({ user_id: userId, name: profile?.fullName || 'New sitter', prices: { dropin: 50 }, accepts: ['dog', 'cat'], available: false })
          .select()
          .single(),
      );
      setSitters((list) => [...list, toSitter(row)]);
    },
    updateMySitter: async (s) => {
      const row = check(
        await supabase
          .from('sitters')
          .update({
            city: s.city, neighborhood: s.neighborhood, available: s.available, prices: s.prices,
            extra_pet_percent: s.extraPetPercent, accepts: s.accepts, bio: s.bio, years: s.years,
          })
          .eq('id', mySitter!.id)
          .select()
          .single(),
      );
      setSitters((list) => list.map((x) => (x.id === mySitter!.id ? toSitter(row) : x)));
    },
    toggleFavorite: async (sitterId) => {
      if (favorites.includes(sitterId)) {
        check(await supabase.from('favorites').delete().eq('sitter_id', sitterId));
        setFavorites((f) => f.filter((x) => x !== sitterId));
      } else {
        check(await supabase.from('favorites').insert({ sitter_id: sitterId }));
        setFavorites((f) => [...f, sitterId]);
      }
    },
    following,
    followers,
    follow: async (id) => {
      check(await supabase.from('follows').insert({ followee_id: id }));
      setFollowing((f) => [...f, id]);
      loadPeople([id]).catch(() => {});
    },
    unfollow: async (id) => {
      check(await supabase.from('follows').delete().eq('follower_id', userId).eq('followee_id', id));
      setFollowing((f) => f.filter((x) => x !== id));
    },
    unread,
    unreadTotal,
    markChatRead: (ownerId, sitterId) => {
      // Use the newest message's server time, so a phone with a wrong clock can't hide or resurrect messages.
      const key = conversationKey(ownerId, sitterId);
      const latest = messages.filter((m) => m.ownerId === ownerId && m.sitterId === sitterId).at(-1)?.createdAt;
      if (!latest || (chatReads[key] ?? 0) >= latest) return;
      setChatReads((r) => ({ ...r, [key]: latest }));
      supabase
        .from('chat_reads')
        .upsert({ user_id: userId, owner_id: ownerId, sitter_id: sitterId, read_at: new Date(latest).toISOString() }, { onConflict: 'user_id,owner_id,sitter_id' })
        .then(() => {}, () => {});
    },
    sendMessage: async (ownerId, sitterId, body) => {
      const row = check(
        await supabase.from('messages').insert({ owner_id: ownerId, sitter_id: sitterId, body: body.trim() }).select().single(),
      );
      setMessages((list) => [...list, toMessage(row)]);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
