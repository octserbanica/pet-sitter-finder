import React from 'react';
import { ScrollView, Text } from 'react-native';
import { Button, Card, SectionTitle } from '../components/ui';
import { ME_SITTER_ID } from '../data';
import { useStore } from '../store';
import { colors } from '../theme';

export default function AccountScreen() {
  const { state, dispatch } = useStore();
  const me = state.sitters.find((s) => s.id === ME_SITTER_ID)!;
  const isOwner = state.role === 'owner';
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Card>
        <Text style={{ fontSize: 13, color: colors.muted }}>Signed in as</Text>
        <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 4 }}>
          {isOwner ? `${state.ownerName} (pet owner)` : `${me.name} (sitter)`}
        </Text>
      </Card>

      <SectionTitle>Demo</SectionTitle>
      <Button
        title={isOwner ? 'Switch to sitter mode' : 'Switch to pet owner mode'}
        variant="secondary"
        onPress={() => dispatch({ type: 'setRole', role: isOwner ? 'sitter' : 'owner' })}
        style={{ marginBottom: 10 }}
      />
      <Button title="Back to welcome screen" variant="secondary" onPress={() => dispatch({ type: 'setRole', role: null })} style={{ marginBottom: 10 }} />
      <Button title="Reset sample data" variant="danger" onPress={() => dispatch({ type: 'reset' })} />
      <Text style={{ color: colors.muted, fontSize: 12, marginTop: 14 }}>
        This prototype has no server yet. Accounts, payments and messaging are simulated, and data is stored only on this device.
      </Text>
    </ScrollView>
  );
}
