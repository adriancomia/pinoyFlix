import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { AuthProvider } from '../context/AuthContext';
import { COLORS } from '../constants/theme';
import NavBar from '../components/NavBar';

function SplashScreen({ onDone }) {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.85);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={splash.container}>
      <Animated.View style={[splash.wrap, { opacity, transform: [{ scale }] }]}>
        <Text style={splash.icon}>🎬</Text>
        <Text style={splash.name}>PinoyFlix</Text>
        <Text style={splash.sub}>Stream anything, anytime.</Text>
      </Animated.View>
      <Text style={splash.footer}>Free  •  Fast  •  No Ads</Text>
    </View>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  if (!ready) return (
    <AuthProvider>
      <SplashScreen onDone={() => setReady(true)} />
    </AuthProvider>
  );

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <View style={styles.root}>
        <NavBar />
        <View style={styles.content}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.background },
              animation: 'fade',
            }}
          />
        </View>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1 },
});

const splash = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center',
  },
  wrap: { alignItems: 'center', gap: 12 },
  icon: { fontSize: 64 },
  name: { color: COLORS.text, fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  sub: { color: COLORS.textMuted, fontSize: 14 },
  footer: {
    position: 'absolute', bottom: 40,
    color: COLORS.textMuted, fontSize: 11, letterSpacing: 1.5,
  },
});