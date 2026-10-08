import type { Session } from '@supabase/supabase-js';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { Booking, BookingStatus, Pet, Profile, Service, Sitter } from './types';

// Database rows use snake_case; the app uses camelCase.
const toSitter = (r: any): Sitter => ({
  id: r.id, userId: r.user_id, name: r.name, avatar: r.avatar, city: r.city, neighborhood: r.neighborhood,
  rating: Number(r.rating), reviews: r.reviews, price: r.price, years: r.years, verified: r.verified,
  available: r.available, services: r.services, accepts: r.accepts, bio: r.bio, reviewList: r.review_list ?? [],
});
const toPet = (r: any): Pet => ({ id: r.id, name: r.name, type: r.type, breed: r.breed, age: r.age, notes: r.notes });
const toBooking = (r: any): Booking => ({
  id: r.id, ownerId: r.owner_id, sitterId: r.sitter_id, ownerName: r.owner_name, pets: r.pets, service: r.service,
  start: String(r.start).slice(0, 10), nights: r.nights, note: r.note, total: r.total, status: r.status, createdAt: Date.parse(r.created_at),
});

export interface NewBooking {
  sitterId: string;
  pets: { name: string; type: Pet['type'] }[];
  service: Service;
  start: string;
  nights: number;
  note: string;
  total: number; // shown to the user; the database recalculates it
}

interface Store {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  loadError: string | null;
  sitters: Sitter[];
  pets: Pet[];
  bookings: Booking[];
  favorites: string[];
  mySitter: Sitter | undefined;
  refresh: () => Promise<void>;
  addPet: (pet: Omit<Pet, 'id'>) => Promise<void>;
  removePet: (id: string) => Promise<void>;
  createBooking: (b: NewBooking) => Promise<void>;
  setBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  updateMySitter: (s: Sitter) => Promise<void>;
  toggleFavorite: (sitterId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

const check = <T,>({ data, error }: { data: T; error: { message: string } | null }) => {
  if (error) throw new Error(error.message);
  return data as NonNullable<T>;
};

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  const refresh = useCallback(async () => {
    if (!userId) return;
    const [p, s, pe, b, f] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('sitters').select('*'),
      supabase.from('pets').select('*').order('created_at'),
      supabase.from('bookings').select('*').order('created_at', { ascending: false }),
      supabase.from('favorites').select('sitter_id'),
    ]);
    const pr: any = check(p);
    setProfile({ id: pr.id, email: session?.user.email ?? '', fullName: pr.full_name, role: pr.role });
    setSitters(check(s).map(toSitter));
    setPets(check(pe).map(toPet));
    setBookings(check(b).map(toBooking));
    setFavorites(check(f).map((r: any) => r.sitter_id));
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setProfile(null); setSitters([]); setPets([]); setBookings([]); setFavorites([]);
      return;
    }
    setDataLoading(true);
    setLoadError(null);
    refresh().catch((e) => setLoadError(e.message)).finally(() => setDataLoading(false));
  }, [userId, refresh]);

  const store: Store = {
    session,
    profile,
    loading: !authReady || dataLoading || (!!userId && !profile && !loadError),
    loadError,
    sitters,
    pets,
    bookings,
    favorites,
    mySitter: sitters.find((s) => s.userId === userId),
    refresh,
    addPet: async (pet) => {
      const row = check(await supabase.from('pets').insert(pet).select().single());
      setPets((list) => [...list, toPet(row)]);
    },
    removePet: async (id) => {
      check(await supabase.from('pets').delete().eq('id', id));
      setPets((list) => list.filter((p) => p.id !== id));
    },
    createBooking: async (b) => {
      const row = check(
        await supabase
          .from('bookings')
          .insert({ sitter_id: b.sitterId, pets: b.pets, service: b.service, start: b.start, nights: b.nights, note: b.note, total: b.total })
          .select()
          .single(),
      );
      setBookings((list) => [toBooking(row), ...list]);
    },
    setBookingStatus: async (id, status) => {
      const row = check(await supabase.from('bookings').update({ status }).eq('id', id).select().single());
      setBookings((list) => list.map((x) => (x.id === id ? toBooking(row) : x)));
    },
    updateMySitter: async (s) => {
      const row = check(
        await supabase
          .from('sitters')
          .update({
            name: s.name, city: s.city, neighborhood: s.neighborhood, price: s.price, available: s.available,
            services: s.services, accepts: s.accepts, bio: s.bio, avatar: s.avatar,
          })
          .eq('id', s.id)
          .select()
          .single(),
      );
      setSitters((list) => list.map((x) => (x.id === s.id ? toSitter(row) : x)));
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
