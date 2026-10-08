import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import BookingCard from '../components/BookingCard';
import { Button, Card, Empty, SectionTitle } from '../components/ui';
import { ME_SITTER_ID } from '../data';
import { money } from '../format';
import { useStore } from '../store';
import { colors } from '../theme';

export default function SitterRequestsScreen() {
  const { state, dispatch } = useStore();
  const mine = state.bookings.filter((b) => b.sitterId === ME_SITTER_ID);
  const pending = mine.filter((b) => b.status === 'pending');
  const upcoming = mine.filter((b) => b.status === 'accepted').sort((a, b) => a.start.localeCompare(b.start));
  const earnings = upcoming.reduce((sum, b) => sum + b.total, 0);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
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

      <SectionTitle>Waiting for your answer</SectionTitle>
      {pending.length === 0 && <Empty emoji="📭" text="No new requests right now." />}
      {pending.map((b) => (
        <BookingCard key={b.id} booking={b} title={b.ownerName} avatar="🙋">
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Button title="Decline" variant="secondary" onPress={() => dispatch({ type: 'setBookingStatus', id: b.id, status: 'declined' })} style={{ marginRight: 10 }} />
            <Button title="Accept" onPress={() => dispatch({ type: 'setBookingStatus', id: b.id, status: 'accepted' })} style={{ flex: 1 }} />
          </View>
        </BookingCard>
      ))}

      <SectionTitle>Upcoming stays</SectionTitle>
      {upcoming.length === 0 && <Empty emoji="🗓️" text="Accepted bookings will show here." />}
      {upcoming.map((b) => <BookingCard key={b.id} booking={b} title={b.ownerName} avatar="🙋" />)}
    </ScrollView>
  );
}
