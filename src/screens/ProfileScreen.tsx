import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import PersonRow from '../components/PersonRow';
import { Avatar, Button, Card, Chip, ErrorText, Field, SectionTitle, initials } from '../components/ui';
import { useStore } from '../store';
import { colors } from '../theme';

export default function ProfileScreen({ openPerson }: { openPerson: (userId: string) => void }) {
  const { profile, email, mode, setMode, mySitter, updateProfile, uploadPhoto, becomeSitter, signOut, following, followers } = useStore();
  const [showFollowers, setShowFollowers] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [age, setAge] = useState(profile?.age ? String(profile.age) : '');
  const [about, setAbout] = useState(profile?.about ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;

  const ageNum = age.trim() ? Number(age) : null;
  const ageValid = ageNum === null || (Number.isInteger(ageNum) && ageNum >= 18 && ageNum <= 120);
  const dirty = fullName !== profile.fullName || about !== profile.about || ageNum !== profile.age;

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label); setError(null);
    try { await fn(); } catch (e: any) { setError(e.message); } finally { setBusy(null); }
  };

  const changePhoto = () => run('photo', async () => {
    const url = await uploadPhoto('avatar');
    if (url) await updateProfile({ avatarUrl: url });
  });

  const save = () => run('save', async () => {
    await updateProfile({ fullName: fullName.trim(), age: ageNum, about: about.trim() });
    setSaved(true);
  });

  const startSitting = () => run('sitter', async () => {
    if (!mySitter) await becomeSitter();
    setMode('sitter');
  });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View style={{ alignItems: 'center', marginBottom: 12 }}>
        <Pressable onPress={changePhoto} accessibilityRole="button" accessibilityLabel="Change profile photo">
          <Avatar url={profile.avatarUrl} fallback={initials(profile.fullName)} size={104} />
        </Pressable>
        <Pressable onPress={changePhoto} style={{ marginTop: 8 }}>
          <Text style={{ color: colors.primary, fontWeight: '600' }}>
            {busy === 'photo' ? 'Uploading…' : profile.avatarUrl ? 'Change photo' : 'Add a photo'}
          </Text>
        </Pressable>
        <Text style={{ color: colors.muted, marginTop: 4 }}>{email}</Text>
      </View>

      {!profile.fullName && (
        <Card style={{ backgroundColor: colors.amberSoft, borderColor: colors.amberSoft }}>
          <Text style={{ color: colors.text }}>Add your name and a photo so sitters and owners know who they're talking to.</Text>
        </Card>
      )}

      <SectionTitle>About you</SectionTitle>
      <Field label="Name" value={fullName} onChangeText={(v) => { setFullName(v); setSaved(false); }} placeholder="e.g. Octavian Popa" />
      <Field label="Age" value={age} onChangeText={(v) => { setAge(v.replace(/[^0-9]/g, '')); setSaved(false); }} keyboardType="number-pad" placeholder="18 or older" maxLength={3} />
      {!ageValid && <ErrorText>Age must be between 18 and 120.</ErrorText>}
      <Field
        label="About me"
        value={about}
        onChangeText={(v) => { setAbout(v); setSaved(false); }}
        multiline
        maxLength={1000}
        placeholder="A few words about you, your home and your experience with animals"
      />
      <ErrorText>{error}</ErrorText>
      <Button
        title={busy === 'save' ? 'Saving…' : saved && !dirty ? '✓ Saved' : 'Save profile'}
        onPress={save}
        disabled={!dirty || !ageValid || !fullName.trim() || !!busy}
      />

      <SectionTitle>How you use the app</SectionTitle>
      <Card>
        <Text style={{ color: colors.text, marginBottom: 12 }}>
          {mode === 'owner'
            ? 'You are looking for sitters for your pets.'
            : 'You are pet sitting. Owners can find you and send you requests.'}
        </Text>
        {mode === 'owner' ? (
          <Button
            title={busy === 'sitter' ? 'Setting up…' : mySitter ? 'Switch to sitter mode' : 'Become a sitter too'}
            variant="secondary"
            onPress={startSitting}
            disabled={!!busy}
          />
        ) : (
          <Button title="Switch to finding a sitter" variant="secondary" onPress={() => setMode('owner')} />
        )}
      </Card>

      <SectionTitle>People</SectionTitle>
      <Card>
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          <Chip label={`Following ${following.length}`} selected={!showFollowers} onPress={() => setShowFollowers(false)} />
          <Chip label={`Followers ${followers.length}`} selected={showFollowers} onPress={() => setShowFollowers(true)} />
        </View>
        {(showFollowers ? followers : following).map((id) => <PersonRow key={id} userId={id} onPress={() => openPerson(id)} />)}
        {(showFollowers ? followers : following).length === 0 && (
          <Text style={{ color: colors.muted }}>
            {showFollowers ? 'Nobody follows you yet.' : 'Follow sitters and owners from their profile to keep them here.'}
          </Text>
        )}
      </Card>

      <SectionTitle>Account</SectionTitle>
      <Button title="Sign out" variant="secondary" onPress={signOut} />
    </ScrollView>
  );
}
