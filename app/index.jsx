import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import {
  getTrendingMovies,
  getPopularMovies,
  getTopRatedMovies,
  getPopularSeries,
  IMG_BASE,
  IMG_ORIGINAL,
} from '../services/tmdb';
import { getTopAnime } from '../services/jikan';

const { width, height } = Dimensions.get('window');
const isWeb = width > 768;
const CARD_WIDTH = isWeb ? 200 : width * 0.36;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export default function HomeScreen() {
  const router = useRouter();

  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [series, setSeries] = useState([]);
  const [anime, setAnime] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const heroTimer = useRef(null);

  useEffect(() => {
    loadAll();
    return () => clearInterval(heroTimer.current);
  }, []);

  useEffect(() => {
    if (!trending.length) return;

    heroTimer.current = setInterval(() => {
      setHeroIndex((i) => (i + 1) % Math.min(5, trending.length));
    }, 6000);

    return () => clearInterval(heroTimer.current);
  }, [trending]);

  const loadAll = async () => {
    try {
      const [t, p, tr, s, a] = await Promise.all([
        getTrendingMovies(),
        getPopularMovies(),
        getTopRatedMovies(),
        getPopularSeries(),
        getTopAnime(),
      ]);

      setTrending(t.results || []);
      setPopular(p.results || []);
      setTopRated(tr.results || []);
      setSeries(s.results || []);
      setAnime(a.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const goToDetail = (item, type) =>
    router.push({
      pathname: '/content/[id]',
      params: { id: item.id, type },
    });

  if (loading) {
    return (
      <View style={s.loader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const hero = trending[heroIndex];

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {hero && (
        <View style={s.hero}>
          <Image
            source={{ uri: IMG_ORIGINAL + hero.backdrop_path }}
            style={s.heroImage}
            resizeMode="cover"
          />

          <View style={s.heroGrad1} />
          <View style={s.heroGrad2} />
          <View style={s.heroGrad3} />

          <View style={s.heroContent}>
            <View style={s.heroBadgeRow}>
              <View style={s.heroBadge}>
                <Text style={s.heroBadgeText}>N SERIES</Text>
              </View>

              <Text style={s.heroMetaText}>
                {(hero.release_date || '').slice(0, 4)}
              </Text>

              <View style={s.heroRatingPill}>
                <Text style={s.heroRatingText}>
                  {hero.vote_average?.toFixed(1)}
                </Text>
              </View>
            </View>

            <Text style={s.heroTitle} numberOfLines={2}>
              {hero.title || hero.name}
            </Text>

            <Text style={s.heroOverview} numberOfLines={3}>
              {hero.overview}
            </Text>

            <View style={s.heroButtons}>
              <TouchableOpacity
                style={s.playBtn}
                onPress={() =>
                  router.push({
                    pathname: '/content/watch/[id]',
                    params: { id: hero.id, type: 'movie' },
                  })
                }
              >
                <Text style={s.playBtnText}>Play</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.infoBtn}
                onPress={() => goToDetail(hero, 'movie')}
              >
                <Text style={s.infoBtnText}>More Info</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.dots}>
            {trending.slice(0, 5).map((_, i) => (
              <TouchableOpacity key={i} onPress={() => setHeroIndex(i)}>
                <View style={[s.dot, i === heroIndex && s.dotActive]} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={s.rows}>
        <Row
          title="Trending Now"
          data={trending}
          type="movie"
          onPress={goToDetail}
        />

        <Row
          title="Popular Movies"
          data={popular}
          type="movie"
          onPress={goToDetail}
        />

        <Row
          title="Top Rated"
          data={topRated}
          type="movie"
          onPress={goToDetail}
        />

        <Row
          title="Popular Series"
          data={series}
          type="tv"
          onPress={goToDetail}
        />

        <AnimeRow title="Top Anime" data={anime} router={router} />
      </View>
    </ScrollView>
  );
}

function Row({ title, data, type, onPress }) {
  return (
    <View style={s.row}>
      <Text style={s.rowTitle}>{title}</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => onPress(item, type)}
            activeOpacity={0.75}
          >
            <Image
              source={{
                uri: item.poster_path
                  ? IMG_BASE + item.poster_path
                  : 'https://via.placeholder.com/200x300',
              }}
              style={s.cardImg}
              resizeMode="cover"
            />

            <View style={s.cardOverlay}>
              <Text style={s.cardRating}>
                {item.vote_average?.toFixed(1)}
              </Text>
            </View>

            <View style={s.cardInfo}>
              <Text style={s.cardTitle} numberOfLines={1}>
                {item.title || item.name}
              </Text>

              <Text style={s.cardYear}>
                {(item.release_date || item.first_air_date || '').slice(0, 4)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function AnimeRow({ title, data, router }) {
  return (
    <View style={s.row}>
      <Text style={s.rowTitle}>{title}</Text>

      <FlatList
        data={data}
        keyExtractor={(item) => String(item.mal_id)}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            activeOpacity={0.75}
            onPress={() =>
              router.push({
                pathname: '/content/[id]',
                params: { id: item.mal_id, type: 'anime' },
              })
            }
          >
            <Image
              source={{ uri: item.images?.jpg?.image_url }}
              style={s.cardImg}
              resizeMode="cover"
            />

            <View style={s.cardOverlay}>
              <Text style={s.cardRating}>
                {item.score?.toFixed(1) || 'N/A'}
              </Text>
            </View>

            <View style={s.cardInfo}>
              <Text style={s.cardTitle} numberOfLines={1}>
                {item.title}
              </Text>

              <Text style={s.cardYear}>Anime</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loader: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },

  hero: {
    width: '100%',
    height: isWeb ? height * 0.78 : height * 0.6,
    position: 'relative',
  },

  heroImage: {
    width: '100%',
    height: '100%',
  },

  heroGrad1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  heroGrad2: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: 'rgba(20,20,20,0.85)',
  },

  heroGrad3: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '50%',
    backgroundColor: 'rgba(20,20,20,0.4)',
  },

  heroContent: {
    position: 'absolute',
    bottom: isWeb ? 80 : 40,
    left: isWeb ? SPACING.xxxl : SPACING.lg,
    right: isWeb ? '45%' : SPACING.lg,
  },

  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },

  heroBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },

  heroBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  heroMetaText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },

  heroRatingPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },

  heroRatingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  heroTitle: {
    color: '#fff',
    fontSize: isWeb ? 52 : 28,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: SPACING.sm,
    lineHeight: isWeb ? 58 : 34,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },

  heroOverview: {
    color: COLORS.textSecondary,
    fontSize: isWeb ? 15 : 13,
    lineHeight: isWeb ? 24 : 20,
    marginBottom: SPACING.lg,
    maxWidth: isWeb ? 480 : '100%',
  },

  heroButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },

  playBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },

  playBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },

  infoBtn: {
    backgroundColor: 'rgba(109,109,110,0.7)',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.sm,
  },

  infoBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  dots: {
    position: 'absolute',
    bottom: isWeb ? 40 : 16,
    left: isWeb ? SPACING.xxxl : SPACING.lg,
    flexDirection: 'row',
    gap: 6,
  },

  dot: {
    width: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },

  dotActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },

  rows: {
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxxl,
  },

  row: {
    marginBottom: SPACING.xl,
  },

  rowTitle: {
    color: '#fff',
    fontSize: isWeb ? 20 : 16,
    fontWeight: '700',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    letterSpacing: 0.3,
  },

  card: {
    width: CARD_WIDTH,
    marginRight: SPACING.sm,
  },

  cardImg: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surface,
  },

  cardOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },

  cardRating: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },

  cardInfo: {
    paddingTop: SPACING.xs + 2,
    paddingHorizontal: 2,
  },

  cardTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },

  cardYear: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});