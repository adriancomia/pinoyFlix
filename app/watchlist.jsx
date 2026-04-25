import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useBookmarks } from '../hooks/useBookmarks';
import { useAuth } from '../context/AuthContext';
import { COLORS, SPACING, RADIUS } from '../constants/theme';

export default function WatchlistScreen() {
  const { user } = useAuth();
  const { bookmarks, removeBookmark } = useBookmarks();
  const router = useRouter();

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockTitle}>Sign in to view your Watchlist</Text>
        <Text style={styles.lockSub}>Save movies, anime and series to watch later.</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.signInText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.lockIcon}>🔖</Text>
        <Text style={styles.lockTitle}>Your watchlist is empty</Text>
        <Text style={styles.lockSub}>Tap "+ Watchlist" on any title to save it here.</Text>
        <TouchableOpacity style={styles.signInBtn} onPress={() => router.push('/')}>
          <Text style={styles.signInText}>Browse Content</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>🔖 My Watchlist</Text>
      <Text style={styles.sub}>{bookmarks.length} saved title{bookmarks.length !== 1 ? 's' : ''}</Text>
      <FlatList
  data={bookmarks}
  keyExtractor={(item) => item.contentId}
  numColumns={3}
  columnWrapperStyle={styles.row}
  contentContainerStyle={styles.grid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/content/[id]', params: { id: item.contentId, type: item.type } })}
          >
            <Image
              source={{ uri: item.poster || 'https://via.placeholder.com/160x240' }}
              style={styles.poster}
              resizeMode="cover"
            />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeBookmark(item.contentId)}
            >
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardMetaText}>⭐ {item.rating}</Text>
                {item.year ? <Text style={styles.cardMetaText}>• {item.year}</Text> : null}
              </View>
              <View style={styles.typePill}>
                <Text style={styles.typePillText}>{item.type?.toUpperCase()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
    padding: SPACING.xl,
  },
  lockIcon: { fontSize: 48, marginBottom: SPACING.md },
  lockTitle: { color: COLORS.text, fontSize: 18, fontWeight: '700', marginBottom: SPACING.sm, textAlign: 'center' },
  lockSub: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', marginBottom: SPACING.lg },
  signInBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm + 2,
  },
  signInText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  heading: { color: COLORS.text, fontSize: 22, fontWeight: '800', padding: SPACING.lg, paddingBottom: 4 },
  sub: { color: COLORS.textMuted, fontSize: 13, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
grid: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  row: { gap: SPACING.sm, justifyContent: 'flex-start' },
  card: {
    width: '31%',
    marginBottom: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  poster: { width: '100%', aspectRatio: 2 / 3 },
  removeBtn: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: 'rgba(0,0,0,0.7)',
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  cardInfo: { padding: SPACING.xs + 2 },
  cardTitle: { color: COLORS.text, fontSize: 11, fontWeight: '600', marginBottom: 3 },
  cardMeta: { flexDirection: 'row', gap: 4, marginBottom: 4 },
  cardMetaText: { color: COLORS.textMuted, fontSize: 10 },
  typePill: {
    backgroundColor: COLORS.surfaceLight, alignSelf: 'flex-start',
    paddingHorizontal: 5, paddingVertical: 1, borderRadius: RADIUS.sm,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  typePillText: { color: COLORS.textSecondary, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },});