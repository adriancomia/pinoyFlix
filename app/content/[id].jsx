import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { getMovieDetails, getSeriesDetails, IMG_ORIGINAL, IMG_BASE } from '../../services/tmdb';
import { getAnimeDetails } from '../../services/jikan';
import CommentSection from '../../components/CommentSection';
import { useBookmarks } from '../../hooks/useBookmarks';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

export default function DetailScreen() {
  const { id, type } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('about');

  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const bookmarked = data ? isBookmarked(String(id)) : false;

  const toggleBookmark = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (bookmarked) {
      await removeBookmark(String(id));
    } else {
      await addBookmark({
        contentId: String(id),
        type,
        title: data.title,
        poster: data.poster,
        rating: data.rating,
        year: data.year,
      });
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id, type]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      if (type === 'anime') {
        const res = await getAnimeDetails(id);
        setData(normalizeAnime(res.data));
      } else if (type === 'tv') {
        const res = await getSeriesDetails(id);
        setData(normalizeTMDB(res, 'tv'));
      } else {
        const res = await getMovieDetails(id);
        setData(normalizeTMDB(res, 'movie'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: COLORS.textSecondary }}>Content not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Backdrop ── */}
      <View style={styles.backdropWrap}>
        <Image source={{ uri: data.backdrop }} style={styles.backdrop} resizeMode="cover" />
        <View style={styles.backdropOverlay} />
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* ── Main info ── */}
      <View style={styles.main}>
        <View style={styles.infoRow}>

          {/* Poster */}
          <Image source={{ uri: data.poster }} style={styles.poster} resizeMode="cover" />

          {/* Text info */}
          <View style={styles.infoText}>
            <View style={styles.badges}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{type?.toUpperCase()}</Text>
              </View>
              {data.genres?.slice(0, 2).map((g) => (
                <View key={g} style={styles.genreBadge}>
                  <Text style={styles.genreBadgeText}>{g}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.title}>{data.title}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaItem}>⭐ {data.rating}</Text>
              {data.year ? <Text style={styles.metaDot}>•</Text> : null}
              {data.year ? <Text style={styles.metaItem}>{data.year}</Text> : null}
              {data.episodes ? <Text style={styles.metaDot}>•</Text> : null}
              {data.episodes ? <Text style={styles.metaItem}>{data.episodes} eps</Text> : null}
              {data.runtime ? <Text style={styles.metaDot}>•</Text> : null}
              {data.runtime ? <Text style={styles.metaItem}>{data.runtime}</Text> : null}
            </View>

            {/* Watch + Bookmark buttons */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' }}>
              <TouchableOpacity
                style={styles.watchBtn}
                onPress={() => router.push({ pathname: '/content/watch/[id]', params: { id, type } })}
              >
                <Text style={styles.watchBtnText}>▶  Watch Now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
                onPress={toggleBookmark}
              >
                <Text style={styles.bookmarkBtnText}>
                  {bookmarked ? '🔖 Saved' : '+ Watchlist'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.tabs}>
          {['about', 'cast', 'comments'].map((t) => (
            <TouchableOpacity key={t} style={styles.tabBtn} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
              {tab === t && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Tab content ── */}
        {tab === 'about' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Synopsis</Text>
            <Text style={styles.overview}>{data.overview}</Text>

            {data.studios?.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Studios</Text>
                <Text style={styles.metaItem}>{data.studios.join(', ')}</Text>
              </>
            )}

            {data.status && (
              <>
                <Text style={styles.sectionTitle}>Status</Text>
                <Text style={styles.metaItem}>{data.status}</Text>
              </>
            )}
          </View>
        )}

        {tab === 'cast' && (
          <View style={styles.section}>
            {data.cast?.length > 0 ? (
              <FlatList
                data={data.cast}
                keyExtractor={(item, i) => String(i)}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => <CastCard item={item} />}
              />
            ) : (
              <Text style={styles.emptyText}>No cast info available.</Text>
            )}
          </View>
        )}

        {tab === 'comments' && (
          <View style={styles.section}>
            <CommentSection contentId={`${type}_${id}`} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ── Cast card ──
function CastCard({ item }) {
  return (
    <View style={styles.castCard}>
      <Image
        source={{ uri: item.photo || 'https://via.placeholder.com/80' }}
        style={styles.castPhoto}
        resizeMode="cover"
      />
      <Text style={styles.castName} numberOfLines={1}>{item.name}</Text>
      <Text style={styles.castRole} numberOfLines={1}>{item.role}</Text>
    </View>
  );
}

// ── Normalizers ──
function normalizeTMDB(d, type) {
  const trailer = d.videos?.results?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  );
  return {
    title: d.title || d.name,
    poster: d.poster_path ? IMG_BASE + d.poster_path : null,
    backdrop: d.backdrop_path ? IMG_ORIGINAL + d.backdrop_path : null,
    overview: d.overview,
    rating: d.vote_average?.toFixed(1),
    year: (d.release_date || d.first_air_date || '').slice(0, 4),
    genres: d.genres?.map((g) => g.name) || [],
    runtime: d.runtime ? `${d.runtime}m` : null,
    episodes: d.number_of_episodes || null,
    status: d.status,
    studios: d.production_companies?.map((c) => c.name).slice(0, 3) || [],
    trailerKey: trailer?.key || null,
    cast: d.credits?.cast?.slice(0, 15).map((c) => ({
      name: c.name,
      role: c.character,
      photo: c.profile_path ? IMG_BASE + c.profile_path : null,
    })) || [],
  };
}

function normalizeAnime(d) {
  return {
    title: d.title,
    poster: d.images?.jpg?.large_image_url,
    backdrop: d.images?.jpg?.large_image_url,
    overview: d.synopsis,
    rating: d.score?.toFixed(1) || 'N/A',
    year: d.year || d.aired?.prop?.from?.year,
    genres: d.genres?.map((g) => g.name) || [],
    episodes: d.episodes,
    runtime: d.duration,
    status: d.status,
    studios: d.studios?.map((s) => s.name) || [],
    trailerKey: d.trailer?.youtube_id || null,
    cast: d.characters?.slice(0, 15).map((c) => ({
      name: c.character?.name,
      role: c.role,
      photo: c.character?.images?.jpg?.image_url,
    })) || [],
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },

  backdropWrap: { width: '100%', height: 260, position: 'relative' },
  backdrop: { width: '100%', height: '100%' },
  backdropOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,15,0.5)',
  },
  backBtn: {
    position: 'absolute', top: SPACING.lg, left: SPACING.lg,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs, borderRadius: RADIUS.full,
  },
  backText: { color: COLORS.text, fontWeight: '600', fontSize: 14 },

  main: { padding: SPACING.lg },
  infoRow: { flexDirection: 'row', gap: SPACING.lg, marginBottom: SPACING.lg },
  poster: {
    width: isWeb ? 160 : 110,
    height: isWeb ? 240 : 165,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    marginTop: -60,
  },
  infoText: { flex: 1 },

  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm },
  typeBadge: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.sm,
    paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  typeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  genreBadge: {
    backgroundColor: COLORS.surfaceLight, paddingHorizontal: SPACING.sm,
    paddingVertical: 2, borderRadius: RADIUS.sm,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  genreBadgeText: { color: COLORS.textSecondary, fontSize: 10 },

  title: { color: COLORS.text, fontSize: isWeb ? 26 : 20, fontWeight: '800', marginBottom: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginBottom: SPACING.md },
  metaDot: { color: COLORS.textMuted, fontSize: 12 },
  metaItem: { color: COLORS.textSecondary, fontSize: 13 },

  watchBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg,
    alignSelf: 'flex-start',
  },
  watchBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  bookmarkBtn: {
    borderWidth: 1, borderColor: COLORS.border,
    borderRadius: RADIUS.full, paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  bookmarkBtnActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(245,166,35,0.12)',
  },
  bookmarkBtnText: { color: COLORS.text, fontWeight: '600', fontSize: 14 },

  tabs: {
    flexDirection: 'row', borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border, marginBottom: SPACING.lg,
  },
  tabBtn: { marginRight: SPACING.lg, paddingBottom: SPACING.sm, alignItems: 'center' },
  tabText: { color: COLORS.textMuted, fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: COLORS.text },
  tabUnderline: { height: 2, width: '100%', backgroundColor: COLORS.primary, borderRadius: 2, marginTop: 4 },

  section: { paddingBottom: SPACING.xl },
  sectionTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginTop: SPACING.md, marginBottom: 6 },
  overview: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  emptyText: { color: COLORS.textMuted, fontSize: 13 },

  castCard: { width: 80, marginRight: SPACING.md, alignItems: 'center' },
  castPhoto: { width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.surface, marginBottom: 6 },
  castName: { color: COLORS.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  castRole: { color: COLORS.textMuted, fontSize: 10, textAlign: 'center' },
});