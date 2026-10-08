export type PetType = 'dog' | 'cat' | 'bird' | 'small';
export type PetSize = 'small' | 'medium' | 'large' | 'giant';
export type Service = 'boarding' | 'house' | 'dropin' | 'walking';
export type Mode = 'owner' | 'sitter';
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface Sitter {
  id: string;
  userId: string | null; // null for demo sitters without an account
  name: string;
  avatar: string; // emoji fallback when there is no photo
  photoUrl: string | null;
  city: string;
  neighborhood: string;
  rating: number;
  reviews: number;
  prices: Partial<Record<Service, number>>;
  extraPetPercent: number;
  price: number; // lowest price, for sorting
  years: number;
  verified: boolean;
  available: boolean;
  services: Service[];
  accepts: PetType[];
  bio: string;
  reviewList: { author: string; text: string; stars: number }[];
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  type: PetType;
  breed: string;
  age: number;
  size: PetSize | null;
  temperament: string[];
  notes: string;
  photoUrl: string | null;
}

export interface Booking {
  id: string;
  ownerId: string;
  sitterId: string;
  ownerName: string;
  pets: { name: string; type: PetType }[];
  petIds: string[];
  service: Service;
  start: string; // YYYY-MM-DD
  nights: number;
  note: string;
  total: number;
  status: BookingStatus;
  createdAt: number;
  paidAt: number | null;
  checkoutStarted: boolean; // a Stripe checkout was opened; may still need confirming
}

export interface Profile {
  id: string;
  fullName: string;
  age: number | null;
  about: string;
  avatarUrl: string | null;
}

export interface Message {
  id: string;
  ownerId: string;
  sitterId: string;
  senderId: string;
  body: string;
  createdAt: number;
}
