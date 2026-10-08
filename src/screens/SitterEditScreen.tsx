import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { Avatar, Button, Card, Chip, ErrorText, Field, SectionTitle, Stepper, initials, styles } from '../components/ui';
import { money } from '../format';
import { SitterInput, useStore } from '../store';
import { colors, petLabels, serviceLabels, serviceUnit } from '../theme';
import { PetType, Service } from '../types';

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
const suggested: Record<Service, number> = { boarding: 120, house: 130, dropin: 50, walking: 40 };

export default function SitterEditScreen() {
  const { mySitter, updateMySitter } = useStore();
  const [draft, setDraft] = useState<SitterInput | null>(
    mySitter ? {
      city: mySitter.city, neighborhood: mySitter.neighborhood, available: mySitter.available, prices: mySitter.prices,
      extraPetPercent: mySitter.extraPetPercent, accepts: mySitter.accepts, bio: mySitter.bio, years: mySitter.years,
    } : null,
  );
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!mySitter || !draft) return null;

  const set = (patch: Partial<SitterInput>) => { setDraft({ ...draft, ...patch }); setSaved(false); };
  const setPrice = (svc: Service, value: number | undefined) => {
    const prices = { ...draft.prices };
    if (value === undefined) delete prices[svc];
    else prices[svc] = value;
    set({ prices });
  };
  const offered = Object.keys(draft.prices) as Service[];
  const pricesValid = offered.every((k) => (draft.prices[k] ?? 0) >= 5 && (draft.prices[k] ?? 0) <= 2000);
  const ready = offered.length > 0 && pricesValid && draft.accepts.length > 0 && draft.city.trim();

  const save = async () => {
    setBusy(true); setError(null);
    try {
      await updateMySitter({ ...draft, city: draft.city.trim(), neighborhood: draft.neighborhood.trim(), bio: draft.bio.trim() });
      setSaved(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar url={mySitter.photoUrl} fallback={initials(mySitter.name)} size={52} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{mySitter.name}</Text>
            <Text style={{ color: colors.muted }}>{mySitter.reviews ? `⭐ ${mySitter.rating} · ${mySitter.reviews} reviews` : 'No reviews yet'}</Text>
          </View>
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>Your name and photo come from your Profile.</Text>
      </Card>

      <SectionTitle>Availability</SectionTitle>
      <View style={{ flexDirection: 'row' }}>
        <Chip label="Taking bookings" selected={draft.available} onPress={() => set({ available: true })} />
        <Chip label="Paused" selected={!draft.available} onPress={() => set({ available: false })} />
      </View>

      <SectionTitle>Services and prices</SectionTitle>
      <Text style={{ color: colors.muted, marginBottom: 10 }}>Turn on what you offer and set your price for each.</Text>
      {(Object.keys(serviceLabels) as Service[]).map((svc) => {
        const on = draft.prices[svc] !== undefined;
        return (
          <Card key={svc} style={{ paddingVertical: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: on ? colors.text : colors.muted }}>{serviceLabels[svc]}</Text>
              </View>
              <Chip label={on ? 'Offered' : 'Off'} selected={on} onPress={() => setPrice(svc, on ? undefined : suggested[svc])} />
            </View>
            {on && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <TextInput
                  accessibilityLabel={`Price for ${serviceLabels[svc]}`}
                  value={String(draft.prices[svc] ?? '')}
                  onChangeText={(v) => setPrice(svc, Number(v.replace(/[^0-9]/g, '')) || 0)}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={[styles.input, { width: 100, marginRight: 8 }]}
                />
                <Text style={{ color: colors.text }}>RON per {serviceUnit[svc]}</Text>
              </View>
            )}
          </Card>
        );
      })}
      {!pricesValid && <ErrorText>Each price must be between 5 and 2000 RON.</ErrorText>}

      <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, marginBottom: 8, fontWeight: '600' }}>Extra charge for each additional pet</Text>
      <Stepper value={draft.extraPetPercent} min={0} max={100} onChange={(extraPetPercent) => set({ extraPetPercent })} format={(v) => `+${v}%`} />
      {offered.length > 0 && (
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 8 }}>
          Example: {serviceLabels[offered[0]].toLowerCase()} for 2 pets costs{' '}
          {money(Math.round((draft.prices[offered[0]] ?? 0) * (1 + draft.extraPetPercent / 100)))} per {serviceUnit[offered[0]]}.
        </Text>
      )}

      <SectionTitle>Pets I care for</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {(Object.keys(petLabels) as PetType[]).map((p) => (
          <Chip key={p} label={petLabels[p]} selected={draft.accepts.includes(p)} onPress={() => set({ accepts: toggle(draft.accepts, p) })} />
        ))}
      </View>

      <SectionTitle>Where and experience</SectionTitle>
      <Field label="City" value={draft.city} onChangeText={(city) => set({ city })} placeholder="e.g. Bucharest" />
      <Field label="Neighbourhood" value={draft.neighborhood} onChangeText={(neighborhood) => set({ neighborhood })} placeholder="e.g. Floreasca" />
      <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 8, fontWeight: '600' }}>Years of experience</Text>
      <Stepper value={draft.years} min={0} max={50} onChange={(years) => set({ years })} format={(v) => `${v} year${v === 1 ? '' : 's'}`} />

      <SectionTitle>About my pet sitting</SectionTitle>
      <Field label="Shown on your sitter page" value={draft.bio} onChangeText={(bio) => set({ bio })} multiline placeholder="Your home, garden, routine, experience with medication…" />

      <ErrorText>{error}</ErrorText>
      {!ready && <Text style={{ color: colors.muted, marginBottom: 10 }}>Add your city, at least one service and one pet type to save.</Text>}
      <Button title={busy ? 'Saving…' : saved ? '✓ Saved' : 'Save'} disabled={!ready || busy} onPress={save} />
    </ScrollView>
  );
}
