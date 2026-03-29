import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api';

const { width } = Dimensions.get('window');

const GENDER_OPTIONS = ['Female', 'Male', 'Other'];
const SKIN_TYPES = ['Dry', 'Oily', 'Combination', 'Sensitive', 'Normal'];

const StableField = ({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  autoCapitalize = 'none',
}) => (
  <View style={styles.fieldBlock}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.inputShell}>
      <View style={styles.inputIconWrap}>
        <Feather name={icon} size={17} color="#9fb0bf" />
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#667584"
        style={styles.input}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  </View>
);

const OptionChip = ({ label, active, onPress }) => (
  <TouchableOpacity
    activeOpacity={0.9}
    onPress={onPress}
    style={[styles.optionChip, active && styles.optionChipActive]}
  >
    <Text style={[styles.optionChipText, active && styles.optionChipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function ProfileSetupScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [skinType, setSkinType] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isEditMode = useMemo(() => {
    return Boolean(fullName || age || gender || skinType);
  }, [fullName, age, gender, skinType]);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/profile');
      const data = response?.data || {};

      setFullName(data.full_name || data.fullname || '');
      setAge(data.age ? String(data.age) : '');
      setGender(data.gender || '');
      setSkinType(data.skin_type || '');
    } catch (error) {
      console.log('Profile preload failed:', error?.response?.data || error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }

    if (!age.trim()) {
      Alert.alert('Missing age', 'Please enter your age.');
      return;
    }

    const parsedAge = parseInt(age, 10);
    if (Number.isNaN(parsedAge) || parsedAge < 10 || parsedAge > 100) {
      Alert.alert('Invalid age', 'Please enter a valid age.');
      return;
    }

    if (!gender) {
      Alert.alert('Missing gender', 'Please select a gender.');
      return;
    }

    if (!skinType) {
      Alert.alert('Missing skin type', 'Please select your skin type.');
      return;
    }

    try {
      setSaving(true);

      await api.post('/api/profile-setup', {
        full_name: fullName.trim(),
        age: parsedAge,
        gender,
        skin_type: skinType,
      });

      Alert.alert(
        'Profile saved',
        isEditMode
          ? 'Your profile details were updated successfully.'
          : 'Your profile setup is complete.'
      );

      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error) {
      Alert.alert(
        'Save failed',
        error?.response?.data?.error || 'Unable to save profile details right now.'
      );
      console.log('Profile setup error:', error?.response?.data || error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#9bc7ff" />
        <Text style={styles.loadingText}>Loading profile setup...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color="#d7e6f3" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.heroWrap}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="account-cog-outline" size={14} color="#a9c5ff" />
            <Text style={styles.heroBadgeText}>
              {isEditMode ? 'EDIT PROFILE' : 'PROFILE SETUP'}
            </Text>
          </View>

          <Text style={styles.title}>
            {isEditMode ? 'Update your profile' : 'Complete your profile'}
          </Text>

          <Text style={styles.subtitle}>
            Add your personal details so the app can tailor skin analysis, recommendations, and wellness insights more accurately.
          </Text>
        </View>

        <View style={styles.panel}>
          <StableField
            label="Full name"
            icon="user"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <StableField
            label="Age"
            icon="calendar"
            placeholder="Enter your age"
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
          />

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Gender</Text>
            <View style={styles.optionWrap}>
              {GENDER_OPTIONS.map((item) => (
                <OptionChip
                  key={item}
                  label={item}
                  active={gender === item}
                  onPress={() => setGender(item)}
                />
              ))}
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Skin type</Text>
            <View style={styles.optionWrap}>
              {SKIN_TYPES.map((item) => (
                <OptionChip
                  key={item}
                  label={item}
                  active={skinType === item}
                  onPress={() => setSkinType(item)}
                />
              ))}
            </View>
          </View>

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color="#9fc2ff" />
            <Text style={styles.infoText}>
              These values can be updated later from your profile details screen. The home screen and gender-based features will adjust automatically when your profile changes.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            activeOpacity={0.92}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#0d141b" />
            ) : (
              <>
                <Text style={styles.saveButtonText}>
                  {isEditMode ? 'Save Changes' : 'Complete Setup'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#0d141b" />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: 18 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const panelWidth = width > 880 ? 640 : '100%';

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
    paddingBottom: 36,
    alignItems: 'center',
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
  heroWrap: {
    width: panelWidth,
    marginBottom: 18,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#141c26',
    borderWidth: 1,
    borderColor: '#233242',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: '#a9c5ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    color: '#f5f7fb',
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 10,
  },
  subtitle: {
    color: '#a5b2bf',
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 760,
  },
  panel: {
    width: panelWidth,
    backgroundColor: '#11161d',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1c252f',
    padding: 18,
  },
  fieldBlock: {
    marginBottom: 16,
  },
  fieldLabel: {
    color: '#d9e2ec',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#27313d',
    backgroundColor: '#0f141a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  inputIconWrap: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: '#f4f7fb',
    fontSize: 15,
    paddingVertical: 15,
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2b3643',
    backgroundColor: '#0f141a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionChipActive: {
    backgroundColor: '#d7e6f5',
    borderColor: '#d7e6f5',
  },
  optionChipText: {
    color: '#d7e0e8',
    fontSize: 13,
    fontWeight: '700',
  },
  optionChipTextActive: {
    color: '#0d141b',
    fontWeight: '900',
  },
  infoCard: {
    marginTop: 4,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#223246',
    backgroundColor: '#121b26',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#adc0d3',
    fontSize: 13,
    lineHeight: 20,
  },
  saveButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#c7d8ea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  disabledButton: {
    opacity: 0.65,
  },
  saveButtonText: {
    color: '#0d141b',
    fontSize: 16,
    fontWeight: '900',
  },
});