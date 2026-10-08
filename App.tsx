import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import BookScreen from './src/screens/BookScreen';
import FindScreen from './src/screens/FindScreen';
import OwnerBookingsScreen from './src/screens/OwnerBookingsScreen';
import PetsScreen from './src/screens/PetsScreen';
import SitterEditScreen from './src/screens/SitterEditScreen';
import SitterProfileScreen from './src/screens/SitterProfileScreen';
import SitterRequestsScreen from './src/screens/SitterRequestsScreen';
import AuthScreen from './src/screens/AuthScreen';
import ChatScreen from './src/screens/ChatScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { StoreProvider, useStore } from './src/store';
import { isConfigured } from './src/supabase';
import { colors } from './src/theme';
import { Button } from './src/components/ui';

type Route =
  | { name: 'sitter'; id: string }
  | { name: 'book'; id: string }
  | { name: 'addPet' }
  | { name: 'chat'; ownerId: string; sitterId: string };

const ownerTabs = [
  { key: 'find', label: 'Find', icon: '🔍' },
  { key: 'bookings', label: 'Bookings', icon: '🗓️' },
  { key: 'messages', label: 'Messages', icon: '💬' },
  { key: 'pets', label: 'My pets', icon: '🐾' },
  { key: 'account', label: 'Profile', icon: '👤' },
] as const;

const sitterTabs = [
  { key: 'requests', label: 'Requests', icon: '📬' },
  { key: 'messages', label: 'Messages', icon: '💬' },
  { key: 'services', label: 'My services', icon: '🪪' },
  { key: 'account', label: 'Profile', icon: '👤' },
] as const;

function Main() {
  const { session, profile, loading, loadError, refresh, signOut, mode: savedMode, mySitter } = useStore();
  // Sitter mode needs a sitter listing; otherwise the app is in pet-owner mode.
  const mode = savedMode === 'sitter' && mySitter ? 'sitter' : 'owner';
  const [tab, setTab] = useState<string>('find');
  const [stack, setStack] = useState<Route[]>([]);
  const [justBooked, setJustBooked] = useState(false);

  const push = (r: Route) => setStack((s) => [...s, r]);
  const pop = () => setStack((s) => s.slice(0, -1));

  // Reset navigation when someone signs in or switches between owner and sitter mode.
  useEffect(() => {
    setStack([]);
    setTab(mode === 'sitter' ? 'requests' : profile && !profile.fullName ? 'account' : 'find');
    setJustBooked(false);
  }, [profile?.id, mode]);

  // Android hardware back button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length) { pop(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack.length]);

  if (!isConfigured) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>The app is not connected to Supabase yet. Add EXPO_PUBLIC_SUPABASE_ANON_KEY to the .env file and restart.</Text>
      </View>
    );
  }
  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!session) return <AuthScreen />;
  if (loadError || !profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Could not load your account: {loadError ?? 'profile missing'}</Text>
        <Button title="Try again" onPress={() => refresh()} style={{ marginBottom: 10, alignSelf: 'stretch' }} />
        <Button title="Sign out" variant="secondary" onPress={signOut} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  const route = stack[stack.length - 1];
  const tabs = mode === 'owner' ? ownerTabs : sitterTabs;
  const openChat = (ownerId: string, sitterId: string) => push({ name: 'chat', ownerId, sitterId });

  let title = tabs.find((t) => t.key === tab)?.label ?? '';
  let body: React.ReactNode;
  if (route?.name === 'sitter') {
    title = 'Sitter profile';
    body = (
      <SitterProfileScreen
        id={route.id}
        onBook={() => push({ name: 'book', id: route.id })}
        onMessage={() => openChat(session.user.id, route.id)}
      />
    );
  } else if (route?.name === 'book') {
    title = 'Request a booking';
    body = (
      <BookScreen
        id={route.id}
        onAddPet={() => push({ name: 'addPet' })}
        onDone={() => { setStack([]); setTab('bookings'); setJustBooked(true); }}
      />
    );
  } else if (route?.name === 'addPet') {
    title = 'Add a pet';
    body = <PetsScreen startAdding />;
  } else if (route?.name === 'chat') {
    title = 'Chat';
    body = <ChatScreen ownerId={route.ownerId} sitterId={route.sitterId} />;
  } else if (tab === 'find') body = <FindScreen openSitter={(id) => push({ name: 'sitter', id })} />;
  else if (tab === 'bookings') body = <OwnerBookingsScreen justBooked={justBooked} openChat={openChat} />;
  else if (tab === 'messages') body = <MessagesScreen openChat={openChat} />;
  else if (tab === 'pets') body = <PetsScreen />;
  else if (tab === 'requests') body = <SitterRequestsScreen openChat={openChat} />;
  else if (tab === 'services') body = <SitterEditScreen />;
  else body = <ProfileScreen />;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        {route ? (
          <Pressable onPress={pop} hitSlop={12} style={{ width: 70 }}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        ) : (
          <Text style={[styles.brand, { width: 70 }]}>🐾</Text>
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={{ width: 70 }} />
      </View>
      <View style={{ flex: 1 }}>{body}</View>
      {!route && (
        <View style={styles.tabbar}>
          {tabs.map((t) => (
            <Pressable
              key={t.key}
              style={styles.tab}
              onPress={() => { setTab(t.key); setJustBooked(false); refresh().catch(() => {}); }}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t.key }}
            >
              <Text style={{ fontSize: 20, opacity: tab === t.key ? 1 : 0.5 }}>{t.icon}</Text>
              <Text style={[styles.tabLabel, tab === t.key && { color: colors.primary }]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <SafeAreaView style={styles.root}>
          {/* Keep the layout phone-sized when opened in a wide browser window. */}
          <View style={styles.frame}>
            <Main />
          </View>
        </SafeAreaView>
        <StatusBar style="dark" />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  frame: { flex: 1, width: '100%', maxWidth: 720, alignSelf: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  message: { color: colors.text, textAlign: 'center', marginBottom: 16, fontSize: 15 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.bg,
  },
  brand: { fontSize: 20 },
  back: { fontSize: 16, color: colors.primary, fontWeight: '600' },
  title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text },
  tabbar: {
    flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card,
    paddingVertical: 6,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabLabel: { fontSize: 11, color: colors.muted, marginTop: 2, fontWeight: '600' },
});
