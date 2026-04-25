import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');
const isWeb = width > 768;

const NAV_ITEMS = [
  { label: 'Home', icon: '🏠', path: '/' },
  { label: 'Browse', icon: '🔍', path: '/browse' },
  { label: 'Watchlist', icon: '🔖', path: '/watchlist', authOnly: true },
  { label: 'Profile', icon: '👤', path: '/profile' },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const handleNav = (item) => {
    if (item.authOnly && !user) {
      router.push('/(auth)/login');
      return;
    }
    router.push(item.path);
  };

  if (isWeb) return <WebNav pathname={pathname} onNav={handleNav} user={user} router={router} />;
  return <MobileNav pathname={pathname} onNav={handleNav} />;
}

function WebNav({ pathname, onNav, user, router }) {
  const isActive = (path) =>
    pathname === path || (path !== '/' && pathname.startsWith(path));

  return (
    <View style={web.bar}>
      {/* ── Logo → goes to Home ── */}
      <TouchableOpacity onPress={() => router.push('/')}>
        <Text style={web.logo}>🎬 PinoyFlix</Text>
      </TouchableOpacity>

      <View style={web.links}>
        {NAV_ITEMS.map((item) => (
          <TouchableOpacity key={item.path} onPress={() => onNav(item)} style={web.linkWrap}>
            <Text style={[web.link, isActive(item.path) && web.linkActive]}>
              {item.label}
            </Text>
            {isActive(item.path) && <View style={web.linkUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Avatar → goes to Profile ── */}
      <View style={web.right}>
        {user ? (
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View style={web.avatarWrap}>
              <Text style={web.avatarText}>
                {user.displayName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={web.signInBtn} onPress={() => router.push('/(auth)/login')}>
            <Text style={web.signInText}>Sign In</Text>
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
            <Text style={[mob.icon, active && mob.iconActive]}>{item.icon}</Text>
            <Text style={[mob.label, active && mob.labelActive]}>{item.label}</Text>
            {active && <View style={mob.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const web = StyleSheet.create({
  bar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(10,10,15,0.95)',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md,
    borderBottomWidth: 0.5, borderBottomColor: COLORS.border,
    position: 'sticky', top: 0, zIndex: 100,
  },
  logo: { color: COLORS.text, fontSize: 20, fontWeight: '800', marginRight: SPACING.xl },
  links: { flexDirection: 'row', gap: SPACING.lg, flex: 1 },
  linkWrap: { alignItems: 'center' },
  link: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '500', paddingVertical: 4 },
  linkActive: { color: COLORS.text, fontWeight: '700' },
  linkUnderline: { height: 2, width: '100%', backgroundColor: COLORS.primary, borderRadius: 2, marginTop: 2 },
  right: { marginLeft: 'auto' },
  signInBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs + 2, borderRadius: RADIUS.full,
  },
  signInText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  avatarWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});

const mob = StyleSheet.create({
  bar: {
    flexDirection: 'row', backgroundColor: COLORS.surface,
    borderTopWidth: 0.5, borderTopColor: COLORS.border,
    paddingBottom: SPACING.sm, paddingTop: SPACING.sm,
    position: 'sticky', bottom: 0, zIndex: 100,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  icon: { fontSize: 20, marginBottom: 2, opacity: 0.5 },
  iconActive: { opacity: 1 },
  label: { fontSize: 10, color: COLORS.textMuted, fontWeight: '500' },
  labelActive: { color: COLORS.primary, fontWeight: '700' },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.primary, marginTop: 3 },
});