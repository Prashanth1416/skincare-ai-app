import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { gsap } from 'gsap';
import api from '../api';

const { width } = Dimensions.get('window');

const FEATURED_CARD = {
  key: 'skin-analysis',
  title: 'Skin Analysis',
  subtitle:
    'Capture a live image, analyse visible skin condition, and unlock personalised skincare direction with your main presentation-ready feature.',
  icon: 'scan-outline',
  route: 'Camera',
  accent: '#7dd3fc',
  glow: 'rgba(125, 211, 252, 0.22)',
  bg: '#121c28',
};

const ALL_GRID_CARDS = [
  {
    key: 'product-recommendations',
    title: 'Product Suggestions',
    subtitle: 'Detailed skincare recommendations and shopping guidance.',
    icon: 'bag-handle-outline',
    route: 'ProductRecommendations',
    accent: '#f5b8cf',
    glow: 'rgba(245, 184, 207, 0.18)',
    bg: '#17131a',
  },
  {
    key: 'morning-mood',
    title: 'Morning Mood',
    subtitle: 'Track emotional state and morning wellness patterns.',
    icon: 'sunny-outline',
    route: 'MorningMoodAnalyzer',
    accent: '#f4d58d',
    glow: 'rgba(244, 213, 141, 0.17)',
    bg: '#1a1812',
  },
  {
    key: 'mood-history',
    title: 'Mood History',
    subtitle: 'Review previous entries and emotional trends.',
    icon: 'time-outline',
    route: 'MorningMoodHistory',
    accent: '#c8b6ff',
    glow: 'rgba(200, 182, 255, 0.18)',
    bg: '#161420',
  },
  {
    key: 'cycle-tracker',
    title: 'Menstrual Cycle',
    subtitle: 'Monitor menstrual insights and cycle-based skin guidance.',
    icon: 'water-outline',
    route: 'MenstrualSettings',
    accent: '#ff9bb0',
    glow: 'rgba(255, 155, 176, 0.18)',
    bg: '#1b1216',
  },
];

const QuickStat = ({ label, value, icon, accent }) => (
  <View style={styles.quickStatCard}>
    <View style={[styles.quickStatIcon, { backgroundColor: `${accent}22` }]}>
      <MaterialCommunityIcons name={icon} size={18} color={accent} />
    </View>
    <Text style={styles.quickStatValue}>{value}</Text>
    <Text style={styles.quickStatLabel}>{label}</Text>
  </View>
);

const GridCard = React.forwardRef(({ item, onPress, onMouseEnter, onMouseMove, onMouseLeave }, ref) => (
  <TouchableOpacity
    ref={ref}
    activeOpacity={0.92}
    style={[styles.gridCard, { backgroundColor: item.bg, borderColor: `${item.accent}30` }]}
    onPress={onPress}
    onMouseEnter={Platform.OS === 'web' ? onMouseEnter : undefined}
    onMouseMove={Platform.OS === 'web' ? onMouseMove : undefined}
    onMouseLeave={Platform.OS === 'web' ? onMouseLeave : undefined}
  >
    <View style={styles.gridCardTop}>
      <View style={[styles.gridIconWrap, { backgroundColor: `${item.accent}18` }]}>
        <Ionicons name={item.icon} size={20} color={item.accent} />
      </View>
      <Feather name="arrow-up-right" size={18} color={item.accent} />
    </View>

    <Text style={styles.gridCardTitle}>{item.title}</Text>
    <Text style={styles.gridCardSubtitle}>{item.subtitle}</Text>

    <View style={styles.gridCardFooter}>
      <Text style={[styles.gridCardFooterText, { color: item.accent }]}>Open</Text>
    </View>
  </TouchableOpacity>
));

export default function HomeScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const featuredRef = useRef(null);
  const cardRefs = useRef({});
  const heroRef = useRef(null);
  const statsRef = useRef([]);

  const displayName = useMemo(() => {
    if (!profile) return 'User';
    return (
      profile.full_name ||
      profile.fullname ||
      profile.name ||
      profile.username ||
      'User'
    );
  }, [profile]);

  const normalizedGender = useMemo(() => {
    const rawGender = profile?.gender || '';
    return String(rawGender).trim().toLowerCase();
  }, [profile]);

  const visibleGridCards = useMemo(() => {
    if (normalizedGender === 'male') {
      return ALL_GRID_CARDS.filter((card) => card.key !== 'cycle-tracker');
    }
    return ALL_GRID_CARDS;
  }, [normalizedGender]);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/api/profile');
      setProfile(response?.data || null);
    } catch (error) {
      setProfile(null);
    }
  }, []);

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      await fetchProfile();
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (Platform.OS !== 'web' || loading) return;

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (heroRef.current) {
      tl.fromTo(
        heroRef.current,
        { y: 24, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.55 }
      );
    }

    if (featuredRef.current) {
      tl.fromTo(
        featuredRef.current,
        { y: 28, opacity: 0, scale: 0.98 },
        { y: 0, opacity: 1, scale: 1, duration: 0.55 },
        '-=0.24'
      );
    }

    if (statsRef.current?.length) {
      tl.fromTo(
        statsRef.current.filter(Boolean),
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.07 },
        '-=0.3'
      );
    }

    if (Object.values(cardRefs.current).length) {
      tl.fromTo(
        Object.values(cardRefs.current),
        { y: 22, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.06 },
        '-=0.28'
      );
    }
  }, [loading, visibleGridCards]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('user');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      Alert.alert('Logout failed', 'Unable to log out right now.');
    }
  };

  const animateCardHover = (node, x, y, strength = 10) => {
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const px = x - rect.left;
    const py = y - rect.top;

    const rotateY = ((px / rect.width) - 0.5) * strength;
    const rotateX = -((py / rect.height) - 0.5) * strength;

    gsap.to(node, {
      rotateX,
      rotateY,
      y: -6,
      scale: 1.018,
      transformPerspective: 1000,
      transformOrigin: 'center center',
      duration: 0.22,
      ease: 'power2.out',
    });
  };

  const resetCardHover = (node) => {
    if (!node) return;
    gsap.to(node, {
      rotateX: 0,
      rotateY: 0,
      y: 0,
      scale: 1,
      duration: 0.38,
      ease: 'power3.out',
    });
  };

  const handleFeaturedMove = (e) => {
    if (Platform.OS !== 'web') return;
    animateCardHover(featuredRef.current, e.nativeEvent.clientX, e.nativeEvent.clientY, 14);
  };

  const handleFeaturedEnter = () => {
    if (Platform.OS !== 'web' || !featuredRef.current) return;
    gsap.to(featuredRef.current, {
      boxShadow: `0 26px 60px ${FEATURED_CARD.glow}`,
      duration: 0.25,
      ease: 'power2.out',
    });
  };

  const handleFeaturedLeave = () => {
    if (Platform.OS !== 'web' || !featuredRef.current) return;
    resetCardHover(featuredRef.current);
    gsap.to(featuredRef.current, {
      boxShadow: '0 18px 40px rgba(0,0,0,0.18)',
      duration: 0.35,
      ease: 'power3.out',
    });
  };

  const handleGridMove = (key, e) => {
    if (Platform.OS !== 'web') return;
    const node = cardRefs.current[key];
    animateCardHover(node, e.nativeEvent.clientX, e.nativeEvent.clientY, 9);
  };

  const handleGridEnter = (key, glow) => {
    if (Platform.OS !== 'web') return;
    const node = cardRefs.current[key];
    if (!node) return;

    gsap.to(node, {
      boxShadow: `0 18px 38px ${glow}`,
      duration: 0.22,
      ease: 'power2.out',
    });
  };

  const handleGridLeave = (key) => {
    if (Platform.OS !== 'web') return;
    const node = cardRefs.current[key];
    if (!node) return;

    resetCardHover(node);
    gsap.to(node, {
      boxShadow: '0 12px 24px rgba(0,0,0,0.14)',
      duration: 0.34,
      ease: 'power3.out',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#7dd3fc" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7dd3fc" />}
      >
        <View ref={heroRef} style={styles.topBar}>
          <View style={styles.topLeft}>
            <Text style={styles.brandEyebrow}>SKIN INTELLIGENCE DASHBOARD</Text>
            <Text style={styles.pageTitle}>Welcome, {displayName}</Text>
          </View>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.profileButton}
              onPress={() => navigation.navigate('ProfileDetails')}
            >
              <Ionicons name="person-outline" size={16} color="#091118" />
              <Text style={styles.profileButtonText}>View Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} activeOpacity={0.88} onPress={handleLogout}>
              <Feather name="log-out" size={16} color="#dce7f1" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.heroPanel}>
          <Text style={styles.heroLabel}>PROFILE SNAPSHOT</Text>
          <Text style={styles.heroHeading}>Your personalised overview</Text>

          <View style={styles.heroInfoGrid}>
            {[
              {
                key: 'skin_type',
                label: 'Skin type',
                value: profile?.skin_type || 'Not set',
                icon: 'water-outline',
                accent: '#7dd3fc',
              },
              {
                key: 'age',
                label: 'Age',
                value: profile?.age ? String(profile.age) : 'Not set',
                icon: 'calendar-account-outline',
                accent: '#f5c38f',
              },
              {
                key: 'gender',
                label: 'Gender',
                value: profile?.gender || 'Not set',
                icon: 'account-outline',
                accent: '#b9a7ff',
              },
              {
                key: 'status',
                label: 'Profile status',
                value: profile?.profile_completed ? 'Complete' : 'Pending',
                icon: 'shield-check-outline',
                accent: '#8fe0b1',
              },
            ].map((item, index) => (
              <View
                key={item.key}
                ref={(node) => {
                  if (node) statsRef.current[index] = node;
                }}
                style={styles.statWrap}
              >
                <QuickStat
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  accent={item.accent}
                />
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          ref={featuredRef}
          activeOpacity={0.95}
          style={styles.featuredSkinCard}
          onPress={() => navigation.navigate(FEATURED_CARD.route)}
          onMouseEnter={Platform.OS === 'web' ? handleFeaturedEnter : undefined}
          onMouseMove={Platform.OS === 'web' ? handleFeaturedMove : undefined}
          onMouseLeave={Platform.OS === 'web' ? handleFeaturedLeave : undefined}
        >
          <View style={styles.featuredBackdropGlow} />

          <View style={styles.featuredTopRow}>
            <View style={styles.featuredBadge}>
              <MaterialCommunityIcons name="star-four-points-outline" size={14} color="#08121a" />
              <Text style={styles.featuredBadgeText}>MAIN FEATURE</Text>
            </View>
            <Feather name="arrow-up-right" size={20} color="#7dd3fc" />
          </View>

          <View style={styles.featuredContentRow}>
            <View style={styles.featuredIconWrap}>
              <Ionicons name={FEATURED_CARD.icon} size={34} color="#7dd3fc" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.featuredTitle}>{FEATURED_CARD.title}</Text>
              <Text style={styles.featuredSubtitle}>{FEATURED_CARD.subtitle}</Text>

              <View style={styles.featuredHighlights}>
                <View style={styles.featuredHighlightChip}>
                  <Text style={styles.featuredHighlightText}>Live webcam capture</Text>
                </View>
                <View style={styles.featuredHighlightChip}>
                  <Text style={styles.featuredHighlightText}>Visual skin insights</Text>
                </View>
                <View style={styles.featuredHighlightChip}>
                  <Text style={styles.featuredHighlightText}>Personal remedies</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.featuredFooter}>
            <Text style={styles.featuredFooterText}>Start analysis</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.gridSection}>
          <Text style={styles.sectionTitle}>Explore your tools</Text>

          <View style={styles.gridWrap}>
            {visibleGridCards.map((item) => (
              <GridCard
                key={item.key}
                ref={(node) => {
                  if (Platform.OS === 'web' && node) {
                    cardRefs.current[item.key] = node;
                  }
                }}
                item={item}
                onPress={() => navigation.navigate(item.route)}
                onMouseEnter={() => handleGridEnter(item.key, item.glow)}
                onMouseMove={(e) => handleGridMove(item.key, e)}
                onMouseLeave={() => handleGridLeave(item.key)}
              />
            ))}
          </View>
        </View>

        <View style={{ height: Platform.OS === 'web' ? 20 : 28 }} />
      </ScrollView>
    </View>
  );
}

const gridCardWidth = width >= 1000 ? '48.7%' : '100%';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#070b10',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#070b10',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#d7e2ea',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 30,
  },
  topBar: {
    flexDirection: width > 860 ? 'row' : 'column',
    justifyContent: 'space-between',
    alignItems: width > 860 ? 'center' : 'flex-start',
    gap: 16,
    marginBottom: 18,
  },
  topLeft: {
    flex: 1,
  },
  brandEyebrow: {
    color: '#6d8194',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  pageTitle: {
    color: '#f4f8fb',
    fontSize: 32,
    fontWeight: '900',
  },
  topRightActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  profileButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#d8e8f4',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileButtonText: {
    color: '#091118',
    fontSize: 14,
    fontWeight: '900',
  },
  logoutButton: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2c37',
    backgroundColor: '#0f151c',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutText: {
    color: '#dce7f1',
    fontSize: 14,
    fontWeight: '800',
  },
  heroPanel: {
    backgroundColor: '#0d131a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#171f27',
    padding: 18,
    marginBottom: 18,
  },
  heroLabel: {
    color: '#6f8396',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroHeading: {
    color: '#f4f8fb',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 16,
  },
  heroInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statWrap: {
    flex: 1,
    minWidth: width > 900 ? 180 : 145,
  },
  quickStatCard: {
    backgroundColor: '#0a0f14',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#131b23',
    padding: 14,
  },
  quickStatIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickStatValue: {
    color: '#f4f8fb',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  quickStatLabel: {
    color: '#6f8496',
    fontSize: 12,
    fontWeight: '700',
  },
  featuredSkinCard: {
    backgroundColor: '#101722',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#1c3147',
    padding: 18,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  featuredBackdropGlow: {
    position: 'absolute',
    right: -80,
    top: -60,
    width: 220,
    height: 220,
    borderRadius: 220,
    backgroundColor: 'rgba(125, 211, 252, 0.10)',
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    zIndex: 2,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7dd3fc',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  featuredBadgeText: {
    color: '#08121a',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  featuredContentRow: {
    flexDirection: width > 760 ? 'row' : 'column',
    gap: 16,
    alignItems: width > 760 ? 'center' : 'flex-start',
    zIndex: 2,
  },
  featuredIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#0b1118',
    borderWidth: 1,
    borderColor: '#21405d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredTitle: {
    color: '#f4fbff',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 8,
  },
  featuredSubtitle: {
    color: '#adc7da',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
    maxWidth: 860,
  },
  featuredHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featuredHighlightChip: {
    backgroundColor: '#152435',
    borderWidth: 1,
    borderColor: '#244763',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  featuredHighlightText: {
    color: '#d7ecf8',
    fontSize: 12,
    fontWeight: '700',
  },
  featuredFooter: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1b3146',
    zIndex: 2,
  },
  featuredFooterText: {
    color: '#7dd3fc',
    fontSize: 14,
    fontWeight: '900',
  },
  gridSection: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#f4f8fb',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 14,
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  gridCard: {
    width: gridCardWidth,
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    minHeight: 174,
    backgroundColor: '#0d1218',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  gridCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  gridIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridCardTitle: {
    color: '#f4f8fb',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  gridCardSubtitle: {
    color: '#9fb0bf',
    fontSize: 13,
    lineHeight: 20,
    flex: 1,
  },
  gridCardFooter: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  gridCardFooterText: {
    fontSize: 13,
    fontWeight: '800',
  },
});