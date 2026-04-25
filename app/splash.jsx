import { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../constants/theme';

export default function SplashScreen() {
  const router = useRouter();
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => router.replace('/'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.logo}>🎬</Text>
        <Text style={styles.name}>PinoyFlix</Text>
        <Text style={styles.tagline}>Stream anything, anytime.</Text>
      </Animated.View>
      <Text style={styles.footer}>Free • Fast • No ads</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
  },
  logoWrap: { alignItems: 'center', gap: 12 },
  logo: { fontSize: 72 },
  name: { color: COLORS.text, fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  tagline: { color: COLORS.textMuted, fontSize: 15 },
  footer: {
    position: 'absolute', bottom: 40,
    color: COLORS.textMuted, fontSize: 12, letterSpacing: 1,
  },
});