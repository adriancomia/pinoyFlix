import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, TextInput } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'Movies', path: '/browse' },
  { label: 'Watchlist', path: '/watchlist', authOnly: true },
  { label: 'Profile', path: '/profile' },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (item) => {
    if (item.authOnly && !user) {
      router.push('/(auth)/login');
      return;
    }
    router.push(item.path);
  };

  const handleSearchSubmit = () => {
    if (searchText.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchText.trim())}`);
      setSearchText('');
    }
  };

  if (!isWeb) return <MobileNav pathname={pathname} onNav={handleNav} />;

  const isActive = (path) =>
    pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <View style={[nav.bar, scrolled && nav.barScrolled]}>

      {/* ── Left: Logo ── */}
      <TouchableOpacity onPress={() => router.push('/')} style={nav.logoWrap}>
        <Text style={nav.logoIcon}>🎬</Text>
        <Text style={nav.logoText}>
          PINOY<Text style={nav.logoDot}>FLIX</Text>
        </Text>
      </TouchableOpacity>

      {/* ── Center: Nav links ── */}
      <View style={nav.center}>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.path}
            onPress={() => handleNav(item)}
            style={[nav.linkBtn, isActive(item.path) && nav.linkBtnActive]}
          >
            <Text style={[nav.linkText, isActive(item.path) && nav.linkTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Right: Search + Bored + Account ── */}
      <View style={nav.right}>
        <View style={nav.searchWrap}>
          <Text style={nav.searchIcon}></Text>
          <TextInput
            style={nav.searchInput}
            placeholder="Search..."
            placeholderTextColor={COLORS.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
          />
        </View>

        <TouchableOpacity
          style={nav.boredBtn}
          onPress={() => {
            const randoms = ['Inception', 'One Piece', 'Breaking Bad', 'Spirited Away', 'Interstellar'];
            const pick = randoms[Math.floor(Math.random() * randoms.length)];
            router.push(`/browse?q=${encodeURIComponent(pick)}`);
          }}
        >
          <Text style={nav.boredText}>I'm bored...</Text>
        </TouchableOpacity>

        {user ? (
          <TouchableOpacity onPress={() => router.push('/profile')} style={nav.accountBtn}>
            <View style={nav.avatar}>
              <Text style={nav.avatarText}>
                {user.displayName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <Text style={nav.accountText}>
              {user.displayName?.split(' ')[0] || 'Account'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={nav.accountBtn}>
            <Text style={nav.accountIcon}></Text>
            <Text style={nav.accountText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function MobileNav({ pathname, onNav }) {
  const isActive = (path) =>
    pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <View style={mob.bar}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.path);
        return (
          <TouchableOpacity key={item.path} style={mob.tab} onPress={() => onNav(item)}>
            <Text style={[mob.icon, active && mob.iconActive]}>
              {item.path === '/' ? '🏠' : item.path === '/browse' ? '🔍' : item.path === '/watchlist' ? '🔖' : '👤'}
            </Text>
            <Text style={[mob.label, active && mob.labelActive]}>{item.label}</Text>
            {active && <View style={mob.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const nav = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backgroundColor: 'rgba(10,10,15,0.75)',
    backdropFilter: 'blur(16px)',
    borderBottomWidth: 0.5,
    borderBottomColor: 'transparent',
  },
  barScrolled: {
    backgroundColor: 'rgba(10,10,15,0.95)',
    borderBottomColor: '#2a2a3a',
  },

  logoWrap: {
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoIcon: { fontSize: 20 },
  logoText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  logoDot: { color: '#e50914' },

  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  linkBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  linkBtnActive: {
    backgroundColor: '#e50914',
  },
  linkText: {
    color: '#a0a0b0',
    fontSize: 13,
    fontWeight: '600',
  },
  linkTextActive: {
    color: '#fff',
    fontWeight: '700',
  },

  right: {
    width: 360,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: '#2a2a3a',
    gap: 6,
    width: 150,
  },
  searchIcon: { fontSize: 12 },
  searchInput: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
    outlineStyle: 'none',
  },
  boredBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: '#2a2a3a',
  },
  boredText: {
    color: '#a0a0b0',
    fontSize: 12,
    fontWeight: '500',
  },
  accountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: '#2a2a3a',
  },
  accountIcon: { fontSize: 14 },
  accountText: {
    color: '#a0a0b0',
    fontSize: 13,
    fontWeight: '600',
  },
  avatar: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#e50914',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 12 },
});

const mob = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#13131a',
    borderTopWidth: 0.5,
    borderTopColor: '#2a2a3a',
    paddingBottom: 8,
    paddingTop: 8,
    position: 'sticky',
    bottom: 0,
    zIndex: 100,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  icon: { fontSize: 20, marginBottom: 2, opacity: 0.5 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, color: '#5a5a72', fontWeight: '500' },
  labelActive: { color: '#e50914', fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#e50914', marginTop: 3 },
});