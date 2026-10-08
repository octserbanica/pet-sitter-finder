import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Chip, SectionTitle } from '../components/ui';
import { money } from '../format';
import { useStore } from '../store';
import { colors, petLabels, serviceLabels, serviceUnit } from '../theme';

export default function SitterProfileScreen({ id, onBook }: { id: string; onBook: () => void }) {
  const { state, dispatch } = useStore();
  const sitter = state.sitters.find((s) => s.id === id);
  if (!sitter) return null;
  const fav = state.favorites.includes(id);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 54 }}>{sitter.avatar}</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 10 }}>{sitter.name}</Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{sitter.neighborhood}, {sitter.city}</Text>
          <Text style={{ color: colors.text, marginTop: 6 }}>
            ⭐ {sitter.rating.toFixed(1)} · {sitter.reviews} reviews · {sitter.years} yrs experience
          </Text>
          {sitter.verified && (
            <Text style={{ color: colors.green, fontWeight: '700', marginTop: 6 }}>✓ ID and background verified</Text>
          )}
        </View>

        <Card><Text style={{ color: colors.text, lineHeight: 21 }}>{sitter.bio}</Text></Card>

        <SectionTitle>Services</SectionTitle>
        {sitter.services.map((x) => (
          <View key={x} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ color: colors.text }}>{serviceLabels[x]}</Text>
            <Text style={{ color: colors.text, fontWeight: '600' }}>{money(x === 'walking' ? Math.round(sitter.price * 0.5) : sitter.price)} / {serviceUnit[x]}</Text>
          </View>
        ))}

        <SectionTitle>Happy to care for</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {sitter.accepts.map((p) => <Chip key={p} label={petLabels[p]} />)}
        </View>

        <SectionTitle>Reviews</SectionTitle>
        {sitter.reviewList.map((r, i) => (
          <Card key={i}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{r.author} · {'⭐'.repeat(r.stars)}</Text>
            <Text style={{ color: colors.text, marginTop: 4 }}>{r.text}</Text>
          </Card>
        ))}
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, flexDirection: 'row', backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
        <Button
          title={fav ? '❤️ Saved' : '🤍 Save'}
          variant="secondary"
          onPress={() => dispatch({ type: 'toggleFavorite', id })}
          style={{ marginRight: 10 }}
        />
        <Button
          title={sitter.available ? 'Request booking' : 'Not available'}
          disabled={!sitter.available}
          onPress={onBook}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}
