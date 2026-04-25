import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
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

        {/* Logo */}
        <Text style={styles.logo}>🎬 PinoyFlix</Text>
        <Text style={styles.tagline}>Stream anything, anytime.</Text>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.sub}>Sign in to your account</Text>

          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

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
              placeholder="••••••••"
              placeholderTextColor={COLORS.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Text style={styles.eyeText}>{showPass ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Sign In</Text>}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.guestBtn} onPress={() => router.replace('/')}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.footerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const friendlyError = (code) => {
  switch (code) {
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password': return 'Incorrect password. Try again.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    case 'auth/invalid-credential': return 'Invalid email or password.';
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.md },
  divider: { flex: 1, height: 0.5, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, fontSize: 12, marginHorizontal: SPACING.sm },
  guestBtn: {
    borderWidth: 0.5, borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm + 2, alignItems: 'center',
  },
  guestText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  footer: { flexDirection: 'row', marginTop: SPACING.lg },
  footerText: { color: COLORS.textMuted, fontSize: 13 },
  footerLink: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
});