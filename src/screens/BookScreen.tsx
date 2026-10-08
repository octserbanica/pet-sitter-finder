import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Button, Card, Chip, Field, SectionTitle, Stepper } from '../components/ui';
import { addDays, fmtDate, money, todayPlus, unitCount } from '../format';
import { quote } from '../pricing';
import { useStore } from '../store';
import { colors, petEmoji, serviceLabels } from '../theme';
import { Service } from '../types';

export default function BookScreen({ id, onDone, onAddPet }: { id: string; onDone: () => void; onAddPet: () => void }) {
  const { sitters, pets: myPets, createBooking } = useStore();
  const sitter = sitters.find((s) => s.id === id)!;
  const eligiblePets = myPets.filter((p) => sitter.accepts.includes(p.type));
  const [selected, setSelected] = useState<string[]>(eligiblePets.slice(0, 1).map((p) => p.id));
  const [service, setService] = useState<Service>(sitter.services[0]);
  const [startOffset, setStartOffset] = useState(7);
  const [units, setUnits] = useState(3);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = todayPlus(startOffset);
  const { perUnit, total } = quote(sitter, service, units, selected.length);
  const isNights = service === 'boarding' || service === 'house';

  const submit = async () => {
    const pets = myPets.filter((p) => selected.includes(p.id)).map((p) => ({ name: p.name, type: p.type }));
    setBusy(true); setError(null);
    try {
      await createBooking({ sitterId: id, pets, service, start, nights: units, note, total });
      onDone();
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>Book {sitter.name.split(' ')[0]} {sitter.avatar}</Text>

      <SectionTitle>Which pets?</SectionTitle>
      {eligiblePets.length === 0 ? (
        <Card>
          <Text style={{ color: colors.text, marginBottom: 10 }}>
            None of your saved pets are types {sitter.name.split(' ')[0]} cares for. Add a pet first.
          </Text>
          <Button title="Add a pet" variant="secondary" onPress={onAddPet} />
        </Card>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {eligiblePets.map((p) => (
            <Chip
              key={p.id}
              label={`${petEmoji[p.type]} ${p.name}`}
              selected={selected.includes(p.id)}
              onPress={() => setSelected(selected.includes(p.id) ? selected.filter((x) => x !== p.id) : [...selected, p.id])}
            />
          ))}
        </View>
      )}

      <SectionTitle>Service</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {sitter.services.map((x) => (
          <Chip key={x} label={serviceLabels[x]} selected={service === x} onPress={() => setService(x)} />
        ))}
      </View>

      <SectionTitle>When</SectionTitle>
      <Card>
        <Text style={{ color: colors.muted, marginBottom: 8 }}>Starting</Text>
        <Stepper value={startOffset} min={0} max={180} onChange={setStartOffset} format={(v) => fmtDate(todayPlus(v))} />
        <Text style={{ color: colors.muted, marginTop: 16, marginBottom: 8 }}>{isNights ? 'Nights' : 'Number of ' + (service === 'walking' ? 'walks' : 'visits')}</Text>
        <Stepper value={units} onChange={setUnits} format={(v) => unitCount(service, v)} />
        {isNights && (
          <Text style={{ color: colors.muted, marginTop: 12 }}>Back home on {fmtDate(addDays(start, units))}</Text>
        )}
      </Card>

      <SectionTitle>Notes for the sitter</SectionTitle>
      <Field label="Feeding, medication, routines…" value={note} onChangeText={setNote} multiline placeholder="Optional" />

      <Card style={{ backgroundColor: colors.primarySoft, borderColor: colors.primarySoft }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.text }}>{money(perUnit)} × {unitCount(service, units)}</Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>{money(total)}</Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>You will only be charged once the sitter accepts.</Text>
      </Card>

      {error && <Text style={{ color: colors.red, marginBottom: 10 }}>{error}</Text>}
      <Button title={busy ? 'Sending…' : 'Send request'} onPress={submit} disabled={selected.length === 0 || busy} />
    </ScrollView>
  );
}
