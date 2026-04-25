import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password || !confirm) {
      setError('Please fill in all fields.'); return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.'); return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
      router.replace('/');
    } catch (e) {
      setError(friendlyError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text style={styles.logo}>🎬 PinoyFlix</Text>
        <Text style={styles.tagline}>Join for free. Watch everything.</Text>

        <View style={styles.card}>
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.sub}>It's free and always will be.</Text>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={COLORS.textMuted}
            value={displayName}
            onChangeText={setDisplayName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor={COLORS.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passWrap}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Min. 6 characters"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Repeat password"
            placeholderTextColor={COLORS.textMuted}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPass}
          />

          {/* Password strength indicator */}
          <PasswordStrength password={password} />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestBtn} onPress={() => router.replace('/')}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.footerLink}>Sign In</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordStrength({ password }) {
  const getStrength = () => {
    if (!password) return { level: 0, label: '', color: 'transparent' };
    if (password.length < 6) return { level: 1, label: 'Weak', color: COLORS.primary };
    if (password.length < 10) return { level: 2, label: 'Fair', color: COLORS.accent };
    return { level: 3, label: 'Strong', color: COLORS.success };
  };
  const { level, label, color } = getStrength();
  if (!password) return null;
  return (
    <View style={{ marginBottom: SPACING.sm }}>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            backgroundColor: i <= level ? color : COLORS.border,
          }} />
        ))}
      </View>
      <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const friendlyError = (code) => {
  switch (code) {
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/weak-password': return 'Password must be at least 6 characters.';
    default: return 'Something went wrong. Please try again.';
  }
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  logo: { color: COLORS.text, fontSize: 32, fontWeight: '800', marginBottom: 4 },
  tagline: { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.xl },
  card: {
    width: '100%', maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg, padding: SPACING.xl,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  heading: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  sub: { color: COLORS.textSecondary, fontSize: 13, marginBottom: SPACING.lg },
  errorBox: {
    backgroundColor: 'rgba(229,9,20,0.12)', borderWidth: 0.5,
    borderColor: COLORS.primary, borderRadius: RADIUS.sm,
    padding: SPACING.sm, marginBottom: SPACING.md,
  },
  errorText: { color: COLORS.primary, fontSize: 13 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: SPACING.sm },
  input: {
    backgroundColor: COLORS.surfaceLight, color: COLORS.text,
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2, fontSize: 14, marginBottom: SPACING.sm,
  },
  passWrap: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  eyeBtn: { padding: SPACING.sm, marginLeft: SPACING.xs },
  eyeText: { fontSize: 16 },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.md,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  guestBtn: {
    borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm + 2, alignItems: 'center', marginTop: SPACING.sm,
  },
  guestText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  footer: { flexDirection: 'row', marginTop: SPACING.lg },
  footerText: { color: COLORS.textMuted, fontSize: 13 },
  footerLink: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});