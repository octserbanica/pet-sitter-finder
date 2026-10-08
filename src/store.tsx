import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useReducer } from 'react';
import { initialBookings, initialPets, sitters as initialSitters } from './data';
import { Booking, BookingStatus, Pet, Role, Sitter } from './types';

interface State {
  role: Role | null;
  ownerName: string;
  pets: Pet[];
  bookings: Booking[];
  sitters: Sitter[];
  favorites: string[];
}

type Action =
  | { type: 'hydrate'; state: State }
  | { type: 'setRole'; role: Role | null }
  | { type: 'addPet'; pet: Pet }
  | { type: 'removePet'; id: string }
  | { type: 'addBooking'; booking: Booking }
  | { type: 'setBookingStatus'; id: string; status: BookingStatus }
  | { type: 'updateSitter'; sitter: Sitter }
  | { type: 'toggleFavorite'; id: string }
  | { type: 'reset' };

const initialState: State = {
  role: null,
  ownerName: 'Octavian',
  pets: initialPets,
  bookings: initialBookings,
  sitters: initialSitters,
  favorites: [],
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      return action.state;
    case 'setRole':
      return { ...state, role: action.role };
    case 'addPet':
      return { ...state, pets: [...state.pets, action.pet] };
    case 'removePet':
      return { ...state, pets: state.pets.filter((p) => p.id !== action.id) };
    case 'addBooking':
      return { ...state, bookings: [action.booking, ...state.bookings] };
    case 'setBookingStatus':
      return {
        ...state,
        bookings: state.bookings.map((b) => (b.id === action.id ? { ...b, status: action.status } : b)),
      };
    case 'updateSitter':
      return { ...state, sitters: state.sitters.map((s) => (s.id === action.sitter.id ? action.sitter : s)) };
    case 'toggleFavorite':
      return {
        ...state,
        favorites: state.favorites.includes(action.id)
          ? state.favorites.filter((f) => f !== action.id)
          : [...state.favorites, action.id],
      };
    case 'reset':
      return initialState;
  }
}

const STORAGE_KEY = 'pet-sitter-finder/v1';

const StoreContext = createContext<{ state: State; dispatch: React.Dispatch<Action>; ready: boolean } | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [ready, setReady] = React.useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', state: { ...initialState, ...JSON.parse(raw) } });
      })
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  return <StoreContext.Provider value={{ state, dispatch, ready }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

export const newId = () => Math.random().toString(36).slice(2, 10);
