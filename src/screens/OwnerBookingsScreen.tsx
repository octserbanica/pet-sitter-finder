import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import BookingCard from '../components/BookingCard';
import { Button, Empty, SectionTitle } from '../components/ui';
import { money } from '../format';
import { useStore } from '../store';
import { colors } from '../theme';

export default function OwnerBookingsScreen({ justBooked, paidId, openChat }: {
  justBooked: boolean; paidId: string | null; openChat: (ownerId: string, sitterId: string) => void;
}) {
  const { bookings, sitters, session, setBookingStatus, payBooking } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const returned = paidId ? bookings.find((b) => b.id === paidId) : undefined;
  const pay = (id: string) => {
    setPaying(id);
    setError(null);
    payBooking(id).catch((e) => setError(e.message)).finally(() => setPaying(null));
  };
  const mine = bookings.filter((b) => b.ownerId === session?.user.id);
  const active = mine.filter((b) => b.status === 'pending' || b.status === 'accepted');
  const past = mine.filter((b) => b.status === 'declined' || b.status === 'cancelled');

  const render = (list: typeof mine) =>
    list.map((b) => {
      const sitter = sitters.find((s) => s.id === b.sitterId);
      return (
        <BookingCard key={b.id} booking={b} title={sitter?.name ?? 'Sitter'} photoUrl={sitter?.photoUrl} fallback={sitter?.avatar ?? '🙂'}>
          {b.status === 'accepted' && !b.paidAt && (
            <Button title={paying === b.id ? 'Opening payment…' : `Pay ${money(b.total)}`} disabled={!!paying} onPress={() => pay(b.id)} style={{ marginTop: 10 }} />
          )}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
            {!!sitter?.userId && (
              <Button title="Message" variant="secondary" onPress={() => openChat(b.ownerId, b.sitterId)} />
            )}
            {(b.status === 'pending' || b.status === 'accepted') && !b.paidAt && (
              <Button title="Cancel booking" variant="danger" onPress={() => setBookingStatus(b.id, 'cancelled').then(() => setError(null), (e) => setError(e.message))} />
            )}
          </View>
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
      {returned && (
        <View style={{ backgroundColor: returned.paidAt ? colors.greenSoft : colors.amberSoft, padding: 14, borderRadius: 12, marginBottom: 8 }}>
          <Text style={{ color: returned.paidAt ? colors.green : colors.amber, fontWeight: '700' }}>
            {returned.paidAt ? '✓ Payment received. Thank you!' : 'Checking your payment with Stripe…'}
          </Text>
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
