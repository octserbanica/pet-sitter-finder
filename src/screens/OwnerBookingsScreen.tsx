import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import BookingCard from '../components/BookingCard';
import { Button, Empty, SectionTitle } from '../components/ui';
import { ME_SITTER_ID } from '../data';
import { useStore } from '../store';
import { colors } from '../theme';

export default function OwnerBookingsScreen({ justBooked }: { justBooked: boolean }) {
  const { state, dispatch } = useStore();
  const mine = state.bookings.filter((b) => b.ownerName === state.ownerName);
  const active = mine.filter((b) => b.status === 'pending' || b.status === 'accepted');
  const past = mine.filter((b) => b.status === 'declined' || b.status === 'cancelled');

  const render = (list: typeof mine) =>
    list.map((b) => {
      const sitter = state.sitters.find((s) => s.id === b.sitterId);
      return (
        <BookingCard key={b.id} booking={b} title={sitter?.name ?? 'Sitter'} avatar={sitter?.avatar ?? '🙂'}>
          {b.status === 'pending' && b.sitterId === ME_SITTER_ID && (
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
              Demo tip: switch to sitter mode in Account to answer this request as {sitter?.name.split(' ')[0]}.
            </Text>
          )}
          {(b.status === 'pending' || b.status === 'accepted') && (
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <Button title="Cancel booking" variant="danger" onPress={() => dispatch({ type: 'setBookingStatus', id: b.id, status: 'cancelled' })} />
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
      <SectionTitle>Upcoming</SectionTitle>
      {active.length ? render(active) : <Empty emoji="🗓️" text="No bookings yet. Find a sitter to get started." />}
      {past.length > 0 && <SectionTitle>Past and cancelled</SectionTitle>}
      {render(past)}
    </ScrollView>
  );
}
