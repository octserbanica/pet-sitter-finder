import { Service, Sitter } from './types';

// Same rule as the database (before_booking_insert): the sitter's price for the service,
// plus their extra-pet surcharge for every pet after the first.
export function quote(sitter: Sitter, service: Service, units: number, petCount: number) {
  const base = sitter.prices[service] ?? 0;
  const perUnit = Math.round(base * (1 + (sitter.extraPetPercent / 100) * Math.max(0, petCount - 1)));
  return { perUnit, total: perUnit * units };
}
