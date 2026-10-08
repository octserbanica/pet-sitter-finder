import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Chip, Field, SectionTitle, Stepper } from '../components/ui';
import { money } from '../format';
import { useStore } from '../store';
import { colors, petLabels, serviceLabels } from '../theme';
import { PetType, Service } from '../types';

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

export default function SitterEditScreen() {
  const { mySitter, updateMySitter } = useStore();
  const [draft, setDraft] = useState(mySitter);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!draft) return null;
  const set = (patch: Partial<typeof draft>) => { setDraft({ ...draft, ...patch }); setSaved(false); };
  const save = async () => {
    setBusy(true); setError(null);
    try {
      await updateMySitter(draft);
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const ready = draft.services.length > 0 && draft.accepts.length > 0 && draft.name.trim() && draft.city.trim();

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ fontSize: 40, marginRight: 12 }}>{draft.avatar}</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{draft.name}</Text>
            <Text style={{ color: colors.muted }}>{draft.reviews ? `⭐ ${draft.rating} · ${draft.reviews} reviews` : 'No reviews yet'}</Text>
          </View>
        </View>
      </Card>

      <SectionTitle>Where you are</SectionTitle>
      <Field label="Name shown to owners" value={draft.name} onChangeText={(name) => set({ name })} />
      <Field label="City" value={draft.city} onChangeText={(city) => set({ city })} placeholder="e.g. Bucharest" />
      <Field label="Neighbourhood" value={draft.neighborhood} onChangeText={(neighborhood) => set({ neighborhood })} placeholder="e.g. Floreasca" />

      <SectionTitle>Availability</SectionTitle>
      <View style={{ flexDirection: 'row' }}>
        <Chip label="Taking bookings" selected={draft.available} onPress={() => set({ available: true })} />
        <Chip label="Paused" selected={!draft.available} onPress={() => set({ available: false })} />
      </View>

      <SectionTitle>Base price</SectionTitle>
      <Stepper value={draft.price} min={20} max={500} onChange={(price) => set({ price })} format={(v) => `${money(v)} / night`} />
      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        {[-10, +10].map((d) => (
          <Chip key={d} label={`${d > 0 ? '+' : ''}${d}`} onPress={() => set({ price: Math.max(20, draft.price + d) })} />
        ))}
      </View>

      <SectionTitle>Services I offer</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {(Object.keys(serviceLabels) as Service[]).map((x) => (
          <Chip key={x} label={serviceLabels[x]} selected={draft.services.includes(x)} onPress={() => set({ services: toggle(draft.services, x) })} />
        ))}
      </View>

      <SectionTitle>Pets I care for</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {(Object.keys(petLabels) as PetType[]).map((p) => (
          <Chip key={p} label={petLabels[p]} selected={draft.accepts.includes(p)} onPress={() => set({ accepts: toggle(draft.accepts, p) })} />
        ))}
      </View>

      <SectionTitle>About me</SectionTitle>
      <Field label="Shown on your public profile" value={draft.bio} onChangeText={(bio) => set({ bio })} multiline />

      {error && <Text style={{ color: colors.red, marginBottom: 10 }}>{error}</Text>}
      {!ready && <Text style={{ color: colors.muted, marginBottom: 10 }}>Add your name, city, at least one service and one pet type to save.</Text>}
      <Button title={busy ? 'Saving…' : saved ? '✓ Saved' : 'Save profile'} disabled={!ready || busy} onPress={save} />
    </ScrollView>
  );
}
