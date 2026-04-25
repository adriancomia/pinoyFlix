import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Dimensions, ActivityIndicator,
  FlatList, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../../../constants/theme';
import {
  getMovieDetails, getSeriesDetails,
  getPopularMovies, getPopularSeries,
  IMG_BASE,
} from '../../../services/tmdb';
import { getAnimeDetails, getAnimeEpisodes } from '../../../services/jikan';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');
const isWeb = width > 768;
const PLAYER_HEIGHT = isWeb ? 480 : width * (9 / 16);

export default function WatchScreen() {
  const { id, type } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [selectedEp, setSelectedEp] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerReady, setPlayerReady] = useState(false);

  useEffect(() => {
    loadContent();
  }, [id, type]);

  const loadContent = async () => {
    setLoading(true);
    setPlayerReady(false);
    try {
      if (type === 'anime') {
        const [detailRes, epRes, relatedRes] = await Promise.all([
          getAnimeDetails(id),
          getAnimeEpisodes(id),
          getAnimeDetails(id), // fallback — in real app fetch recommendations
        ]);
        const normalized = normalizeAnime(detailRes.data);
        setData(normalized);
        setEpisodes(epRes.data || []);
        setSelectedEp(epRes.data?.[0] || null);
      } else if (type === 'tv') {
        const [detailRes, relatedRes] = await Promise.all([
          getSeriesDetails(id),
          getPopularSeries(),
        ]);
        setData(normalizeTMDB(detailRes, 'tv'));
        setRelated(relatedRes.results?.slice(0, 10) || []);
      } else {
        const [detailRes, relatedRes] = await Promise.all([
          getMovieDetails(id),
          getPopularMovies(),
        ]);
        setData(normalizeTMDB(detailRes, 'movie'));
        setRelated(relatedRes.results?.slice(0, 10) || []);
      }

      // Save to watch history if logged in
      if (user) {
        await setDoc(
          doc(db, 'watchHistory', `${user.uid}_${type}_${id}`),
          {
            uid: user.uid,
            contentId: id,
            contentType: type,
            watchedAt: serverTimestamp(),
            completed: false,
          },
          { merge: true }
        );
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

  const videoKey = selectedEp?.youtube_id || data.trailerKey;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

      {/* ── Player ── */}
      <View style={styles.playerWrap}>
        {videoKey ? (
          <View style={{ width: '100%', height: PLAYER_HEIGHT }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </View>
        ) : (
          <View style={[styles.noPlayer, { height: PLAYER_HEIGHT }]}>
            <Text style={styles.noPlayerIcon}>🎬</Text>
            <Text style={styles.noPlayerText}>No video available</Text>
            <Text style={styles.noPlayerSub}>
              Trailer or stream not found for this title.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>

        {/* ── Title & meta ── */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>← Back to details</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{data.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaItem}>⭐ {data.rating}</Text>
          {data.year ? <Text style={styles.metaDot}>•</Text> : null}
          {data.year ? <Text style={styles.metaItem}>{data.year}</Text> : null}
          {data.runtime ? <Text style={styles.metaDot}>•</Text> : null}
          {data.runtime ? <Text style={styles.metaItem}>{data.runtime}</Text> : null}
        </View>

        {/* ── Watch history badge ── */}
        {user && (
          <View style={styles.historyBadge}>
            <Text style={styles.historyBadgeText}>✅ Added to your watch history</Text>
          </View>
        )}

        {/* ── Episode list (anime / tv) ── */}
        {type === 'anime' && episodes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Episodes</Text>
            <FlatList
              data={episodes}
              keyExtractor={(item) => String(item.mal_id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.epCard,
                    selectedEp?.mal_id === item.mal_id && styles.epCardActive,
                  ]}
                  onPress={() => setSelectedEp(item)}
                >
                  <Text style={[
                    styles.epNum,
                    selectedEp?.mal_id === item.mal_id && styles.epNumActive,
                  ]}>
                    EP {item.mal_id}
                  </Text>
                  <Text
                    style={[
                      styles.epTitle,
                      selectedEp?.mal_id === item.mal_id && styles.epTitleActive,
                    ]}
                    numberOfLines={1}
                  >
                    {item.title || `Episode ${item.mal_id}`}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {/* ── Related content ── */}
        {related.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>More Like This</Text>
            <FlatList
              data={related.filter((r) => String(r.id) !== String(id))}
              keyExtractor={(item) => String(item.id)}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.relatedCard}
                  onPress={() =>
                    router.replace({
                      pathname: '/content/watch/[id]',
                      params: { id: item.id, type },
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Image
                    source={{
                      uri: item.poster_path
                        ? IMG_BASE + item.poster_path
                        : 'https://via.placeholder.com/120x180',
                    }}
                    style={styles.relatedImage}
                    resizeMode="cover"
                  />
                  <View style={styles.relatedRating}>
                    <Text style={styles.relatedRatingText}>
                      ⭐ {item.vote_average?.toFixed(1)}
                    </Text>
                  </View>
                  <Text style={styles.relatedTitle} numberOfLines={1}>
                    {item.title || item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>
    </ScrollView>
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
    overview: d.overview,
    rating: d.vote_average?.toFixed(1),
    year: (d.release_date || d.first_air_date || '').slice(0, 4),
    runtime: d.runtime ? `${d.runtime}m` : null,
    trailerKey: trailer?.key || null,
  };
}

function normalizeAnime(d) {
  return {
    title: d.title,
    poster: d.images?.jpg?.large_image_url,
    overview: d.synopsis,
    rating: d.score?.toFixed(1) || 'N/A',
    year: d.year,
    runtime: d.duration,
    trailerKey: d.trailer?.youtube_id || null,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loader: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
  },

  // Player
  playerWrap: {
    width: '100%',
    backgroundColor: '#000',
  },
  noPlayer: {
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  noPlayerIcon: { fontSize: 48 },
  noPlayerText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  noPlayerSub: { color: COLORS.textMuted, fontSize: 13 },

  // Content
  content: { padding: SPACING.lg },
  backBtn: { marginBottom: SPACING.md },
  backText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  title: {
    color: COLORS.text, fontSize: isWeb ? 24 : 20,
    fontWeight: '800', marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: SPACING.sm,
  },
  metaDot: { color: COLORS.textMuted, fontSize: 12 },
  metaItem: { color: COLORS.textSecondary, fontSize: 13 },

  // History badge
  historyBadge: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 0.5, borderColor: COLORS.success,
    borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs, alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  historyBadgeText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },

  // Section
  section: { marginTop: SPACING.lg },
  sectionTitle: {
    color: COLORS.text, fontSize: 16,
    fontWeight: '700', marginBottom: SPACING.sm,
  },

  // Episodes
  epCard: {
    width: 120, marginRight: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.sm, borderWidth: 0.5, borderColor: COLORS.border,
  },
  epCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  epNum: { color: COLORS.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 4 },
  epNumActive: { color: 'rgba(255,255,255,0.8)' },
  epTitle: { color: COLORS.textSecondary, fontSize: 12 },
  epTitleActive: { color: '#fff', fontWeight: '600' },

  // Related
  relatedCard: { width: 120, marginRight: SPACING.sm },
  relatedImage: {
    width: 120, height: 180, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
  },
  relatedRating: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  relatedRatingText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  relatedTitle: {
    color: COLORS.textSecondary, fontSize: 11,
    marginTop: 6, paddingHorizontal: 2,
  },
});