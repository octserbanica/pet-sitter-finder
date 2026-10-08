import { PetType, Service } from './types';

export const colors = {
  bg: '#F7F5F2',
  card: '#FFFFFF',
  text: '#1F2328',
  muted: '#6B7078',
  border: '#E6E1DA',
  primary: '#E8724A',
  primarySoft: '#FCE9E1',
  green: '#2E8B57',
  greenSoft: '#E2F3E9',
  amber: '#B7791F',
  amberSoft: '#FDF1D8',
  red: '#C0392B',
  redSoft: '#F9E1DE',
};

export const petLabels: Record<PetType, string> = {
  dog: '🐶 Dogs',
  cat: '🐱 Cats',
  bird: '🐦 Birds',
  small: '🐹 Small pets',
};

export const petEmoji: Record<PetType, string> = { dog: '🐶', cat: '🐱', bird: '🐦', small: '🐹' };

export const serviceLabels: Record<Service, string> = {
  boarding: 'Boarding at sitter',
  house: 'House sitting',
  dropin: 'Drop-in visits',
  walking: 'Dog walking',
};

export const serviceUnit: Record<Service, string> = {
  boarding: 'night',
  house: 'night',
  dropin: 'visit',
  walking: 'walk',
};
