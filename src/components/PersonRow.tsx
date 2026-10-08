import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStore } from '../store';
import { colors } from '../theme';
import { Avatar, initials } from './ui';

// One person in a list (followers, following). Tapping opens their page.
export default function PersonRow({ userId, onPress }: { userId: string; onPress: () => void }) {
  const { people, sitters } = useStore();
  const p = people[userId];
  const name = p?.fullName || 'Pet Sitter Finder user';
  const isSitter = sitters.some((s) => s.userId === userId);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, opacity: pressed ? 0.6 : 1 })}
    >
      <Avatar url={p?.avatarUrl} fallback={initials(name)} size={40} />
      <View style={{ marginLeft: 10, flex: 1 }}>
        <Text style={{ fontWeight: '700', color: colors.text }} numberOfLines={1}>{name}</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>{isSitter ? 'Pet sitter' : 'Pet owner'}</Text>
      </View>
      <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
    </Pressable>
  );
}
