import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Avatar, Empty } from '../components/ui';
import { conversations } from '../chat';
import { useStore } from '../store';
import { colors } from '../theme';

const time = (ms: number) => {
  const d = new Date(ms);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export default function MessagesScreen({ openChat }: { openChat: (ownerId: string, sitterId: string) => void }) {
  const { messages, session, sitters, people } = useStore();
  const me = session!.user.id;
  const list = conversations(messages, me, sitters, people);

  return (
    <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
      {list.length === 0 && (
        <Empty emoji="💬" text="No conversations yet. Message a sitter from their page, or an owner from a booking request." />
      )}
      {list.map((c) => (
        <Pressable
          key={c.key}
          onPress={() => openChat(c.ownerId, c.sitterId)}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: pressed ? colors.primarySoft : 'transparent',
          })}
        >
          <Avatar url={c.photoUrl} fallback={c.fallback} size={50} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700', color: colors.text, fontSize: 16 }} numberOfLines={1}>{c.name}</Text>
              {c.last && <Text style={{ color: colors.muted, fontSize: 12 }}>{time(c.last.createdAt)}</Text>}
            </View>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{c.iAmOwner ? 'Sitter' : 'Pet owner'}</Text>
            {c.last && (
              <Text style={{ color: colors.text, marginTop: 2 }} numberOfLines={1}>
                {c.last.senderId === me ? 'You: ' : ''}{c.last.body}
              </Text>
            )}
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}
