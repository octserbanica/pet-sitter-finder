import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Avatar, ErrorText, styles } from '../components/ui';
import { describe } from '../chat';
import { useStore } from '../store';
import { colors } from '../theme';

export default function ChatScreen({ ownerId, sitterId }: { ownerId: string; sitterId: string }) {
  const { messages, session, sitters, people, sendMessage } = useStore();
  const me = session!.user.id;
  const other = describe(ownerId, sitterId, me, sitters, people);
  const thread = messages.filter((m) => m.ownerId === ownerId && m.sitterId === sitterId);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scroll = useRef<ScrollView>(null);

  const send = async () => {
    if (!text.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      await sendMessage(ownerId, sitterId, text);
      setText('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <Avatar url={other.photoUrl} fallback={other.fallback} size={36} />
        <View style={{ marginLeft: 10 }}>
          <Text style={{ fontWeight: '700', color: colors.text }}>{other.name}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>{other.iAmOwner ? 'Sitter' : 'Pet owner'}</Text>
        </View>
      </View>
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ padding: 12, flexGrow: 1, justifyContent: 'flex-end' }}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      >
        {thread.length === 0 && (
          <Text style={{ color: colors.muted, textAlign: 'center', marginBottom: 16 }}>
            Say hello and ask anything before you book: routines, your pets, dates.
          </Text>
        )}
        {thread.map((m) => {
          const mine = m.senderId === me;
          return (
            <View
              key={m.id}
              style={{
                alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', marginBottom: 8,
                backgroundColor: mine ? colors.primary : colors.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 9,
                borderWidth: mine ? 0 : 1, borderColor: colors.border,
              }}
            >
              <Text style={{ color: mine ? '#fff' : colors.text, fontSize: 15 }}>{m.body}</Text>
              <Text style={{ color: mine ? '#ffffffb0' : colors.muted, fontSize: 11, marginTop: 3, alignSelf: 'flex-end' }}>
                {new Date(m.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <View style={{ paddingHorizontal: 12 }}><ErrorText>{error}</ErrorText></View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', padding: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Write a message"
          placeholderTextColor={colors.muted}
          multiline
          maxLength={2000}
          onKeyPress={(e: any) => {
            // On the website, Enter sends and Shift+Enter adds a new line.
            if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) { e.preventDefault(); send(); }
          }}
          style={[styles.input, { flex: 1, maxHeight: 120, paddingVertical: 10 }]}
        />
        <Pressable
          onPress={send}
          disabled={!text.trim() || busy}
          accessibilityRole="button"
          accessibilityLabel="Send"
          style={{ marginLeft: 8, backgroundColor: colors.primary, opacity: !text.trim() || busy ? 0.4 : 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
