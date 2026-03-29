import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api';

const { width } = Dimensions.get('window');

const DetailCard = ({ icon, label, value, accent }) => (
  <View style={styles.detailCard}>
    <View style={[styles.detailIconWrap, { backgroundColor: `${accent}22` }]}>
      <MaterialCommunityIcons name={icon} size={18} color={accent} />
    </View>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
  </View>
);

export default function ProfileDetailsScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/api/profile');
      setProfile(response?.data || null);
    } catch (error) {
      Alert.alert(
        'Failed to load profile',
        error?.response?.data?.error || 'Unable to fetch profile details right now.'
      );
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

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await fetchProfile();
    } finally {
      setRefreshing(false);
    }
  }, [fetchProfile]);

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#9bc7ff" />
        <Text style={styles.loadingText}>Loading profile details...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9bc7ff" />}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={18} color="#d7e6f3" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            <Ionicons name="person-outline" size={38} color="#0d141b" />
          </View>

          <View style={styles.heroTextWrap}>
            <Text style={styles.heroEyebrow}>PROFILE DETAILS</Text>
            <Text style={styles.heroTitle}>{displayName}</Text>
            <Text style={styles.heroSubtitle}>
              Review your saved personal details and keep your profile updated so recommendations and insights stay relevant.
            </Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ProfileSetup')}
          >
            <Feather name="edit-2" size={16} color="#0d141b" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionWrap}>
          <Text style={styles.sectionTitle}>Saved information</Text>

          <View style={styles.gridWrap}>
            <DetailCard
              icon="account-outline"
              label="Full name"
              value={profile?.full_name || profile?.fullname}
              accent="#9bc7ff"
            />
            <DetailCard
              icon="email-outline"
              label="Email"
              value={profile?.email}
              accent="#c6b5ff"
            />
            <DetailCard
              icon="calendar-account-outline"
              label="Age"
              value={profile?.age ? String(profile.age) : ''}
              accent="#f4c28c"
            />
            <DetailCard
              icon="human-male-female"
              label="Gender"
              value={profile?.gender}
              accent="#8fe0b1"
            />
            <DetailCard
              icon="water-outline"
              label="Skin type"
              value={profile?.skin_type}
              accent="#7fdcf2"
            />
            <DetailCard
              icon="check-decagram-outline"
              label="Profile status"
              value={profile?.profile_completed ? 'Completed' : 'Pending'}
              accent="#a4e29a"
            />
          </View>
        </View>

        <View style={styles.infoPanel}>
          <Text style={styles.infoPanelTitle}>Why profile details matter</Text>
          <Text style={styles.infoPanelText}>
            Your profile is used to personalise skincare recommendations, support cycle-based guidance where relevant, and tailor wellness insights across the app. Keeping these details accurate improves the quality of the results shown in your dashboard.
          </Text>
        </View>

        <View style={{ height: Platform.OS === 'web' ? 18 : 28 }} />
      </ScrollView>
    </View>
  );
}

const cardWidth = width >= 1000 ? '48.5%' : '100%';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0c1015',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0c1015',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#d9e2ec',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 30,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 18,
  },
  backText: {
    color: '#d7e6f3',
    fontSize: 15,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#121820',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#202b36',
    padding: 18,
    flexDirection: width > 760 ? 'row' : 'column',
    alignItems: width > 760 ? 'center' : 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 78,
    height: 78,
    borderRadius: 22,
    backgroundColor: '#d8e8f7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroEyebrow: {
    color: '#90a4b7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#f5f8fb',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: '#a7b3be',
    fontSize: 14,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 20,
  },
  editButton: {
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#c8d9ea',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  editButtonText: {
    color: '#0d141b',
    fontSize: 14,
    fontWeight: '900',
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#f4f7fb',
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
  detailCard: {
    width: cardWidth,
    backgroundColor: '#11161d',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1d2731',
    padding: 16,
    minHeight: 138,
  },
  detailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#91a4b5',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  detailValue: {
    color: '#f3f7fb',
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 24,
  },
  infoPanel: {
    backgroundColor: '#121923',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1f2b39',
    padding: 18,
  },
  infoPanelTitle: {
    color: '#f5f8fb',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  infoPanelText: {
    color: '#a9b6c1',
    fontSize: 14,
    lineHeight: 22,
  },
});