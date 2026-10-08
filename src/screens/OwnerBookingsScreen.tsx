import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import BookingCard from '../components/BookingCard';
import { Button, Empty, SectionTitle } from '../components/ui';
import { useStore } from '../store';
import { colors } from '../theme';

export default function OwnerBookingsScreen({ justBooked }: { justBooked: boolean }) {
  const { bookings, sitters, session, setBookingStatus } = useStore();
  const [error, setError] = useState<string | null>(null);
  const mine = bookings.filter((b) => b.ownerId === session?.user.id);
  const active = mine.filter((b) => b.status === 'pending' || b.status === 'accepted');
  const past = mine.filter((b) => b.status === 'declined' || b.status === 'cancelled');

  const render = (list: typeof mine) =>
    list.map((b) => {
      const sitter = sitters.find((s) => s.id === b.sitterId);
      return (
        <BookingCard key={b.id} booking={b} title={sitter?.name ?? 'Sitter'} avatar={sitter?.avatar ?? '🙂'}>
          {(b.status === 'pending' || b.status === 'accepted') && (
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <Button title="Cancel booking" variant="danger" onPress={() => setBookingStatus(b.id, 'cancelled').then(() => setError(null), (e) => setError(e.message))} />
            </View>
          )}
        </BookingCard>
      );
    });

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      {justBooked && (
        <View style={{ backgroundColor: colors.greenSoft, padding: 14, borderRadius: 12, marginBottom: 8 }}>
          <Text style={{ color: colors.green, fontWeight: '700' }}>✓ Request sent. The sitter will reply soon.</Text>
        </View>
      )}
      {error && <Text style={{ color: colors.red, marginBottom: 8 }}>{error}</Text>}
      <SectionTitle>Upcoming</SectionTitle>
      {active.length ? render(active) : <Empty emoji="🗓️" text="No bookings yet. Find a sitter to get started." />}
      {past.length > 0 && <SectionTitle>Past and cancelled</SectionTitle>}
      {render(past)}
    </ScrollView>
  );
}
