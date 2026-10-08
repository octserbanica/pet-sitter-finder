import React, { useState } from 'react';
import { ViewStyle } from 'react-native';
import { useStore } from '../store';
import { Button } from './ui';

// Follow / Following toggle for another person's account.
export default function FollowButton({ userId, style }: { userId: string; style?: ViewStyle }) {
  const { following, follow, unfollow } = useStore();
  const [busy, setBusy] = useState(false);
  const on = following.includes(userId);
  const toggle = () => {
    setBusy(true);
    (on ? unfollow(userId) : follow(userId)).catch(() => {}).finally(() => setBusy(false));
  };
  return (
    <Button
      title={on ? '✓ Following' : 'Follow'}
      variant={on ? 'secondary' : 'primary'}
      onPress={toggle}
      disabled={busy}
      style={style}
    />
  );
}
