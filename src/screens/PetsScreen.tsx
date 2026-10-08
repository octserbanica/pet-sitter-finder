import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Chip, Empty, Field, SectionTitle } from '../components/ui';
import { useStore } from '../store';
import { colors, petEmoji, petLabels } from '../theme';
import { PetType } from '../types';

export default function PetsScreen({ startAdding = false }: { startAdding?: boolean }) {
  const { pets, addPet, removePet } = useStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(startAdding);
  const [name, setName] = useState('');
  const [type, setType] = useState<PetType>('dog');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState('');
  const [notes, setNotes] = useState('');

  const save = async () => {
    setBusy(true); setError(null);
    try {
      await addPet({ name: name.trim(), type, breed: breed.trim(), age: Number(age) || 0, notes: notes.trim() });
      setName(''); setBreed(''); setAge(''); setNotes(''); setAdding(false);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <SectionTitle>My pets</SectionTitle>
      {error && <Text style={{ color: colors.red, marginBottom: 8 }}>{error}</Text>}
      {pets.length === 0 && <Empty emoji="🐾" text="Add your pets so sitters know who they will meet." />}
      {pets.map((p) => (
        <Card key={p.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 34, marginRight: 12 }}>{petEmoji[p.type]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{p.name}</Text>
              <Text style={{ color: colors.muted }}>{[p.breed, p.age ? `${p.age} yrs` : ''].filter(Boolean).join(' · ')}</Text>
            </View>
            <Button title="Remove" variant="secondary" onPress={() => removePet(p.id).catch((e) => setError(e.message))} style={{ paddingVertical: 8 }} />
          </View>
          {!!p.notes && <Text style={{ color: colors.text, marginTop: 8 }}>{p.notes}</Text>}
        </Card>
      ))}

      {adding ? (
        <Card>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 12 }}>New pet</Text>
          <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. Bruno" />
          <Text style={{ fontSize: 13, color: colors.muted, marginBottom: 6, fontWeight: '600' }}>Type</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 6 }}>
            {(Object.keys(petLabels) as PetType[]).map((t) => (
              <Chip key={t} label={petLabels[t]} selected={type === t} onPress={() => setType(t)} />
            ))}
          </View>
          <Field label="Breed" value={breed} onChangeText={setBreed} placeholder="Optional" />
          <Field label="Age (years)" value={age} onChangeText={setAge} keyboardType="numeric" placeholder="Optional" />
          <Field label="Care notes" value={notes} onChangeText={setNotes} multiline placeholder="Food, walks, medication, quirks" />
          <View style={{ flexDirection: 'row' }}>
            <Button title="Cancel" variant="secondary" onPress={() => setAdding(false)} style={{ marginRight: 10 }} />
            <Button title={busy ? 'Saving…' : 'Save pet'} onPress={save} disabled={!name.trim() || busy} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Button title="+ Add a pet" onPress={() => setAdding(true)} />
      )}
    </ScrollView>
  );
}
