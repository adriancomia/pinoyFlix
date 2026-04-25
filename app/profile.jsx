import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, FlatList, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useBookmarks } from '../hooks/useBookmarks';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { bookmarks } = useBookmarks();
  const { history } = useWatchHistory();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.lockIcon}>👤</Text>
        <Text style={styles.lockTitle}>You're not signed in</Text>
        <Text style={styles.lockSub}>Sign in to access your profile, watchlist and history.</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnOutline} onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.btnOutlineText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.displayName?.charAt(0).toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>

      {/* ── Stats ── */}
      <View style={styles.stats}>
        <StatCard label="Watchlist" value={bookmarks.length} icon="🔖" />
        <StatCard label="Watched" value={history.length} icon="▶️" />
        <StatCard label="Member" value="Free" icon="⭐" />
      </View>

      {/* ── Recent history ── */}
      {history.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>▶️ Recently Watched</Text>
            <TouchableOpacity onPress={() => router.push('/watchlist')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={history.slice(0, 10)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.historyCard}
                onPress={() => router.push({
                  pathname: '/content/[id]',
                  params: { id: item.contentId, type: item.contentType },
                })}
              >
                <View style={styles.historyIconWrap}>
                  <Text style={styles.historyIcon}>
                    {item.contentType === 'anime' ? '🌸' : item.contentType === 'tv' ? '📺' : '🎬'}
                  </Text>
                </View>
                <Text style={styles.historyType}>{item.contentType?.toUpperCase()}</Text>
                <Text style={styles.historyId} numberOfLines={1}>ID: {item.contentId}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── Watchlist preview ── */}
      {bookmarks.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔖 My Watchlist</Text>
            <TouchableOpacity onPress={() => router.push('/watchlist')}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={bookmarks.slice(0, 8)}
            keyExtractor={(item) => item.contentId}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.bookmarkCard}
                onPress={() => router.push({
                  pathname: '/content/[id]',
                  params: { id: item.contentId, type: item.type },
                })}
              >
                <Image
                  source={{ uri: item.poster || 'https://via.placeholder.com/90x135' }}
                  style={styles.bookmarkPoster}
                  resizeMode="cover"
                />
                <Text style={styles.bookmarkTitle} numberOfLines={1}>{item.title}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* ── Account actions ── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚙️ Account</Text>
        <View style={styles.actionList}>
          <ActionRow icon="🔖" label="My Watchlist" onPress={() => router.push('/watchlist')} />
          <ActionRow icon="🔒" label="Change Password" onPress={() => {}} />
          <ActionRow icon="🚪" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </View>

    </ScrollView>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ActionRow({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionLabel, danger && { color: COLORS.primary }]}>{label}</Text>
      <Text style={styles.actionChevron}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', padding: SPACING.xl,
  },
  lockIcon: { fontSize: 48, marginBottom: SPACING.md },
  lockTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: SPACING.sm, textAlign: 'center' },
  lockSub: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginBottom: SPACING.lg },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm + 2,
    marginBottom: SPACING.sm, width: '100%', alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnOutline: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm + 2,
    width: '100%', alignItems: 'center',
  },
  btnOutlineText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.md, padding: SPACING.lg,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  headerInfo: { flex: 1 },
  displayName: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 4 },
  email: { color: COLORS.textMuted, fontSize: 13 },

  // Stats
  stats: {
    flexDirection: 'row', padding: SPACING.lg,
    gap: SPACING.sm, borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, padding: SPACING.md,
    alignItems: 'center', borderWidth: 0.5, borderColor: COLORS.border,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: COLORS.textMuted, fontSize: 11 },

  // Section
  section: { marginTop: SPACING.lg, paddingBottom: SPACING.sm },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm,
  },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700' },
  seeAll: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  // History
  historyCard: {
    width: 90, marginRight: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.sm, alignItems: 'center',
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  historyIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  historyIcon: { fontSize: 22 },
  historyType: { color: COLORS.primary, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  historyId: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },

  // Bookmarks
  bookmarkCard: { width: 90, marginRight: SPACING.sm },
  bookmarkPoster: {
    width: 90, height: 135, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface, marginBottom: 6,
  },
  bookmarkTitle: { color: COLORS.textSecondary, fontSize: 11 },

  // Actions
  actionList: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md, borderWidth: 0.5, borderColor: COLORS.border,
    overflow: 'hidden',
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: SPACING.md, gap: SPACING.md,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
  },
  actionIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  actionLabel: { flex: 1, color: COLORS.text, fontSize: 14, fontWeight: '500' },
  actionChevron: { color: COLORS.textMuted, fontSize: 20 },
});