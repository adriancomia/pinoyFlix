import { useEffect, useState, useRef } from 'react';
import {
  View, Text, ScrollView, Image, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { getTrendingMovies, getPopularMovies, getTopRatedMovies, getPopularSeries, IMG_BASE, IMG_ORIGINAL } from '../services/tmdb';
import { getTopAnime } from '../services/jikan';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width < 768 ? width * 0.38 : 180;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export default function HomeScreen() {
  const router = useRouter();
  const [hero, setHero] = useState(null);
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [series, setSeries] = useState([]);
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const heroTimer = useRef(null);

  useEffect(() => {
    loadAll();
    return () => clearInterval(heroTimer.current);
  }, []);

  useEffect(() => {
    if (trending.length === 0) return;
    heroTimer.current = setInterval(() => {
      setHeroIndex((i) => (i + 1) % Math.min(5, trending.length));
    }, 5000);
    return () => clearInterval(heroTimer.current);
  }, [trending]);

  const loadAll = async () => {
    try {
      const [trendRes, popRes, seriesRes, animeRes] = await Promise.all([
        getTrendingMovies(),
        getPopularMovies(),
        getPopularSeries(),
        getTopAnime(),
      ]);
      setTrending(trendRes.results || []);
      setPopular(popRes.results || []);
      setSeries(seriesRes.results || []);
      setAnime(animeRes.data || []);
      setHero((trendRes.results || [])[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const currentHero = trending[heroIndex];

  const goToDetail = (item, type) => {
    router.push({ pathname: '/content/[id]', params: { id: item.id, type } });
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Hero Banner ── */}
      {currentHero && (
        <TouchableOpacity activeOpacity={0.9} onPress={() => goToDetail(currentHero, 'movie')}>
          <View style={styles.hero}>
            <Image
              source={{ uri: IMG_ORIGINAL + currentHero.backdrop_path }}
              style={styles.heroImage}
              resizeMode="cover"
            />
            <View style={styles.heroOverlay} />
            <View style={styles.heroContent}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>TRENDING</Text>
              </View>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {currentHero.title || currentHero.name}
              </Text>
              <Text style={styles.heroMeta}>
                ⭐ {currentHero.vote_average?.toFixed(1)}  •  {(currentHero.release_date || '').slice(0, 4)}
              </Text>
              <Text style={styles.heroOverview} numberOfLines={2}>
                {currentHero.overview}
              </Text>
              <View style={styles.heroButtons}>
                <TouchableOpacity style={styles.playBtn} onPress={() => goToDetail(currentHero, 'movie')}>
                  <Text style={styles.playBtnText}>▶  Watch Now</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.infoBtn} onPress={() => goToDetail(currentHero, 'movie')}>
                  <Text style={styles.infoBtnText}>More Info</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Hero dots */}
            <View style={styles.heroDots}>
              {trending.slice(0, 5).map((_, i) => (
                <View key={i} style={[styles.dot, i === heroIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* ── Content Rows ── */}
      <View style={styles.rows}>
        <ContentRow title="🔥 Trending Movies" data={trending} type="movie" onPress={goToDetail} />
        <ContentRow title="🎬 Popular Movies" data={popular} type="movie" onPress={goToDetail} />
        <ContentRow title="📺 Popular Series" data={series} type="tv" onPress={goToDetail} />
        <AnimeRow title="🌸 Top Anime" data={anime} router={router} />
      </View>

    </ScrollView>
  );
}

// ── Reusable row for movies/series ──
function ContentRow({ title, data, type, onPress }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.md }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => onPress(item, type)} activeOpacity={0.8}>
            <Image
              source={{ uri: item.poster_path ? IMG_BASE + item.poster_path : 'https://via.placeholder.com/180x270' }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <View style={styles.cardRating}>
              <Text style={styles.cardRatingText}>⭐ {item.vote_average?.toFixed(1)}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title || item.name}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

// ── Anime row (Jikan data shape is different) ──
function AnimeRow({ title, data, router }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => String(item.mal_id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.md }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/content/[id]', params: { id: item.mal_id, type: 'anime' } })}
          >
            <Image
              source={{ uri: item.images?.jpg?.image_url }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <View style={styles.cardRating}>
              <Text style={styles.cardRatingText}>⭐ {item.score?.toFixed(1) || 'N/A'}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },

  // Hero
  hero: { width, height: height * 0.62, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    background: 'linear-gradient(to bottom, transparent 30%, #0a0a0f 100%)',
    backgroundColor: 'rgba(10,10,15,0.35)',
  },
  heroContent: {
    position: 'absolute', bottom: 48, left: SPACING.lg, right: SPACING.lg,
  },
  heroBadge: {
    backgroundColor: COLORS.primary, alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADIUS.sm, marginBottom: SPACING.sm,
  },
  heroBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  heroTitle: { color: COLORS.text, fontSize: 28, fontWeight: '800', marginBottom: 6 },
  heroMeta: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 8 },
  heroOverview: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20, marginBottom: SPACING.md },
  heroButtons: { flexDirection: 'row', gap: SPACING.sm },
  playBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.full, flexDirection: 'row', alignItems: 'center',
  },
  playBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  infoBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  infoBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  heroDots: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 6, left: 0, right: 0, justifyContent: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)' },
  dotActive: { width: 20, backgroundColor: COLORS.primary },

  // Rows
  rows: { paddingBottom: SPACING.xxl },
  row: { marginTop: SPACING.lg },
  rowTitle: { color: COLORS.text, fontSize: 17, fontWeight: '700', paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },

  // Cards
  card: { width: CARD_WIDTH, marginRight: SPACING.sm },
  cardImage: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: RADIUS.md, backgroundColor: COLORS.surface },
  cardRating: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)', paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  cardRatingText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  cardTitle: { color: COLORS.textSecondary, fontSize: 12, marginTop: 6, paddingHorizontal: 2 },
});