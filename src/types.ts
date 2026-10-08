export type PetType = 'dog' | 'cat' | 'bird' | 'small';
export type Service = 'boarding' | 'house' | 'dropin' | 'walking';
export type Role = 'owner' | 'sitter';
export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface Sitter {
  id: string;
  userId: string | null; // null for demo sitters without an account
  name: string;
  avatar: string;
  city: string;
  neighborhood: string;
  rating: number;
  reviews: number;
  price: number; // per night / per visit
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
  name: string;
  type: PetType;
  breed: string;
  age: number;
  notes: string;
}

export interface Booking {
  id: string;
  ownerId: string;
  sitterId: string;
  ownerName: string;
  pets: { name: string; type: PetType }[];
  service: Service;
  start: string; // YYYY-MM-DD
  nights: number;
  note: string;
  total: number;
  status: BookingStatus;
  createdAt: number;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}
