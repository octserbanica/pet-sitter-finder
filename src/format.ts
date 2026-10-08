import { Service } from './types';
import { serviceUnit } from './theme';

export const money = (n: number) => `${n} RON`;

export const addDays = (iso: string, days: number) => {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const todayPlus = (days: number) => {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const fmtDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export const fmtRange = (start: string, nights: number) => `${fmtDate(start)} → ${fmtDate(addDays(start, nights))}`;

export const unitCount = (service: Service, n: number) => `${n} ${serviceUnit[service]}${n === 1 ? '' : 's'}`;
