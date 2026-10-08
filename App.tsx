import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ME_SITTER_ID } from './src/data';
import AccountScreen from './src/screens/AccountScreen';
import BookScreen from './src/screens/BookScreen';
import FindScreen from './src/screens/FindScreen';
import OwnerBookingsScreen from './src/screens/OwnerBookingsScreen';
import PetsScreen from './src/screens/PetsScreen';
import SitterEditScreen from './src/screens/SitterEditScreen';
import SitterProfileScreen from './src/screens/SitterProfileScreen';
import SitterRequestsScreen from './src/screens/SitterRequestsScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { StoreProvider, useStore } from './src/store';
import { colors } from './src/theme';

type Route = { name: 'sitter'; id: string } | { name: 'book'; id: string } | { name: 'addPet' };

const ownerTabs = [
  { key: 'find', label: 'Find', icon: '🔍' },
  { key: 'bookings', label: 'Bookings', icon: '🗓️' },
  { key: 'pets', label: 'My pets', icon: '🐾' },
  { key: 'account', label: 'Account', icon: '👤' },
] as const;

const sitterTabs = [
  { key: 'requests', label: 'Requests', icon: '📬' },
  { key: 'profile', label: 'My profile', icon: '🪪' },
  { key: 'account', label: 'Account', icon: '👤' },
] as const;

function Main() {
  const { state, dispatch, ready } = useStore();
  const [tab, setTab] = useState<string>('find');
  const [stack, setStack] = useState<Route[]>([]);
  const [justBooked, setJustBooked] = useState(false);

  const push = (r: Route) => setStack((s) => [...s, r]);
  const pop = () => setStack((s) => s.slice(0, -1));

  // Reset navigation when the role changes.
  useEffect(() => {
    setStack([]);
    setTab(state.role === 'sitter' ? 'requests' : 'find');
  }, [state.role]);

  // Android hardware back button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length) { pop(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack.length]);

  // Simulated sitters reply a few seconds after a request. The demo sitter
  // account (ME_SITTER_ID) is answered by hand in sitter mode instead.
  useEffect(() => {
    const timers = state.bookings
      .filter((b) => b.status === 'pending' && b.sitterId !== ME_SITTER_ID)
      .map((b) => setTimeout(() => dispatch({ type: 'setBookingStatus', id: b.id, status: 'accepted' }), 4000));
    return () => timers.forEach(clearTimeout);
  }, [state.bookings]);

  if (!ready) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!state.role) return <WelcomeScreen />;

  const route = stack[stack.length - 1];
  const tabs = state.role === 'owner' ? ownerTabs : sitterTabs;

  let title = tabs.find((t) => t.key === tab)?.label ?? '';
  let body: React.ReactNode;
  if (route?.name === 'sitter') {
    title = 'Sitter profile';
    body = <SitterProfileScreen id={route.id} onBook={() => push({ name: 'book', id: route.id })} />;
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
  } else if (tab === 'find') body = <FindScreen openSitter={(id) => push({ name: 'sitter', id })} />;
  else if (tab === 'bookings') body = <OwnerBookingsScreen justBooked={justBooked} />;
  else if (tab === 'pets') body = <PetsScreen />;
  else if (tab === 'requests') body = <SitterRequestsScreen />;
  else if (tab === 'profile') body = <SitterEditScreen />;
  else body = <AccountScreen />;

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
              onPress={() => { setTab(t.key); setJustBooked(false); }}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
