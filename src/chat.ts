import { Message, Profile, Sitter } from './types';

export interface Conversation {
  key: string;
  ownerId: string;
  sitterId: string;
  name: string;
  photoUrl: string | null;
  fallback: string;
  last: Message | undefined;
  iAmOwner: boolean;
}

export const conversationKey = (ownerId: string, sitterId: string) => `${ownerId}|${sitterId}`;

// Who the other person in a conversation is, from my point of view.
export function describe(
  ownerId: string, sitterId: string, me: string, sitters: Sitter[], people: Record<string, Profile>,
): Omit<Conversation, 'key' | 'last'> {
  const iAmOwner = ownerId === me;
  if (iAmOwner) {
    const s = sitters.find((x) => x.id === sitterId);
    return { ownerId, sitterId, iAmOwner, name: s?.name ?? 'Sitter', photoUrl: s?.photoUrl ?? null, fallback: s?.avatar ?? '🙂' };
  }
  const p = people[ownerId];
  const name = p?.fullName || 'Pet owner';
  return { ownerId, sitterId, iAmOwner, name, photoUrl: p?.avatarUrl ?? null, fallback: name[0]?.toUpperCase() ?? '🙂' };
}

export function conversations(messages: Message[], me: string, sitters: Sitter[], people: Record<string, Profile>): Conversation[] {
  const last = new Map<string, Message>();
  for (const m of messages) last.set(conversationKey(m.ownerId, m.sitterId), m); // messages are oldest first
  return [...last.entries()]
    .map(([key, m]) => ({ key, last: m, ...describe(m.ownerId, m.sitterId, me, sitters, people) }))
    .sort((a, b) => (b.last?.createdAt ?? 0) - (a.last?.createdAt ?? 0));
}
