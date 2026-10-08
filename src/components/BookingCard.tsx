import React from 'react';
import { Text, View } from 'react-native';
import { fmtRange, fmtDate, money, unitCount } from '../format';
import { colors, petEmoji, serviceLabels } from '../theme';
import { Booking } from '../types';
import { Card, StatusBadge } from './ui';

export default function BookingCard({ booking, title, avatar, children }: {
  booking: Booking; title: string; avatar: string; children?: React.ReactNode;
}) {
  const isNights = booking.service === 'boarding' || booking.service === 'house';
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Text style={{ fontSize: 28, marginRight: 10 }}>{avatar}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{title}</Text>
          <Text style={{ color: colors.muted, fontSize: 13 }}>{serviceLabels[booking.service]}</Text>
        </View>
        <StatusBadge status={booking.status} />
      </View>
      <Text style={{ color: colors.text }}>
        📅 {isNights ? fmtRange(booking.start, booking.nights) : `From ${fmtDate(booking.start)} · ${unitCount(booking.service, booking.nights)}`}
      </Text>
      <Text style={{ color: colors.text, marginTop: 4 }}>
        {booking.pets.map((p) => `${petEmoji[p.type]} ${p.name}`).join('   ')}
      </Text>
      {!!booking.note && <Text style={{ color: colors.muted, marginTop: 6, fontStyle: 'italic' }}>“{booking.note}”</Text>}
      <Text style={{ color: colors.text, fontWeight: '700', marginTop: 8 }}>{money(booking.total)}</Text>
      {children}
    </Card>
  );
}
