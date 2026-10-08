import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import FollowButton from '../components/FollowButton';
import { Avatar, Button, Card, Chip, SectionTitle } from '../components/ui';
import { money } from '../format';
import { useStore } from '../store';
import { colors, petLabels, serviceLabels, serviceUnit } from '../theme';
import { Service } from '../types';

export default function SitterProfileScreen({ id, onBook, onMessage, openPerson }: {
  id: string; onBook: () => void; onMessage: () => void; openPerson: (userId: string) => void;
}) {
  const { sitters, favorites, toggleFavorite, people, loadPeople, session } = useStore();
  const [error, setError] = useState<string | null>(null);
  const sitter = sitters.find((s) => s.id === id);

  useEffect(() => {
    if (sitter?.userId) loadPeople([sitter.userId]).catch(() => {});
  }, [sitter?.userId]);

  if (!sitter) return null;
  const fav = favorites.includes(id);
  const person = sitter.userId ? people[sitter.userId] : undefined;
  const isMe = !!sitter.userId && sitter.userId === session?.user.id;
  const services = Object.keys(sitter.prices) as Service[];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Avatar url={sitter.photoUrl} fallback={sitter.avatar} size={104} />
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 10 }}>
            {sitter.name}{person?.age ? `, ${person.age}` : ''}
          </Text>
          <Text style={{ color: colors.muted, marginTop: 4 }}>{[sitter.neighborhood, sitter.city].filter(Boolean).join(', ')}</Text>
          <Text style={{ color: colors.text, marginTop: 6 }}>
            {sitter.reviews ? `⭐ ${sitter.rating.toFixed(1)} · ${sitter.reviews} reviews · ` : 'New sitter · '}
            {sitter.years} yrs experience
          </Text>
          {sitter.verified && (
            <Text style={{ color: colors.green, fontWeight: '700', marginTop: 6 }}>✓ ID and background verified</Text>
          )}
          {!!sitter.userId && !isMe && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <FollowButton userId={sitter.userId} />
              <Button title="View profile" variant="secondary" onPress={() => openPerson(sitter.userId!)} />
            </View>
          )}
        </View>

        {!!person?.about && (
          <>
            <SectionTitle>About me</SectionTitle>
            <Card><Text style={{ color: colors.text, lineHeight: 21 }}>{person.about}</Text></Card>
          </>
        )}
        {!!sitter.bio && (
          <>
            <SectionTitle>Pet sitting</SectionTitle>
            <Card><Text style={{ color: colors.text, lineHeight: 21 }}>{sitter.bio}</Text></Card>
          </>
        )}

        <SectionTitle>Services and prices</SectionTitle>
        <Card style={{ paddingVertical: 4 }}>
          {services.map((x, i) => (
            <View key={x} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: colors.border }}>
              <Text style={{ color: colors.text }}>{serviceLabels[x]}</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{money(sitter.prices[x]!)} / {serviceUnit[x]}</Text>
            </View>
          ))}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
            <Text style={{ color: colors.muted }}>Each additional pet</Text>
            <Text style={{ color: colors.muted, fontWeight: '600' }}>+{sitter.extraPetPercent}%</Text>
          </View>
        </Card>

        <SectionTitle>Happy to care for</SectionTitle>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {sitter.accepts.map((p) => <Chip key={p} label={petLabels[p]} />)}
        </View>

        {sitter.reviewList.length > 0 && <SectionTitle>Reviews</SectionTitle>}
        {sitter.reviewList.map((r, i) => (
          <Card key={i}>
            <Text style={{ fontWeight: '700', color: colors.text }}>{r.author} · {'⭐'.repeat(r.stars)}</Text>
            <Text style={{ color: colors.text, marginTop: 4 }}>{r.text}</Text>
          </Card>
        ))}
        {!sitter.userId && (
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
            Demo sitter: bookings are accepted instantly and messaging is not available.
          </Text>
        )}
      </ScrollView>

      {error && <Text style={{ position: 'absolute', bottom: 76, left: 12, right: 12, color: colors.red }}>{error}</Text>}
      {!isMe && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 12, flexDirection: 'row', backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.border }}>
          <Button
            title={fav ? '❤️' : '🤍'}
            variant="secondary"
            onPress={() => toggleFavorite(id).then(() => setError(null), (e) => setError(e.message))}
            style={{ marginRight: 8 }}
          />
          {!!sitter.userId && <Button title="Message" variant="secondary" onPress={onMessage} style={{ marginRight: 8 }} />}
          <Button
            title={sitter.available ? 'Request booking' : 'Not available'}
            disabled={!sitter.available}
            onPress={onBook}
            style={{ flex: 1 }}
          />
        </View>
      )}
    </View>
  );
}
