import React, { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import SitterCard from '../components/SitterCard';
import { Chip, Empty, styles } from '../components/ui';
import { useStore } from '../store';
import { colors, petLabels, serviceLabels } from '../theme';
import { PetType, Service } from '../types';

export default function FindScreen({ openSitter }: { openSitter: (id: string) => void }) {
  const { sitters, favorites } = useStore();
  const [query, setQuery] = useState('');
  const [pet, setPet] = useState<PetType | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [availableOnly, setAvailableOnly] = useState(true);
  const [sort, setSort] = useState<'rating' | 'price'>('rating');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sitters
      .filter((s) => !q || `${s.name} ${s.city} ${s.neighborhood}`.toLowerCase().includes(q))
      .filter((s) => !pet || s.accepts.includes(pet))
      .filter((s) => !service || s.services.includes(service))
      .filter((s) => !availableOnly || s.available)
      .sort((a, b) => (sort === 'rating' ? b.rating - a.rating : a.price - b.price));
  }, [sitters, query, pet, service, availableOnly, sort]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 12 }}>
        Who will look after your pets?
      </Text>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="🔍  Search by city, area or name"
        placeholderTextColor={colors.muted}
        style={[styles.input, { marginBottom: 12 }]}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {(Object.keys(petLabels) as PetType[]).map((p) => (
          <Chip key={p} label={petLabels[p]} selected={pet === p} onPress={() => setPet(pet === p ? null : p)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {(Object.keys(serviceLabels) as Service[]).map((x) => (
          <Chip key={x} label={serviceLabels[x]} selected={service === x} onPress={() => setService(service === x ? null : x)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        <Chip label="Available now" selected={availableOnly} onPress={() => setAvailableOnly(!availableOnly)} />
        <Chip label="Top rated" selected={sort === 'rating'} onPress={() => setSort('rating')} />
        <Chip label="Lowest price" selected={sort === 'price'} onPress={() => setSort('price')} />
      </View>

      <Text style={[styles.section, { marginTop: 8 }]}>{results.length} sitter{results.length === 1 ? '' : 's'} found</Text>
      {results.map((s) => (
        <SitterCard key={s.id} sitter={s} favorite={favorites.includes(s.id)} onPress={() => openSitter(s.id)} />
      ))}
      {results.length === 0 && <Empty emoji="🔎" text="No sitters match these filters. Try removing one." />}
    </ScrollView>
  );
}
