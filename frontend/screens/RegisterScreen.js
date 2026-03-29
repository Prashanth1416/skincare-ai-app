import React, { useMemo, useState } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../api';

const { width } = Dimensions.get('window');

const Field = ({
  label,
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  rightIcon,
  onRightPress,
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
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />

      {rightIcon ? (
        <TouchableOpacity onPress={onRightPress} activeOpacity={0.8} style={styles.eyeButton}>
          <Feather name={rightIcon} size={17} color="#a9b7c5" />
        </TouchableOpacity>
      ) : null}
    </View>
  </View>
);

export default function RegisterScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securePassword, setSecurePassword] = useState(true);
  const [secureConfirmPassword, setSecureConfirmPassword] = useState(true);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      fullName.trim().length > 1 &&
      email.trim().length > 3 &&
      password.length >= 6 &&
      confirmPassword.length >= 6
    );
  }, [fullName, email, password, confirmPassword]);

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert('Missing name', 'Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Missing email', 'Please enter your email address.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }

    if (!password) {
      Alert.alert('Missing password', 'Please enter a password.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password and confirm password do not match.');
      return;
    }

    try {
      setLoading(true);

      const response = await api.post('/api/register', {
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const data = response?.data || {};

      if (!data.access_token) {
        throw new Error('Registration succeeded but no access token was returned.');
      }

      await AsyncStorage.setItem('access_token', data.access_token);

      await AsyncStorage.setItem(
        'user',
        JSON.stringify({
          user_id: data.user_id || null,
          full_name: data.full_name || fullName.trim(),
          email: data.email || email.trim().toLowerCase(),
          profile_completed: Boolean(data.profile_completed),
        })
      );

      navigation.reset({
        index: 0,
        routes: [
          {
            name: data.profile_completed ? 'Home' : 'ProfileSetup',
          },
        ],
      });
    } catch (error) {
      const backendMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Registration failed. Please try again.';

      Alert.alert('Registration failed', backendMessage);
      console.log('Register error:', error?.response?.data || error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Ionicons name="arrow-back" size={18} color="#d6e4f0" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.heroWrap}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="account-plus-outline" size={14} color="#a9c5ff" />
            <Text style={styles.heroBadgeText}>NEW ACCOUNT</Text>
          </View>

          <Text style={styles.title}>Create your profile</Text>
          <Text style={styles.subtitle}>
            Register to access personalised skin analysis, product guidance, mood tracking, and cycle-based insights built around your profile.
          </Text>
        </View>

        <View style={styles.panel}>
          <Field
            label="Full name"
            icon="user"
            placeholder="Enter your full name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />

          <Field
            label="Email"
            icon="mail"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Field
            label="Password"
            icon="lock"
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={securePassword}
            rightIcon={securePassword ? 'eye-off' : 'eye'}
            onRightPress={() => setSecurePassword((prev) => !prev)}
          />

          <Field
            label="Confirm password"
            icon="shield"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={secureConfirmPassword}
            rightIcon={secureConfirmPassword ? 'eye-off' : 'eye'}
            onRightPress={() => setSecureConfirmPassword((prev) => !prev)}
          />

          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={18} color="#9fc2ff" />
            <Text style={styles.noteText}>
              After registration, you’ll continue to profile setup so the app can personalise your experience properly.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.registerButton, (!canSubmit || loading) && styles.disabledButton]}
            onPress={handleRegister}
            activeOpacity={0.92}
            disabled={!canSubmit || loading}
          >
            {loading ? (
              <ActivityIndicator color="#0d141b" />
            ) : (
              <>
                <Text style={styles.registerButtonText}>Create Account</Text>
                <Ionicons name="arrow-forward" size={18} color="#0d141b" />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginRow}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginTextMuted}>Already have an account?</Text>
            <Text style={styles.loginTextAction}> Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const panelWidth = width > 880 ? 620 : '100%';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0c1015',
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
    color: '#d6e4f0',
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
    fontSize: 34,
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
    marginBottom: 14,
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
  eyeButton: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteCard: {
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
  noteText: {
    flex: 1,
    color: '#adc0d3',
    fontSize: 13,
    lineHeight: 20,
  },
  registerButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#c7d8ea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#0d141b',
    fontSize: 16,
    fontWeight: '900',
  },
  loginRow: {
    marginTop: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginTextMuted: {
    color: '#9eabb7',
    fontSize: 14,
  },
  loginTextAction: {
    color: '#c1d3ff',
    fontSize: 14,
    fontWeight: '800',
  },
});