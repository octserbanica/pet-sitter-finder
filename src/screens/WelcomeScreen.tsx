import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useStore } from '../store';
import { colors } from '../theme';

export default function WelcomeScreen() {
  const { dispatch } = useStore();
  return (
    <View style={s.wrap}>
      <Text style={s.logo}>🐾</Text>
      <Text style={s.title}>Pet Sitter Finder</Text>
      <Text style={s.subtitle}>Trusted people to care for your pets while you are away.</Text>

      <Pressable style={s.option} onPress={() => dispatch({ type: 'setRole', role: 'owner' })}>
        <Text style={s.optionEmoji}>🏠</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.optionTitle}>I need a pet sitter</Text>
          <Text style={s.optionText}>Find and book verified sitters near you</Text>
        </View>
      </Pressable>

      <Pressable style={s.option} onPress={() => dispatch({ type: 'setRole', role: 'sitter' })}>
        <Text style={s.optionEmoji}>🤝</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.optionTitle}>I want to pet sit</Text>
          <Text style={s.optionText}>Manage requests and your sitter profile</Text>
        </View>
      </Pressable>

      <Text style={s.note}>Prototype with sample data. Everything is saved only on this device.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 64, textAlign: 'center' },
  title: { fontSize: 30, fontWeight: '800', textAlign: 'center', color: colors.text, marginTop: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', color: colors.muted, marginTop: 8, marginBottom: 32 },
  option: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 18,
    padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.border,
  },
  optionEmoji: { fontSize: 34, marginRight: 16 },
  optionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  optionText: { fontSize: 14, color: colors.muted, marginTop: 2 },
  note: { textAlign: 'center', color: colors.muted, fontSize: 12, marginTop: 20 },
});
