import React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { colors } from '../theme';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Button({
  title, onPress, variant = 'primary', disabled, style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? colors.redSoft : colors.card;
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? colors.red : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, selected && { backgroundColor: colors.primary, borderColor: colors.primary }]}
    >
      <Text style={[styles.chipText, selected && { color: '#fff' }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} {...props} style={[styles.input, props.multiline && { minHeight: 80, textAlignVertical: 'top' }]} />
    </View>
  );
}

export function Stepper({ value, onChange, min = 1, max = 60, format }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; format?: (v: number) => string;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.max(min, value - 1))}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue}>{format ? format(value) : value}</Text>
      <Pressable style={styles.stepBtn} onPress={() => onChange(Math.min(max, value + 1))}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string, string]> = {
    pending: [colors.amberSoft, colors.amber, 'Waiting for reply'],
    accepted: [colors.greenSoft, colors.green, 'Confirmed'],
    declined: [colors.redSoft, colors.red, 'Declined'],
    cancelled: ['#EEE', colors.muted, 'Cancelled'],
  };
  const [bg, fg, label] = map[status] ?? map.cancelled;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Empty({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={{ alignItems: 'center', padding: 40 }}>
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
      <Text style={{ color: colors.muted, marginTop: 8, textAlign: 'center' }}>{text}</Text>
    </View>
  );
}

// A round photo, or a fallback emoji / initials on a tinted circle.
export function Avatar({ url, fallback, size = 48 }: { url?: string | null; fallback: string; size?: number }) {
  const round = { width: size, height: size, borderRadius: size / 2 };
  if (url) return <Image source={{ uri: url }} style={[round, { backgroundColor: colors.border }]} accessibilityIgnoresInvertColors />;
  return (
    <View style={[round, { backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: size * 0.45, color: colors.primary, fontWeight: '700' }}>{fallback}</Text>
    </View>
  );
}

export const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('') || '🙂';

export function ErrorText({ children }: { children: React.ReactNode }) {
  return children ? <Text style={{ color: colors.red, marginBottom: 10 }}>{children}</Text> : null;
}

export const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  button: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: '600' },
  chip: {
    paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1,
    borderColor: colors.border, backgroundColor: colors.card, marginRight: 8, marginBottom: 8,
  },
  chipText: { color: colors.text, fontSize: 13 },
  label: { fontSize: 13, color: colors.muted, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.text,
  },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: {
    width: 38, height: 38, borderRadius: 19, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card,
  },
  stepBtnText: { fontSize: 20, color: colors.text },
  stepValue: { minWidth: 120, textAlign: 'center', fontSize: 15, fontWeight: '600', color: colors.text },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  section: { fontSize: 13, fontWeight: '700', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 18, marginBottom: 10 },
});
