import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import BookingCard from '../components/BookingCard';
import { Button, Card, Empty, SectionTitle } from '../components/ui';
import { money } from '../format';
import { useStore } from '../store';
import { colors } from '../theme';
import { BookingStatus } from '../types';

export default function SitterRequestsScreen() {
  const { bookings, mySitter, setBookingStatus } = useStore();
  const [error, setError] = useState<string | null>(null);
  const mine = bookings.filter((b) => b.sitterId === mySitter?.id);
  const pending = mine.filter((b) => b.status === 'pending');
  const upcoming = mine.filter((b) => b.status === 'accepted').sort((a, b) => a.start.localeCompare(b.start));
  const earnings = upcoming.reduce((sum, b) => sum + b.total, 0);
  const answer = (id: string, status: BookingStatus) =>
    setBookingStatus(id, status).then(() => setError(null), (e) => setError(e.message));

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {mySitter && !mySitter.available && (
        <Card style={{ backgroundColor: colors.amberSoft, borderColor: colors.amberSoft }}>
          <Text style={{ color: colors.amber, fontWeight: '700' }}>Your listing is hidden from owners.</Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>Fill in your city and services in My profile, then set yourself to “Taking bookings”.</Text>
        </Card>
      )}
      <View style={{ flexDirection: 'row' }}>
        <Card style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>New requests</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.primary }}>{pending.length}</Text>
        </Card>
        <Card style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Confirmed earnings</Text>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.green }}>{money(earnings)}</Text>
        </Card>
      </View>
      {error && <Text style={{ color: colors.red, marginBottom: 8 }}>{error}</Text>}

      <SectionTitle>Waiting for your answer</SectionTitle>
      {pending.length === 0 && <Empty emoji="📭" text="No new requests right now." />}
      {pending.map((b) => (
        <BookingCard key={b.id} booking={b} title={b.ownerName} avatar="🙋">
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Button title="Decline" variant="secondary" onPress={() => answer(b.id, 'declined')} style={{ marginRight: 10 }} />
            <Button title="Accept" onPress={() => answer(b.id, 'accepted')} style={{ flex: 1 }} />
          </View>
        </BookingCard>
      ))}

      <SectionTitle>Upcoming stays</SectionTitle>
      {upcoming.length === 0 && <Empty emoji="🗓️" text="Accepted bookings will show here." />}
      {upcoming.map((b) => <BookingCard key={b.id} booking={b} title={b.ownerName} avatar="🙋" />)}
    </ScrollView>
  );
}
