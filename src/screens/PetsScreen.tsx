import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import PetCard from '../components/PetCard';
import { Avatar, Button, Card, Chip, Empty, ErrorText, Field, SectionTitle } from '../components/ui';
import { PetInput, useStore } from '../store';
import { colors, petEmoji, petLabels, sizeLabels, temperaments } from '../theme';
import { Pet, PetSize, PetType } from '../types';

const blank: PetInput = { name: '', type: 'dog', breed: '', age: 0, size: null, temperament: [], notes: '', photoUrl: null };

export default function PetsScreen({ startAdding = false }: { startAdding?: boolean }) {
  const { myPets, savePet, removePet, uploadPhoto } = useStore();
  const [editing, setEditing] = useState<{ id?: string; pet: PetInput } | null>(startAdding ? { pet: blank } : null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (patch: Partial<PetInput>) => editing && setEditing({ ...editing, pet: { ...editing.pet, ...patch } });

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label); setError(null);
    try { await fn(); } catch (e: any) { setError(e.message); } finally { setBusy(null); }
  };

  const edit = (p: Pet) => {
    const { id, ownerId, ...pet } = p;
    setEditing({ id, pet });
  };

  if (editing) {
    const { pet } = editing;
    return (
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginBottom: 12 }}>
          <Avatar url={pet.photoUrl} fallback={petEmoji[pet.type]} size={96} />
          <Pressable
            style={{ marginTop: 8 }}
            onPress={() => run('photo', async () => { const url = await uploadPhoto('pet'); if (url) set({ photoUrl: url }); })}
          >
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              {busy === 'photo' ? 'Uploading…' : pet.photoUrl ? 'Change photo' : 'Add a photo'}
            </Text>
          </Pressable>
        </View>

        <Field label="Name" value={pet.name} onChangeText={(name) => set({ name })} placeholder="e.g. Bruno" />
        <Text style={labelStyle}>Type</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
          {(Object.keys(petLabels) as PetType[]).map((t) => (
            <Chip key={t} label={petLabels[t]} selected={pet.type === t} onPress={() => set({ type: t })} />
          ))}
        </View>
        <Field label="Breed" value={pet.breed} onChangeText={(breed) => set({ breed })} placeholder="e.g. Labrador, mixed" />
        <Field
          label="Age (years)"
          value={pet.age ? String(pet.age) : ''}
          onChangeText={(v) => set({ age: Number(v.replace(/[^0-9]/g, '')) || 0 })}
          keyboardType="number-pad"
          placeholder="Optional"
          maxLength={2}
        />

        <Text style={labelStyle}>Size</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
          {(Object.keys(sizeLabels) as PetSize[]).map((sz) => (
            <Chip key={sz} label={sizeLabels[sz]} selected={pet.size === sz} onPress={() => set({ size: pet.size === sz ? null : sz })} />
          ))}
        </View>

        <Text style={labelStyle}>Temperament</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
          {temperaments.map((t) => (
            <Chip
              key={t}
              label={t}
              selected={pet.temperament.includes(t)}
              onPress={() => set({ temperament: pet.temperament.includes(t) ? pet.temperament.filter((x) => x !== t) : [...pet.temperament, t] })}
            />
          ))}
        </View>

        <Field
          label="Good to know"
          value={pet.notes}
          onChangeText={(notes) => set({ notes })}
          multiline
          placeholder="Feeding times, walks, medication, fears, favourite toys, vet contact…"
        />
        <ErrorText>{error}</ErrorText>
        <View style={{ flexDirection: 'row' }}>
          <Button title="Cancel" variant="secondary" onPress={() => { setEditing(null); setError(null); }} style={{ marginRight: 10 }} />
          <Button
            title={busy === 'save' ? 'Saving…' : editing.id ? 'Save changes' : 'Save pet'}
            onPress={() => run('save', async () => { await savePet({ ...pet, name: pet.name.trim() }, editing.id); setEditing(null); })}
            disabled={!pet.name.trim() || !!busy}
            style={{ flex: 1 }}
          />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <SectionTitle>My pets</SectionTitle>
      <ErrorText>{error}</ErrorText>
      {myPets.length === 0 && <Empty emoji="🐾" text="Add your pets so sitters know who they will meet." />}
      {myPets.map((p) => (
        <PetCard key={p.id} pet={p}>
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            <Button title="Edit" variant="secondary" onPress={() => edit(p)} style={{ marginRight: 10, paddingVertical: 8 }} />
            <Button title="Remove" variant="danger" onPress={() => run('remove', () => removePet(p.id))} style={{ paddingVertical: 8 }} />
          </View>
        </PetCard>
      ))}
      <Button title="+ Add a pet" onPress={() => setEditing({ pet: blank })} />
    </ScrollView>
  );
}

const labelStyle = { fontSize: 13, color: colors.muted, marginBottom: 6, fontWeight: '600' as const };
