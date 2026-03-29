/**
 * SKIN IQ — LoginScreen
 * Dark obsidian theme · Emerald accent · Animated entrance
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

// ── TOKENS ────────────────────────────────────────────────────
const T = {
  bg0:'#0D0D14', bg1:'#13131F', bg2:'#1A1A2E', bg3:'#22223A', bg4:'#2A2A45',
  border:'#2E2E50', borderBright:'#3D3D6B',
  text:'#F0EFF8', text2:'#B8B5D4', text3:'#7A7898', text4:'#4A4870',
  accent:'#39E07A', accentDim:'rgba(57,224,122,0.12)', accentGlow:'rgba(57,224,122,0.28)',
  skyBlue:'#38BDF8', skyBlueDim:'rgba(56,189,248,0.12)',
  error:'#FF6B6B',
};

// ── ICON COMPONENTS ────────────────────────────────────────────
const IconStar = () => (
  <View style={ico.wrap}>
    <Text style={ico.glyph}>✦</Text>
  </View>
);
const ico = StyleSheet.create({
  wrap: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: 16, color: T.accent },
});

// ── SCAN LINE DECORATION ───────────────────────────────────────
const ScanLine = ({ anim }) => (
  <Animated.View style={[sl.line, {
    transform: [{ scaleX: anim.interpolate({ inputRange:[0,1], outputRange:[0.3, 1] }) }],
    opacity: anim,
  }]} />
);
const sl = StyleSheet.create({
  line: { height: 1, backgroundColor: T.accent, marginVertical: 4, borderRadius: 1 },
});

export default function LoginScreen({ navigation }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [focused,  setFocused]  = useState(null);
  const [showPw,   setShowPw]   = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const lineAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(lineAnim, { toValue: 0, duration: 1800, useNativeDriver: false }),
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      const res = await api.post('/api/login', { email: email.trim(), password: password.trim() });
      const { access_token, user_id, profile_completed } = res.data;
      await AsyncStorage.setItem('token', access_token);
      await AsyncStorage.setItem('userId', String(user_id));
      await AsyncStorage.setItem('userEmail', email.trim());
      await AsyncStorage.setItem('profilecompleted', String(profile_completed));
      const dest = profile_completed ? 'Home' : 'ProfileSetup';
      navigation.reset({ index: 0, routes: [{ name: dest }] });
    } catch (err) {
      Alert.alert('Login Failed', err?.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top','bottom']}>
      {/* BG grid decoration */}
      <View style={s.bgGrid} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── BRAND ── */}
        <Animated.View style={[s.brand, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={s.logoRing}>
            <View style={s.logoDisk}>
              <Text style={s.logoText}>✨</Text>
            </View>
            <View style={s.logoGlow} />
          </View>
          <Text style={s.appName}>SKIN IQ</Text>
          <ScanLine anim={lineAnim} />
          <Text style={s.tagline}>AI SKINCARE INTELLIGENCE</Text>
        </Animated.View>

        {/* ── FORM CARD ── */}
        <Animated.View style={[s.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={s.cardHead}>Welcome back</Text>
          <Text style={s.cardSub}>Sign in to your personal skin journal</Text>

          {/* Email */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Email Address</Text>
            <View style={[s.inputRow, focused === 'email' && s.inputFocused]}>
              <Text style={s.inputIco}>⌘</Text>
              <TextInput
                style={s.input}
                placeholder="you@example.com"
                placeholderTextColor={T.text4}
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={()  => setFocused(null)}
                editable={!loading}
              />
            </View>
          </View>

          {/* Password */}
          <View style={s.fieldWrap}>
            <Text style={s.label}>Password</Text>
            <View style={[s.inputRow, focused === 'pass' && s.inputFocused]}>
              <Text style={s.inputIco}>◈</Text>
              <TextInput
                style={s.input}
                placeholder="Minimum 6 characters"
                placeholderTextColor={T.text4}
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('pass')}
                onBlur={()  => setFocused(null)}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={s.eyeBtn}>
                <Text style={s.eyeTxt}>{showPw ? '◑' : '◐'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[s.cta, loading && s.ctaOff]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator size="small" color={T.bg0} />
              : <Text style={s.ctaTxt}>Sign In →</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={s.divRow}>
            <View style={s.divLine} />
            <Text style={s.divTxt}>or</Text>
            <View style={s.divLine} />
          </View>

          {/* Register */}
          <TouchableOpacity style={s.ghost} onPress={() => navigation.navigate('Register')} activeOpacity={0.8}>
            <Text style={s.ghostTxt}>Create an account</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={s.foot}>Powered by Spark AI · v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: T.bg0 },
  bgGrid: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    // Subtle radial glow top-right
    backgroundColor: 'transparent',
  },
  scroll: { paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },

  brand: { alignItems: 'center', marginBottom: 40 },
  logoRing: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 20, position: 'relative' },
  logoDisk: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: T.bg2,
    borderWidth: 2, borderColor: T.accent,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  logoGlow: {
    position: 'absolute', width: 100, height: 100, borderRadius: 50,
    backgroundColor: T.accentGlow,
    zIndex: 1,
  },
  logoText: { fontSize: 22, fontWeight: '900', color: T.accent, letterSpacing: 1 },
  appName: { fontSize: 32, fontWeight: '900', color: T.text, letterSpacing: 6, marginBottom: 8 },
  tagline: { fontSize: 10, color: T.text3, letterSpacing: 3, marginTop: 6 },

  card: {
    backgroundColor: T.bg2, borderRadius: 20, borderWidth: 1, borderColor: T.border,
    padding: 28, marginBottom: 28,
  },
  cardHead: { fontSize: 22, fontWeight: '700', color: T.text, marginBottom: 6 },
  cardSub:  { fontSize: 13, color: T.text3, marginBottom: 28, lineHeight: 18 },

  fieldWrap: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '700', color: T.text3, letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.bg4, borderRadius: 12,
    borderWidth: 1.5, borderColor: T.border,
    paddingHorizontal: 14, height: 52,
  },
  inputFocused: {
    borderColor: T.accent,
    backgroundColor: T.bg3,
    shadowColor: T.accentGlow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 4,
  },
  inputIco: { fontSize: 16, color: T.text3, marginRight: 12 },
  input: { flex: 1, fontSize: 15, color: T.text },
  eyeBtn: { padding: 6 },
  eyeTxt: { fontSize: 16, color: T.text3 },

  cta: {
    backgroundColor: T.accent, borderRadius: 12, height: 52,
    alignItems: 'center', justifyContent: 'center', marginTop: 4,
    shadowColor: T.accentGlow,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 16, elevation: 8,
  },
  ctaOff: { opacity: 0.55 },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: T.bg0, letterSpacing: 0.5 },

  divRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  divLine: { flex: 1, height: 1, backgroundColor: T.border },
  divTxt:  { marginHorizontal: 16, fontSize: 12, color: T.text4 },

  ghost: {
    borderRadius: 12, height: 50,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: T.border,
  },
  ghostTxt: { fontSize: 14, fontWeight: '600', color: T.text3 },

  foot: { textAlign: 'center', fontSize: 11, color: T.text4, letterSpacing: 0.5 },
});