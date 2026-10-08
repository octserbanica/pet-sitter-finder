import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import BookingCard from '../components/BookingCard';
import PetCard from '../components/PetCard';
import { Button, Card, Empty, ErrorText, SectionTitle, initials } from '../components/ui';
import { money } from '../format';
import { useStore } from '../store';
import { colors } from '../theme';
import { Booking, BookingStatus } from '../types';

export default function SitterRequestsScreen({ openChat, openPerson }: {
  openChat: (ownerId: string, sitterId: string) => void; openPerson: (userId: string) => void;
}) {
  const { bookings, mySitter, bookedPets, people, setBookingStatus } = useStore();
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const mine = bookings.filter((b) => b.sitterId === mySitter?.id);
  const pending = mine.filter((b) => b.status === 'pending');
  const upcoming = mine.filter((b) => b.status === 'accepted').sort((a, b) => a.start.localeCompare(b.start));
  const earnings = upcoming.reduce((sum, b) => sum + b.total, 0);
  const answer = (id: string, status: BookingStatus) =>
    setBookingStatus(id, status).then(() => setError(null), (e) => setError(e.message));

  const card = (b: Booking, actions?: React.ReactNode) => {
    const owner = people[b.ownerId];
    const name = owner?.fullName || b.ownerName || 'Pet owner';
    const pets = bookedPets.filter((p) => b.petIds.includes(p.id));
    return (
      <BookingCard key={b.id} booking={b} title={owner?.age ? `${name}, ${owner.age}` : name} photoUrl={owner?.avatarUrl} fallback={initials(name)}>
        {!!owner?.about && <Text style={{ color: colors.muted, marginTop: 6 }} numberOfLines={expanded === b.id ? undefined : 2}>{owner.about}</Text>}
        {expanded === b.id && pets.map((p) => <PetCard key={p.id} pet={p} />)}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 }}>
          {pets.length > 0 && (
            <Button title={expanded === b.id ? 'Hide pets' : 'See pets'} variant="secondary" onPress={() => setExpanded(expanded === b.id ? null : b.id)} />
          )}
          <Button title="Message" variant="secondary" onPress={() => openChat(b.ownerId, b.sitterId)} />
          <Button title="Profile" variant="secondary" onPress={() => openPerson(b.ownerId)} />
        </View>
        {actions}
      </BookingCard>
    );
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {mySitter && !mySitter.available && (
        <Card style={{ backgroundColor: colors.amberSoft, borderColor: colors.amberSoft }}>
          <Text style={{ color: colors.amber, fontWeight: '700' }}>Your listing is hidden from owners.</Text>
          <Text style={{ color: colors.text, marginTop: 4 }}>Set your services, prices and city in My services, then choose “Taking bookings”.</Text>
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
      <ErrorText>{error}</ErrorText>

      <SectionTitle>Waiting for your answer</SectionTitle>
      {pending.length === 0 && <Empty emoji="📭" text="No new requests right now." />}
      {pending.map((b) =>
        card(
          b,
          <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <Button title="Decline" variant="secondary" onPress={() => answer(b.id, 'declined')} style={{ marginRight: 10 }} />
            <Button title="Accept" onPress={() => answer(b.id, 'accepted')} style={{ flex: 1 }} />
          </View>,
        ),
      )}

      <SectionTitle>Upcoming stays</SectionTitle>
      {upcoming.length === 0 && <Empty emoji="🗓️" text="Accepted bookings will show here." />}
      {upcoming.map((b) => card(b))}
    </ScrollView>
  );
}
