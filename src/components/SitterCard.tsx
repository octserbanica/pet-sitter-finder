import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, petEmoji, serviceLabels } from '../theme';
import { Sitter } from '../types';
import { money } from '../format';

export default function SitterCard({ sitter, favorite, onPress }: { sitter: Sitter; favorite: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [s.card, pressed && { opacity: 0.85 }]}>
      <View style={s.avatar}><Text style={{ fontSize: 30 }}>{sitter.avatar}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={s.row}>
          <Text style={s.name} numberOfLines={1}>{sitter.name}</Text>
          {sitter.verified && <Text style={s.verified}>✓ Verified</Text>}
          {favorite && <Text style={{ marginLeft: 6 }}>❤️</Text>}
        </View>
        <Text style={s.meta}>{sitter.neighborhood}, {sitter.city}</Text>
        <Text style={s.meta}>
          ⭐ {sitter.rating.toFixed(1)} ({sitter.reviews}) · {sitter.accepts.map((p) => petEmoji[p]).join(' ')}
        </Text>
        <Text style={s.services} numberOfLines={1}>{sitter.services.map((x) => serviceLabels[x]).join(' · ')}</Text>
        {!sitter.available && <Text style={s.unavailable}>Not taking bookings right now</Text>}
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.price}>{money(sitter.price)}</Text>
        <Text style={s.meta}>from</Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', backgroundColor: colors.card, borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text, marginRight: 6 },
  verified: { fontSize: 11, color: colors.green, fontWeight: '700', backgroundColor: colors.greenSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  meta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  services: { fontSize: 12, color: colors.text, marginTop: 6 },
  unavailable: { fontSize: 12, color: colors.red, marginTop: 4 },
  price: { fontSize: 15, fontWeight: '700', color: colors.primary },
});
