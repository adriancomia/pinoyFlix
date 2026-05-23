import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, Image, TextInput,
  ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { db, auth } from '../services/firebase';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import {
  updateProfile, updateEmail,
  updatePassword, deleteUser,
  EmailAuthProvider, reauthenticateWithCredential,
} from 'firebase/auth';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { bookmarks } = useBookmarks();
  const { history } = useWatchHistory();
  const router = useRouter();

  const [tab, setTab] = useState('overview');

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={s.lockTitle}>You're not signed in</Text>
        <Text style={s.lockSub}>Sign in to access your profile, watchlist and history.</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.push('/(auth)/login')}>
          <Text style={s.btnText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnOutline} onPress={() => router.push('/(auth)/register')}>
          <Text style={s.btnOutlineText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <View style={s.inner}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>
              {user.displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <View style={s.headerInfo}>
            <Text style={s.displayName}>{user.displayName || 'No name set'}</Text>
            <Text style={s.email}>{user.email}</Text>
          </View>
        </View>

        {/* ── Stats ── */}
        <View style={s.stats}>
          <StatCard label="Watchlist" value={bookmarks.length} />
          <StatCard label="Watched" value={history.length}  />
        </View>

        {/* ── Tabs ── */}
        <View style={s.tabs}>
          {['overview', 'edit', 'security', 'danger'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[s.tabBtn, tab === t && s.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === 'overview' ? 'Overview'
                  : t === 'edit' ? 'Edit Profile'
                  : t === 'security' ? 'Security'
                  : ' Danger Zone'}
              </Text>
              {tab === t && <View style={s.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        {tab === 'overview' && <OverviewTab bookmarks={bookmarks} history={history} router={router} onLogout={handleLogout} />}
        {tab === 'edit' && <EditTab user={user} />}
        {tab === 'security' && <SecurityTab user={user} />}
        {tab === 'danger' && <DangerTab user={user} router={router} />}

      </View>
    </ScrollView>
  );
}

// ── Overview tab ──
function OverviewTab({ bookmarks, history, router, onLogout }) {
  return (
    <View>
      {bookmarks.length > 0 && (
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>My Watchlist</Text>
            <TouchableOpacity onPress={() => router.push('/watchlist')}>
              <Text style={s.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={bookmarks.slice(0, 8)}
            keyExtractor={(item) => item.contentId}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={s.bookmarkCard}
                onPress={() => router.push({
                  pathname: '/content/[id]',
                  params: { id: item.contentId, type: item.type },
                })}
              >
                <Image source={{ uri: item.poster }} style={s.bookmarkPoster} resizeMode="cover" />
                <Text style={s.bookmarkTitle} numberOfLines={1}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <View style={s.section}>
        <View style={s.actionList}>
          <ActionRow label="Sign Out" onPress={onLogout} danger />
        </View>
      </View>
    </View>
  );
}

// ── Edit Profile tab ──
function EditTab({ user }) {
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [email, setEmail] = useState(user.email || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      if (displayName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName });
        await updateDoc(doc(db, 'users', user.uid), { displayName });
      }
      if (email !== user.email) {
        await updateEmail(auth.currentUser, email);
        await updateDoc(doc(db, 'users', user.uid), { email });
      }
      setSuccess('Profile updated successfully!');
    } catch (e) {
      setError(e.message || 'Failed to update. You may need to re-login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Edit Profile</Text>

      {success ? <View style={s.successBox}><Text style={s.successText}>{success}</Text></View> : null}
      {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

      <Text style={s.fieldLabel}>Display Name</Text>
      <TextInput
        style={s.fieldInput}
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
        placeholderTextColor={COLORS.textMuted}
      />

      <Text style={s.fieldLabel}>Email Address</Text>
      <TextInput
        style={s.fieldInput}
        value={email}
        onChangeText={setEmail}
        placeholder="your@email.com"
        placeholderTextColor={COLORS.textMuted}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={s.fieldNote}>
        Note: Changing your email requires recent login. If it fails, sign out and sign back in first.
      </Text>

      <TouchableOpacity
        style={[s.saveBtn, loading && { opacity: 0.6 }]}
        onPress={handleSave}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.saveBtnText}>Save Changes</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ── Security tab ──
function SecurityTab({ user }) {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async () => {
    if (!currentPass || !newPass || !confirmPass) {
      setError('Please fill in all fields.'); return;
    }
    if (newPass !== confirmPass) {
      setError('New passwords do not match.'); return;
    }
    if (newPass.length < 6) {
      setError('Password must be at least 6 characters.'); return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPass);
      setSuccess('Password changed successfully!');
      setCurrentPass(''); setNewPass(''); setConfirmPass('');
    } catch (e) {
      setError(e.code === 'auth/wrong-password'
        ? 'Current password is incorrect.'
        : 'Failed to change password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Change Password</Text>

      {success ? <View style={s.successBox}><Text style={s.successText}>{success}</Text></View> : null}
      {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

      <Text style={s.fieldLabel}>Current Password</Text>
      <TextInput
        style={s.fieldInput}
        value={currentPass}
        onChangeText={setCurrentPass}
        placeholder="••••••••"
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry
      />

      <Text style={s.fieldLabel}>New Password</Text>
      <TextInput
        style={s.fieldInput}
        value={newPass}
        onChangeText={setNewPass}
        placeholder="Min. 6 characters"
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry
      />

      <Text style={s.fieldLabel}>Confirm New Password</Text>
      <TextInput
        style={s.fieldInput}
        value={confirmPass}
        onChangeText={setConfirmPass}
        placeholder="Repeat new password"
        placeholderTextColor={COLORS.textMuted}
        secureTextEntry
      />

      <TouchableOpacity
        style={[s.saveBtn, loading && { opacity: 0.6 }]}
        onPress={handleChangePassword}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={s.saveBtnText}>Change Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

// ── Danger Zone tab ──
function DangerTab({ user, router }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirm, setConfirm] = useState(false);

  const handleDelete = async () => {
    if (!password) { setError('Please enter your password to confirm.'); return; }
    setLoading(true);
    setError('');
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await deleteDoc(doc(db, 'users', user.uid));
      await deleteUser(auth.currentUser);
      router.replace('/');
    } catch (e) {
      setError(e.code === 'auth/wrong-password'
        ? 'Incorrect password.'
        : 'Failed to delete account. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.section}>
      <View style={s.dangerCard}>
        <Text style={s.dangerTitle}> Delete Account</Text>
        <Text style={s.dangerSub}>
          This will permanently delete your account, bookmarks, and all data. This cannot be undone.
        </Text>

        {!confirm ? (
          <TouchableOpacity style={s.dangerBtn} onPress={() => setConfirm(true)}>
            <Text style={s.dangerBtnText}>Delete My Account</Text>
          </TouchableOpacity>
        ) : (
          <View>
            {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}
            <Text style={s.fieldLabel}>Enter your password to confirm</Text>
            <TextInput
              style={s.fieldInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md }}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setConfirm(false); setError(''); }}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.dangerBtn, { flex: 1 }, loading && { opacity: 0.6 }]}
                onPress={handleDelete}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.dangerBtnText}>Confirm Delete</Text>}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <View style={s.statCard}>
      <Text style={s.statIcon}>{icon}</Text>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function ActionRow({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={s.actionRow} onPress={onPress}>
      <Text style={s.actionIcon}>{icon}</Text>
      <Text style={[s.actionLabel, danger && { color: COLORS.primary }]}>{label}</Text>
      <Text style={s.actionChevron}>›</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: {
    maxWidth: 900,
    alignSelf: 'center',
    width: '100%',
    padding: SPACING.lg,
  },
  center: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
    padding: SPACING.xl, maxWidth: 480,
    alignSelf: 'center', width: '100%',
  },
  lockIcon: { fontSize: 48, marginBottom: SPACING.md },
  lockTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: SPACING.sm, textAlign: 'center' },
  lockSub: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginBottom: SPACING.lg },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.sm, width: '100%', maxWidth: 320, alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnOutline: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm + 2,
    width: '100%', maxWidth: 320, alignItems: 'center',
  },
  btnOutlineText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.lg, paddingVertical: SPACING.lg,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  headerInfo: { flex: 1 },
  displayName: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  email: { color: COLORS.textMuted, fontSize: 13, marginBottom: 8 },
  freeBadge: {
    backgroundColor: COLORS.surfaceLight, alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADIUS.xs, borderWidth: 0.5, borderColor: COLORS.border,
  },
  freeBadgeText: { color: COLORS.textSecondary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  // Stats
  stats: {
    flexDirection: 'row', gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, padding: SPACING.md,
    alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { color: COLORS.text, fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: COLORS.textMuted, fontSize: 11 },

  // Tabs
  tabs: {
    flexDirection: 'row', borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border, marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  tabBtn: { paddingBottom: SPACING.sm, alignItems: 'center', marginRight: SPACING.md },
  tabBtnActive: {},
  tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: COLORS.text },
  tabUnderline: { height: 2, width: '100%', backgroundColor: COLORS.primary, borderRadius: 2, marginTop: 4 },

  // Section
  section: { marginBottom: SPACING.xl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: SPACING.md },
  seeAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  // Bookmarks
  bookmarkCard: { width: 90, marginRight: SPACING.sm },
  bookmarkPoster: { width: 90, height: 135, borderRadius: RADIUS.sm, backgroundColor: COLORS.surface, marginBottom: 6 },
  bookmarkTitle: { color: COLORS.textSecondary, fontSize: 11 },

  // Actions
  actionList: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 0.5, borderColor: COLORS.border, overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, gap: SPACING.md,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  actionIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  actionLabel: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '500' },
  actionChevron: { color: COLORS.textMuted, fontSize: 20 },

  // Form fields
  fieldLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: SPACING.md },
  fieldInput: {
    backgroundColor: COLORS.surfaceLight, color: COLORS.text,
    borderWidth: 0.5, borderColor: COLORS.border,
    borderRadius: RADIUS.md, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2, fontSize: 14,
  },
  fieldNote: { color: COLORS.textMuted, fontSize: 11, marginTop: SPACING.sm, lineHeight: 16 },
  saveBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.md, alignItems: 'center', marginTop: SPACING.lg,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // Feedback
  successBox: {
    backgroundColor: 'rgba(70,211,105,0.12)', borderWidth: 0.5,
    borderColor: COLORS.success, borderRadius: RADIUS.sm,
    padding: SPACING.sm, marginBottom: SPACING.sm,
  },
  successText: { color: COLORS.success, fontSize: 13 },
  errorBox: {
    backgroundColor: 'rgba(229,9,20,0.12)', borderWidth: 0.5,
    borderColor: COLORS.primary, borderRadius: RADIUS.sm,
    padding: SPACING.sm, marginBottom: SPACING.sm,
  },
  errorText: { color: COLORS.primary, fontSize: 13 },

  // Danger
  dangerCard: {
    backgroundColor: 'rgba(229,9,20,0.06)',
    borderWidth: 0.5, borderColor: 'rgba(229,9,20,0.3)',
    borderRadius: RADIUS.md, padding: SPACING.lg,
  },
  dangerTitle: { color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: SPACING.sm },
  dangerSub: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: SPACING.lg },
  dangerBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm + 2, alignItems: 'center',
  },
  dangerBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.sm, paddingVertical: SPACING.sm + 2, alignItems: 'center',
  },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
});