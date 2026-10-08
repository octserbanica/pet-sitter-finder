import React from 'react';
import { ScrollView, Text } from 'react-native';
import { Button, Card, SectionTitle } from '../components/ui';
import { useStore } from '../store';
import { colors } from '../theme';

export default function AccountScreen() {
  const { profile, signOut } = useStore();
  if (!profile) return null;
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={{ fontSize: 13, color: colors.muted }}>Signed in as</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 }}>{profile.fullName || profile.email}</Text>
        <Text style={{ color: colors.muted, marginTop: 2 }}>{profile.email}</Text>
        <Text style={{ color: colors.text, marginTop: 8 }}>
          {profile.role === 'owner' ? '🏠 Pet owner account' : '🤝 Pet sitter account'}
        </Text>
      </Card>

      <SectionTitle>Account</SectionTitle>
      <Button title="Sign out" variant="secondary" onPress={signOut} />
      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 14 }}>
        Prototype: payments and messaging are not built yet. The six sitters with reviews are demo listings and accept bookings instantly.
      </Text>
    </ScrollView>
  );
}
