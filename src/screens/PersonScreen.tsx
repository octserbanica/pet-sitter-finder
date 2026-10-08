import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import FollowButton from '../components/FollowButton';
import { Avatar, Button, Card, SectionTitle, initials } from '../components/ui';
import { useStore } from '../store';
import { supabase } from '../supabase';
import { colors } from '../theme';

// Someone's public page: profile, follower counts, follow button and a link to their sitter listing.
export default function PersonScreen({ userId, openSitter, onMessage }: {
  userId: string; openSitter: (sitterId: string) => void; onMessage: (sitterId: string) => void;
}) {
  const { people, sitters, session, following, loadPeople } = useStore();
  const [counts, setCounts] = useState<{ followers: number; following: number } | null>(null);
  const p = people[userId];
  const sitter = sitters.find((s) => s.userId === userId);
  const isMe = userId === session?.user.id;
  const iFollow = following.includes(userId);

  useEffect(() => {
    loadPeople([userId]).catch(() => {});
  }, [userId]);

  // Re-count whenever I follow or unfollow this person.
  useEffect(() => {
    Promise.all([
      supabase.from('follows').select('follower_id').eq('followee_id', userId),
      supabase.from('follows').select('followee_id').eq('follower_id', userId),
    ]).then(([a, b]) => setCounts({ followers: a.data?.length ?? 0, following: b.data?.length ?? 0 }));
  }, [userId, iFollow]);

  const name = p?.fullName || 'Pet Sitter Finder user';
  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <View style={{ alignItems: 'center', marginBottom: 16 }}>
        <Avatar url={p?.avatarUrl} fallback={initials(name)} size={104} />
        <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 10 }}>
          {name}{p?.age ? `, ${p.age}` : ''}
        </Text>
        <Text style={{ color: colors.muted, marginTop: 4 }}>
          {sitter ? `Pet sitter${sitter.city ? ` in ${sitter.city}` : ''}` : 'Pet owner'}
        </Text>
        {counts && (
          <Text style={{ color: colors.text, marginTop: 8 }}>
            <Text style={{ fontWeight: '700' }}>{counts.followers}</Text> {counts.followers === 1 ? 'follower' : 'followers'}
            {'   ·   '}
            <Text style={{ fontWeight: '700' }}>{counts.following}</Text> following
          </Text>
        )}
      </View>

      {!isMe && (
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
          <FollowButton userId={userId} style={{ flex: 1 }} />
          {sitter && <Button title="Message" variant="secondary" onPress={() => onMessage(sitter.id)} style={{ flex: 1 }} />}
        </View>
      )}

      {!!p?.about && (
        <>
          <SectionTitle>About me</SectionTitle>
          <Card><Text style={{ color: colors.text, lineHeight: 21 }}>{p.about}</Text></Card>
        </>
      )}
      {sitter && (
        <Button title="See sitter profile and prices" variant="secondary" onPress={() => openSitter(sitter.id)} style={{ marginTop: 12 }} />
      )}
    </ScrollView>
  );
}
