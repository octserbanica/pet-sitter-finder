import React from 'react';
import { Text, View } from 'react-native';
import { colors, petEmoji, sizeLabels } from '../theme';
import { Pet } from '../types';
import { Avatar, Card, Chip } from './ui';

export default function PetCard({ pet, children }: { pet: Pet; children?: React.ReactNode }) {
  const facts = [pet.breed, pet.age ? `${pet.age} yrs` : '', pet.size ? sizeLabels[pet.size].split(' (')[0] : ''].filter(Boolean);
  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar url={pet.photoUrl} fallback={petEmoji[pet.type]} size={64} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text }}>{pet.name}</Text>
          {facts.length > 0 && <Text style={{ color: colors.muted, marginTop: 2 }}>{facts.join(' · ')}</Text>}
        </View>
      </View>
      {pet.temperament.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
          {pet.temperament.map((t) => <Chip key={t} label={t} />)}
        </View>
      )}
      {!!pet.notes && <Text style={{ color: colors.text, marginTop: 6, lineHeight: 20 }}>{pet.notes}</Text>}
      {children}
    </Card>
  );
}
