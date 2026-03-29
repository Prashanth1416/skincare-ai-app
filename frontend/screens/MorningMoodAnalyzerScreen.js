/**
 * SKIN IQ — MorningMoodAnalyzerScreen
 * FIXED: Web live camera (front-facing), snapshot upload, full results display
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  ActivityIndicator, Alert, ScrollView, SafeAreaView,
  StatusBar, Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import api from '../api';

const T = {
  bg0: '#0D0D14', bg1: '#13131F', bg2: '#1A1A2E', bg3: '#22223A',
  border: '#2E2E50',
  text: '#F0EFF8', text2: '#B8B5D4', text3: '#7A7898', text4: '#4A4870',
  amber: '#FBBF24', amberDim: 'rgba(251,191,36,0.14)', amberGlow: 'rgba(251,191,36,0.30)',
  rose: '#FB7185', roseDim: 'rgba(251,113,133,0.14)',
  teal: '#2DD4BF', tealDim: 'rgba(45,212,191,0.14)',
  accent: '#39E07A',
  success: '#39E07A', warning: '#FBBF24', error: '#FF6B6B',
};

const MOOD_MAP = {
  energetic: { label: 'Energetic', emoji: '⚡', color: T.accent },
  normal: { label: 'Normal', emoji: '😊', color: T.teal },
  tired: { label: 'Tired', emoji: '😴', color: T.amber },
  very_tired: { label: 'Very Tired', emoji: '😫', color: T.error },
};
const SEV_CLR = { none: T.success, mild: T.amber, moderate: T.rose, severe: T.error };

const SevChip = ({ label, value }) => {
  const c = SEV_CLR[value] || T.text3;
  return (
    <View style={[chip.wrap, { borderColor: c + '55', backgroundColor: c + '14' }]}>
      <Text style={[chip.val, { color: c }]}>{(value || '—').toUpperCase()}</Text>
      <Text style={chip.lbl}>{label}</Text>
    </View>
  );
};
const chip = StyleSheet.create({
  wrap: { width: '48%', borderRadius: 14, borderWidth: 1.5, paddingVertical: 14, alignItems: 'center', gap: 4 },
  val: { fontSize: 13, fontWeight: '800', letterSpacing: 0.8 },
  lbl: { fontSize: 9, color: T.text3, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  WEB WEBCAM (front-facing for face/mood analysis)
// ─────────────────────────────────────────────────────────────────────────────
function useWebcam() {
  const containerRef = useRef(null);
  const videoElRef = useRef(null);
  const streamRef = useRef(null);

  const mountVideo = () => {
    if (!containerRef.current || videoElRef.current) return;
    const vid = document.createElement('video');
    vid.setAttribute('autoplay', '');
    vid.setAttribute('playsinline', '');
    vid.setAttribute('muted', '');
    // Mirror front camera
    vid.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;border-radius:16px;transform:scaleX(-1);';
    containerRef.current.appendChild(vid);
    videoElRef.current = vid;
  };

  const start = async () => {
    try {
      stop();
      mountVideo();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoElRef.current) {
        videoElRef.current.srcObject = stream;
        await videoElRef.current.play().catch(() => {});
      }
      return true;
    } catch (err) {
      console.warn('[WebCam] error:', err);
      return false;
    }
  };

  const snapshot = () =>
    new Promise((resolve) => {
      const vid = videoElRef.current;
      if (!vid || vid.readyState < 2) { resolve(null); return; }
      const canvas = document.createElement('canvas');
      canvas.width = vid.videoWidth || 640;
      canvas.height = vid.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(vid, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) { resolve(null); return; }
        resolve({
          file: new File([blob], 'morning_mood.jpg', { type: 'image/jpeg' }),
          uri: URL.createObjectURL(blob),
        });
      }, 'image/jpeg', 0.92);
    });

  const stop = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoElRef.current) videoElRef.current.srcObject = null;
  };

  return { containerRef, start, snapshot, stop };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function MorningMoodAnalyzerScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [permission, setPermission] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [confScore, setConfScore] = useState(0);
  const [streamOn, setStreamOn] = useState(false);
  const [camError, setCamError] = useState('');
  const [snapping, setSnapping] = useState(false);

  const cam = useWebcam();

  useEffect(() => {
    if (Platform.OS === 'web') { setPermission(true); return; }
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => () => { if (Platform.OS === 'web') cam.stop(); }, []);

  const openWebCam = async () => {
    setCamError('');
    setStreamOn(true);
    setTimeout(async () => {
      const ok = await cam.start();
      if (!ok) {
        setStreamOn(false);
        setCamError('Camera access denied. Please allow camera permission in your browser settings.');
      }
    }, 80);
  };

  const takePhoto = async () => {
    setSnapping(true);
    const snap = await cam.snapshot();
    setSnapping(false);
    if (!snap) { Alert.alert('Capture Failed', 'Could not read frame. Please try again.'); return; }
    cam.stop();
    setStreamOn(false);
    setPhotoUri(snap.uri);
    await sendImage(snap.uri, snap.file);
  };

  const cancelStream = () => { cam.stop(); setStreamOn(false); setCamError(''); };

  const retakeWeb = () => { setResult(null); setPhotoUri(null); setConfScore(0); openWebCam(); };

  const openNativeCam = async () => {
    if (!permission) { Alert.alert('Permission Required', 'Camera access is needed.'); return; }
    try {
      const res = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.85 });
      if (res && !res.cancelled && res.assets?.length > 0) {
        const uri = res.assets[0].uri;
        setPhotoUri(uri);
        await sendImage(uri, null);
      }
    } catch (e) { Alert.alert('Camera Error', e.message); }
  };

  const sendImage = async (uri, webFile) => {
    try {
      setLoading(true); setResult(null); setConfScore(0);
      const fd = new FormData();
      if (Platform.OS === 'web' && webFile) {
        fd.append('image', webFile, 'morning_mood.jpg');
      } else {
        fd.append('image', { uri, name: 'morning_mood.jpg', type: 'image/jpeg' });
      }
      const res = await api.post('/api/analyze-morning-mood', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      setConfScore(res.data.model_confidence ? Math.round(res.data.model_confidence * 100) : 82);
      setResult(res.data);
    } catch (err) {
      Alert.alert('Analysis Error', err?.response?.data?.error || 'Failed to analyse. Make sure the server is running.');
    } finally { setLoading(false); }
  };

  const resetAll = () => {
    cam.stop();
    setResult(null); setPhotoUri(null); setConfScore(0);
    setStreamOn(false); setCamError('');
  };

  const moodCfg = result ? (MOOD_MAP[result.morning_mood] || MOOD_MAP.normal) : null;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg1} />

      <View style={s.topBar}>
        <TouchableOpacity onPress={() => { resetAll(); navigation.goBack(); }} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>Morning Mood</Text>
        <View style={[s.topBadge, { backgroundColor: T.amberDim, borderColor: T.amber + '50' }]}>
          <Text style={[s.topBadgeTxt, { color: T.amber }]}>🌅 MOOD</Text>
        </View>
      </View>

      {!result ? (
        <ScrollView contentContainerStyle={s.main} showsVerticalScrollIndicator={false}>

          <View style={[s.tagPill, { backgroundColor: T.amberDim, borderColor: T.amber + '44' }]}>
            <Text style={[s.tagTxt, { color: T.amber }]}>✦  Morning Ritual  ✦</Text>
          </View>
          <Text style={s.promptTitle}>How does your face look this morning?</Text>
          <Text style={s.promptSub}>We analyse dark circles, puffiness, and skin tone to understand your sleep quality and mood.</Text>

          {/* VIEWFINDER */}
          <View style={s.viewfinder}>
            {Platform.OS === 'web' && streamOn && (
              <View ref={cam.containerRef} style={StyleSheet.absoluteFillObject} />
            )}
            {photoUri && !streamOn && (
              <Image source={{ uri: photoUri }} style={s.preview} />
            )}
            {!streamOn && !photoUri && (
              <View style={s.placeholder}>
                <Text style={{ fontSize: 52, marginBottom: 10 }}>🌅</Text>
                <Text style={s.phTxt}>Camera preview</Text>
              </View>
            )}
            {loading && (
              <View style={s.overlay}>
                <ActivityIndicator size="large" color={T.amber} />
                <Text style={s.overlayTxt}>Analysing mood…</Text>
              </View>
            )}
            {[s.cTL, s.cTR, s.cBL, s.cBR].map((cs, i) => (
              <View key={i} style={[s.corner, cs]} />
            ))}
            <View style={s.scanLabel}>
              <Text style={[s.scanLabelTxt, { color: T.amber }]}>
                {streamOn ? '● LIVE' : 'MOOD SCANNER'}
              </Text>
            </View>
          </View>

          {camError ? (
            <View style={s.errorBanner}>
              <Text style={s.errorIco}>⚠</Text>
              <Text style={s.errorBannerTxt}>{camError}</Text>
            </View>
          ) : null}

          {!streamOn && (
            <View style={s.hintCard}>
              <Text style={s.hintHead}>What we detect</Text>
              {[
                ['👁️', 'Dark Circles', 'Periorbital pigmentation analysis'],
                ['💧', 'Skin Puffiness', 'Facial swelling & fluid retention'],
                ['🌙', 'Sleep Quality', 'Estimated from visual cues'],
              ].map(([ico, lbl, desc], i) => (
                <View key={i} style={s.hintRow}>
                  <View style={[s.hintIcoWrap, { backgroundColor: T.amberDim }]}>
                    <Text style={{ fontSize: 18 }}>{ico}</Text>
                  </View>
                  <View>
                    <Text style={s.hintLbl}>{lbl}</Text>
                    <Text style={s.hintDesc}>{desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* BUTTONS */}
          {Platform.OS === 'web' ? (
            <View style={s.btnGroup}>
              {!streamOn ? (
                <TouchableOpacity style={[s.cta, loading && s.ctaOff]} onPress={openWebCam} disabled={loading} activeOpacity={0.85}>
                  <Text style={s.ctaIco}>🌅</Text>
                  <Text style={s.ctaTxt}>Open Front Camera</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity
                    style={[s.cta, s.ctaShoot, (snapping || loading) && s.ctaOff]}
                    onPress={takePhoto}
                    disabled={snapping || loading}
                    activeOpacity={0.85}
                  >
                    {snapping
                      ? <><ActivityIndicator size="small" color={T.bg0} /><Text style={[s.ctaTxt, { marginLeft: 8 }]}>Capturing…</Text></>
                      : <><Text style={s.ctaIco}>◎</Text><Text style={s.ctaTxt}>Take Photo</Text></>}
                  </TouchableOpacity>
                  <TouchableOpacity style={s.cancelBtn} onPress={cancelStream}>
                    <Text style={s.cancelTxt}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
              <Text style={s.webNote}>
                {streamOn ? 'Face the camera, then tap Take Photo.' : 'Your front camera opens live for mood analysis.'}
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={[s.cta, loading && s.ctaOff]} onPress={openNativeCam} disabled={loading} activeOpacity={0.85}>
              {loading
                ? <><ActivityIndicator size="small" color={T.bg0} /><Text style={[s.ctaTxt, { marginLeft: 10 }]}>Analysing…</Text></>
                : <><Text style={s.ctaIco}>📸</Text><Text style={s.ctaTxt}>Capture Face</Text></>}
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={s.results} showsVerticalScrollIndicator={false}>

          {photoUri && (
            <View style={s.photoWrap}>
              <Image source={{ uri: photoUri }} style={s.photo} />
              <View style={[s.moodTag, { backgroundColor: moodCfg?.color + '20', borderColor: moodCfg?.color + '70' }]}>
                <Text style={s.moodTagEmoji}>{moodCfg?.emoji}</Text>
                <Text style={[s.moodTagTxt, { color: moodCfg?.color }]}>{moodCfg?.label?.toUpperCase()}</Text>
              </View>
            </View>
          )}

          <View style={s.confCard}>
            <View style={s.confRow}>
              <Text style={s.confLbl}>AI Confidence</Text>
              <Text style={[s.confVal, { color: confScore > 70 ? T.success : T.warning }]}>{confScore}%</Text>
            </View>
            <View style={s.confTrack}>
              <View style={[s.confFill, { width: `${confScore}%`, backgroundColor: confScore > 70 ? T.success : T.warning }]} />
            </View>
          </View>

          <View style={s.chipGrid}>
            <SevChip label="Mood" value={result.morning_mood} />
            <SevChip label="Sleep" value={result.sleep_quality_estimate} />
            <SevChip label="Dark Circles" value={result.dark_circle_severity} />
            <SevChip label="Puffiness" value={result.skin_puffiness} />
          </View>

          <View style={[s.sleepCard, { borderColor: T.teal + '44', backgroundColor: T.tealDim }]}>
            <Text style={{ fontSize: 28 }}>🌙</Text>
            <View>
              <Text style={s.sleepLbl}>Estimated Sleep Duration</Text>
              <Text style={[s.sleepVal, { color: T.teal }]}>{result.estimated_sleep_hours}</Text>
            </View>
          </View>

          {result.model_prediction && (
            <View style={s.aiCard}>
              <Text style={s.aiLbl}>🤖 AI Detected Skin Type</Text>
              <Text style={[s.aiVal, { color: T.amber }]}>{result.model_prediction?.toUpperCase()}</Text>
            </View>
          )}

          {result.remedies && (
            <View style={s.remCard}>
              <Text style={s.remTitle}>💊 Remedies & Care</Text>

              {result.remedies.immediate_steps?.length > 0 && (
                <View style={s.remSec}>
                  <Text style={[s.remSecTitle, { color: T.rose }]}>IMMEDIATE STEPS</Text>
                  {result.remedies.immediate_steps.map((step, i) => (
                    <View key={i} style={s.remRow}>
                      <View style={[s.remNum, { backgroundColor: T.roseDim, borderColor: T.rose + '50' }]}>
                        <Text style={[s.remNumTxt, { color: T.rose }]}>{i + 1}</Text>
                      </View>
                      <Text style={s.remTxt}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}

              {result.remedies.skincare_routine?.length > 0 && (
                <View style={s.remSec}>
                  <Text style={[s.remSecTitle, { color: T.teal }]}>SKINCARE ROUTINE</Text>
                  {result.remedies.skincare_routine.map((r, i) => (
                    <View key={i} style={s.remRow}>
                      <Text style={[s.remBullet, { color: T.teal }]}>✦</Text>
                      <Text style={s.remTxt}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}

              {result.remedies.supplements?.length > 0 && (
                <View style={s.remSec}>
                  <Text style={[s.remSecTitle, { color: T.amber }]}>SUPPLEMENTS</Text>
                  {result.remedies.supplements.map((r, i) => (
                    <View key={i} style={s.remRow}>
                      <Text style={[s.remBullet, { color: T.amber }]}>◆</Text>
                      <Text style={s.remTxt}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}

              {result.remedies.diet_suggestions?.length > 0 && (
                <View style={s.remSec}>
                  <Text style={[s.remSecTitle, { color: T.accent }]}>DIET SUGGESTIONS</Text>
                  {result.remedies.diet_suggestions.map((r, i) => (
                    <View key={i} style={s.remRow}>
                      <Text style={[s.remBullet, { color: T.accent }]}>●</Text>
                      <Text style={s.remTxt}>{r}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <View style={s.actionRow}>
            <TouchableOpacity style={[s.actP, { backgroundColor: T.amber }]} onPress={Platform.OS === 'web' ? retakeWeb : resetAll} activeOpacity={0.85}>
              <Text style={s.actPTxt}>Analyse Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actS} onPress={() => navigation.navigate('History')} activeOpacity={0.8}>
              <Text style={s.actSTxt}>View History</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: 30 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg0 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 13, backgroundColor: T.bg1, borderBottomWidth: 1, borderBottomColor: T.border },
  backBtn: { padding: 4 },
  backTxt: { fontSize: 14, color: T.text3, fontWeight: '600' },
  topTitle: { fontSize: 16, fontWeight: '800', color: T.text },
  topBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  topBadgeTxt: { fontSize: 11, fontWeight: '700' },

  main: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 30, alignItems: 'center' },
  tagPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginBottom: 18 },
  tagTxt: { fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  promptTitle: { fontSize: 22, fontWeight: '800', color: T.text, textAlign: 'center', marginBottom: 10, lineHeight: 28 },
  promptSub: { fontSize: 13, color: T.text3, textAlign: 'center', lineHeight: 19, marginBottom: 22 },

  viewfinder: {
    width: '100%', height: 260, borderRadius: 20,
    backgroundColor: T.bg3, borderWidth: 1.5, borderColor: T.border,
    overflow: 'hidden', marginBottom: 18,
    position: 'relative', alignItems: 'center', justifyContent: 'center',
  },
  preview: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', gap: 8 },
  phTxt: { fontSize: 13, color: T.text4 },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(13,13,20,0.78)', alignItems: 'center', justifyContent: 'center', gap: 12 },
  overlayTxt: { fontSize: 14, color: T.text2, fontWeight: '600' },

  corner: { position: 'absolute', width: 20, height: 20, borderColor: T.amber, borderWidth: 2.5 },
  cTL: { top: 12, left: 12, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
  cTR: { top: 12, right: 12, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
  cBL: { bottom: 12, left: 12, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
  cBR: { bottom: 12, right: 12, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

  scanLabel: { position: 'absolute', bottom: 12, left: 0, right: 0, alignItems: 'center' },
  scanLabelTxt: { fontSize: 9, fontWeight: '700', letterSpacing: 3, backgroundColor: T.bg0 + 'CC', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 20 },

  errorBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, width: '100%', backgroundColor: 'rgba(255,107,107,0.12)', borderRadius: 12, borderWidth: 1, borderColor: T.error + '40', padding: 12, marginBottom: 14 },
  errorIco: { fontSize: 16, color: T.error, marginTop: 1 },
  errorBannerTxt: { flex: 1, fontSize: 12, color: T.error, lineHeight: 18 },

  hintCard: { width: '100%', backgroundColor: T.bg2, borderRadius: 16, borderWidth: 1, borderColor: T.border, padding: 16, marginBottom: 22 },
  hintHead: { fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 12 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  hintIcoWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hintLbl: { fontSize: 13, fontWeight: '700', color: T.text, marginBottom: 2 },
  hintDesc: { fontSize: 11, color: T.text3 },

  btnGroup: { width: '100%', gap: 10 },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: T.amber, borderRadius: 14, height: 56, width: '100%', shadowColor: T.amberGlow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 16, elevation: 8 },
  ctaShoot: { backgroundColor: '#F59E0B' },
  ctaOff: { opacity: 0.55 },
  ctaIco: { fontSize: 22, color: T.bg0 },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: T.bg0 },
  cancelBtn: { height: 46, width: '100%', borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg3 },
  cancelTxt: { fontSize: 14, color: T.text3, fontWeight: '600' },
  webNote: { fontSize: 11, color: T.text4, textAlign: 'center', lineHeight: 17, fontStyle: 'italic', marginTop: 4 },

  results: { paddingHorizontal: 20, paddingTop: 20 },
  photoWrap: { borderRadius: 18, overflow: 'hidden', marginBottom: 14, position: 'relative' },
  photo: { width: '100%', height: 210, borderRadius: 18 },
  moodTag: { position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  moodTagEmoji: { fontSize: 16 },
  moodTagTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  confCard: { backgroundColor: T.bg2, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 16, marginBottom: 12 },
  confRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  confLbl: { fontSize: 12, color: T.text3, fontWeight: '600' },
  confVal: { fontSize: 22, fontWeight: '900' },
  confTrack: { height: 5, backgroundColor: T.border, borderRadius: 3, overflow: 'hidden' },
  confFill: { height: '100%', borderRadius: 3 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },

  sleepCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  sleepLbl: { fontSize: 10, color: T.text3, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  sleepVal: { fontSize: 16, fontWeight: '800' },

  aiCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.bg2, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 14, marginBottom: 14 },
  aiLbl: { fontSize: 12, color: T.text3, fontWeight: '600' },
  aiVal: { fontSize: 14, fontWeight: '800' },

  remCard: { backgroundColor: T.bg2, borderRadius: 16, borderWidth: 1, borderColor: T.border, borderLeftWidth: 3, borderLeftColor: T.amber, padding: 18, marginBottom: 16 },
  remTitle: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 16 },
  remSec: { marginBottom: 14 },
  remSecTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' },
  remRow: { flexDirection: 'row', gap: 10, marginBottom: 7, alignItems: 'flex-start' },
  remNum: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  remNumTxt: { fontSize: 10, fontWeight: '900' },
  remBullet: { fontSize: 12, marginTop: 3 },
  remTxt: { fontSize: 13, color: T.text2, flex: 1, lineHeight: 19 },

  actionRow: { flexDirection: 'row', gap: 12 },
  actP: { flex: 1, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actPTxt: { fontSize: 14, fontWeight: '800', color: T.bg0 },
  actS: { flex: 1, height: 50, borderRadius: 12, backgroundColor: T.bg3, borderWidth: 1.5, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  actSTxt: { fontSize: 14, fontWeight: '600', color: T.text3 },
});