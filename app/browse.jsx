import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, Image,
  TouchableOpacity, StyleSheet, Dimensions,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { searchMulti, getTopRatedMovies, getTopRatedSeries, IMG_BASE } from '../services/tmdb';
import { searchAnime, getPopularAnime } from '../services/jikan';

const { width } = Dimensions.get('window');
const isWeb = width > 768;
const CARD_WIDTH = isWeb ? 180 : (width - SPACING.md * 3) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

const FILTERS = ['All', 'Movies', 'Series', 'Anime'];

const GENRES = [
  { label: '🔥 Action', query: 'action' },
  { label: '😂 Comedy', query: 'comedy' },
  { label: '💀 Horror', query: 'horror' },
  { label: '💕 Romance', query: 'romance' },
  { label: '🚀 Sci-Fi', query: 'sci-fi' },
  { label: '🕵️ Mystery', query: 'mystery' },
  { label: '🧸 Animation', query: 'animation' },
  { label: '📚 Drama', query: 'drama' },
];

export default function BrowseScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [results, setResults] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingDefault, setLoadingDefault] = useState(true);
  const [debounceTimer, setDebounceTimer] = useState(null);

  useEffect(() => {
    loadDefaults();
  }, []);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => handleSearch(query, filter), 500);
    setDebounceTimer(timer);
    return () => clearTimeout(timer);
  }, [query, filter]);

  const loadDefaults = async () => {
    setLoadingDefault(true);
    try {
      const [movRes, serRes] = await Promise.all([
        getTopRatedMovies(),
        getTopRatedSeries(),
      ]);
      const combined = [
        ...(movRes.results || []).map((m) => ({ ...m, _type: 'movie' })),
        ...(serRes.results || []).map((s) => ({ ...s, _type: 'tv' })),
      ].sort(() => Math.random() - 0.5);
      setTrending(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDefault(false);
    }
  };

  const handleSearch = async (q, f) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      let items = [];
      if (f === 'Anime') {
        const res = await searchAnime(q);
        items = (res.data || []).map((a) => ({
          id: a.mal_id,
          title: a.title,
          poster_path: null,
          _animeImage: a.images?.jpg?.image_url,
          vote_average: a.score,
          _type: 'anime',
        }));
      } else if (f === 'Movies') {
        const res = await searchMulti(q);
        items = (res.results || [])
          .filter((r) => r.media_type === 'movie')
          .map((r) => ({ ...r, _type: 'movie' }));
      } else if (f === 'Series') {
        const res = await searchMulti(q);
        items = (res.results || [])
          .filter((r) => r.media_type === 'tv')
          .map((r) => ({ ...r, _type: 'tv' }));
      } else {
        // All — fetch TMDB + anime in parallel
        const [tmdbRes, animeRes] = await Promise.all([
          searchMulti(q),
          searchAnime(q),
        ]);
        const tmdb = (tmdbRes.results || [])
          .filter((r) => r.media_type === 'movie' || r.media_type === 'tv')
          .map((r) => ({ ...r, _type: r.media_type }));
        const anime = (animeRes.data || []).slice(0, 5).map((a) => ({
          id: a.mal_id,
          title: a.title,
          poster_path: null,
          _animeImage: a.images?.jpg?.image_url,
          vote_average: a.score,
          _type: 'anime',
        }));
        items = [...tmdb, ...anime];
      }
      setResults(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const goToDetail = (item) => {
    router.push({
      pathname: '/content/[id]',
      params: { id: item.id, type: item._type },
    });
  };

  const handleGenre = (genreQuery) => {
    setQuery(genreQuery);
    setFilter('All');
  };

  const displayData = query.trim() ? results : trending;

  return (
  <View style={styles.container}>
    <View style={styles.inner}>

      {/* ── Search bar ── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search movies, anime, series..."
            placeholderTextColor={COLORS.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResults([]); }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Filter pills ── */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterPill, filter === f && styles.filterPillActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </View>

    <FlatList
  data={displayData}
  keyExtractor={(item, i) => `${item.id}_${i}`}
  numColumns={isWeb ? 5 : 2}
  key={isWeb ? 'web' : 'mobile'}
  columnWrapperStyle={styles.columnWrapper}
  contentContainerStyle={styles.grid}
  showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <>
          {!query.trim() && (
            <View style={styles.genreSection}>
              <Text style={styles.sectionTitle}>Browse by Genre</Text>
              <View style={styles.genreWrap}>
                {GENRES.map((g) => (
                  <TouchableOpacity
                    key={g.query}
                    style={styles.genreChip}
                    onPress={() => handleGenre(g.query)}
                  >
                    <Text style={styles.genreChipText}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <View style={styles.resultsHeader}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={styles.resultsCount}>
                {query.trim()
                  ? `${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`
                  : 'Top Rated'}
              </Text>
            )}
          </View>
        </>
      }
      ListEmptyComponent={
        !loading && query.trim() ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎬</Text>
            <Text style={styles.emptyText}>No results found</Text>
            <Text style={styles.emptySub}>Try a different search or filter</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.card}
          onPress={() => goToDetail(item)}
          activeOpacity={0.8}
        >
          <Image
            source={{
              uri: item._animeImage ||
                (item.poster_path ? IMG_BASE + item.poster_path : 'https://via.placeholder.com/160x240'),
            }}
            style={styles.cardImage}
            resizeMode="cover"
          />
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{item._type?.toUpperCase()}</Text>
          </View>
          {item.vote_average ? (
            <View style={styles.cardRating}>
              <Text style={styles.cardRatingText}>⭐ {Number(item.vote_average).toFixed(1)}</Text>
            </View>
          ) : null}
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title || item.name}
          </Text>
        </TouchableOpacity>
      )}
    />
  </View>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  inner: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },

  // Search
  searchWrap: { marginBottom: SPACING.sm },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderWidth: 0.5, borderColor: COLORS.border, gap: SPACING.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
  clearBtn: { color: COLORS.textMuted, fontSize: 14, paddingHorizontal: 4 },

  // Filters
  filterRow: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingBottom: SPACING.sm, justifyContent: 'center',
  },
  filterPill: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs + 2,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surface,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  filterPillActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#fff' },

  // Genre chips
  genreSection: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: '700', marginBottom: SPACING.sm },
  genreWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  genreChip: {
    backgroundColor: COLORS.surfaceLight, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderWidth: 0.5, borderColor: COLORS.border,
  },
  genreChipText: { color: COLORS.text, fontSize: 13, fontWeight: '500' },

  // Results
  resultsHeader: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    minHeight: 32, justifyContent: 'center',
  },
  resultsCount: { color: COLORS.textSecondary, fontSize: 13 },

  // Grid — centered with max width
  grid: {
    paddingBottom: SPACING.xxl,
    alignSelf: 'center',
    width: '100%',
    maxWidth: isWeb ? 1100 : '100%',
    paddingHorizontal: SPACING.md,
  },
  columnWrapper: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
    justifyContent: 'center',  // ← this centers the row
  },

  // Cards
  card: { width: CARD_WIDTH },
  cardImage: {
    width: CARD_WIDTH, height: CARD_HEIGHT,
    borderRadius: RADIUS.md, backgroundColor: COLORS.surface,
  },
  cardBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  cardBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  cardRating: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  cardRatingText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  cardTitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6, paddingHorizontal: 2 },

  // Empty
  empty: { alignItems: 'center', paddingVertical: SPACING.xxl },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { color: COLORS.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptySub: { color: COLORS.textMuted, fontSize: 13 },
});
