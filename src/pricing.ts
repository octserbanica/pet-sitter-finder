import { Service, Sitter } from './types';

// Walks are priced at half the base rate; each extra pet adds 30%.
export function quote(sitter: Sitter, service: Service, units: number, petCount: number) {
  const base = service === 'walking' ? Math.round(sitter.price * 0.5) : sitter.price;
  const perUnit = Math.round(base * (1 + 0.3 * Math.max(0, petCount - 1)));
  return { perUnit, total: perUnit * units };
}
