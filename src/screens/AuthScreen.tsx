import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Field } from '../components/ui';
import { supabase } from '../supabase';
import { colors } from '../theme';
import { Role } from '../types';

type Mode = 'signIn' | 'signUp' | 'reset';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('signIn');
  const [role, setRole] = useState<Role>('owner');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const switchMode = (m: Mode) => { setMode(m); setError(null); setNotice(null); };

  const submit = async () => {
    setBusy(true); setError(null); setNotice(null);
    try {
      if (mode === 'signIn') {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else if (mode === 'signUp') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim(), role } },
        });
        if (error) throw error;
        if (!data.session) {
          setNotice(`We sent a confirmation link to ${email.trim()}. Open it, then sign in here.`);
          setMode('signIn');
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
        if (error) throw error;
        setNotice(`If ${email.trim()} has an account, a password reset link is on its way.`);
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const valid =
    /\S+@\S+\.\S+/.test(email) &&
    (mode === 'reset' || password.length >= 6) &&
    (mode !== 'signUp' || fullName.trim().length > 0);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Text style={s.logo}>🐾</Text>
        <Text style={s.title}>Pet Sitter Finder</Text>
        <Text style={s.subtitle}>Trusted people to care for your pets while you are away.</Text>

        {mode === 'signUp' && (
          <>
            <Text style={s.label}>I want to</Text>
            <View style={s.roles}>
              {([['owner', '🏠', 'Find a sitter'], ['sitter', '🤝', 'Pet sit']] as const).map(([r, emoji, label]) => (
                <Pressable
                  key={r}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: role === r }}
                  onPress={() => setRole(r)}
                  style={[s.role, role === r && s.roleSelected]}
                >
                  <Text style={{ fontSize: 26 }}>{emoji}</Text>
                  <Text style={[s.roleText, role === r && { color: colors.primary }]}>{label}</Text>
                </Pressable>
              ))}
            </View>
            <Field label="Your name" value={fullName} onChangeText={setFullName} placeholder="e.g. Octavian Popa" autoComplete="name" />
          </>
        )}

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        {mode !== 'reset' && (
          <Field
            label={mode === 'signUp' ? 'Password (at least 6 characters)' : 'Password'}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
            onSubmitEditing={() => valid && !busy && submit()}
          />
        )}

        {error && <Text style={s.error}>{error}</Text>}
        {notice && <Text style={s.notice}>{notice}</Text>}

        <Button
          title={busy ? 'Please wait…' : mode === 'signIn' ? 'Sign in' : mode === 'signUp' ? 'Create account' : 'Send reset link'}
          onPress={submit}
          disabled={!valid || busy}
        />

        <View style={s.links}>
          {mode === 'signIn' ? (
            <>
              <Pressable onPress={() => switchMode('signUp')}><Text style={s.link}>New here? Create an account</Text></Pressable>
              <Pressable onPress={() => switchMode('reset')}><Text style={[s.link, { color: colors.muted }]}>Forgot password?</Text></Pressable>
            </>
          ) : (
            <Pressable onPress={() => switchMode('signIn')}><Text style={s.link}>Already have an account? Sign in</Text></Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 56, textAlign: 'center' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: colors.text, marginTop: 6 },
  subtitle: { fontSize: 15, textAlign: 'center', color: colors.muted, marginTop: 6, marginBottom: 28 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 6, fontWeight: '600' },
  roles: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  role: {
    flex: 1, alignItems: 'center', padding: 14, borderRadius: 14, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: colors.card,
  },
  roleSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleText: { marginTop: 4, fontWeight: '700', color: colors.text },
  error: { color: colors.red, backgroundColor: colors.redSoft, padding: 12, borderRadius: 10, marginBottom: 12 },
  notice: { color: colors.green, backgroundColor: colors.greenSoft, padding: 12, borderRadius: 10, marginBottom: 12 },
  links: { alignItems: 'center', marginTop: 18, gap: 12 },
  link: { color: colors.primary, fontWeight: '600' },
});
