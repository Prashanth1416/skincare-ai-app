import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import api from '../api';

const { width } = Dimensions.get('window');

const PRODUCT_LINKS = {
  cleanser: [
    {
      name: 'CeraVe Foaming Cleanser',
      link: 'https://www.cerave.com/skincare/cleansers/foaming-facial-cleanser',
      why: 'Helps remove excess oil and daily buildup without making the skin feel stripped.',
    },
    {
      name: 'La Roche-Posay Toleriane Purifying Cleanser',
      link: 'https://www.laroche-posay.us/',
      why: 'A good option for combination and acne-prone skin needing a balanced cleanse.',
    },
  ],
  treatment: [
    {
      name: 'The Ordinary Niacinamide 10% + Zinc 1%',
      link: 'https://theordinary.com/en-us/niacinamide-10-zinc-1-serum-100436.html',
      why: 'Useful for visible pores, oil balance, and supporting an overall clearer appearance.',
    },
    {
      name: 'Paula’s Choice 2% BHA Liquid Exfoliant',
      link: 'https://www.paulaschoice.com/',
      why: 'Helpful when congestion, blackheads, and recurring clogged pores are part of the concern pattern.',
    },
    {
      name: 'Azelaic Acid Serum',
      link: 'https://www.theinkeylist.com/',
      why: 'A strong option for redness, acne marks, and uneven tone with a gentler feel than harsher acids.',
    },
  ],
  moisturizer: [
    {
      name: 'CeraVe PM Facial Moisturizing Lotion',
      link: 'https://www.cerave.com/skincare/moisturizers/pm-facial-moisturizing-lotion',
      why: 'Supports hydration and barrier repair without feeling too heavy for oily or combination skin.',
    },
    {
      name: 'Neutrogena Hydro Boost Water Gel',
      link: 'https://www.neutrogena.com/',
      why: 'Comfortable lightweight hydration for skin that feels oily but still dehydrated.',
    },
  ],
  sunscreen: [
    {
      name: 'La Roche-Posay Anthelios',
      link: 'https://www.laroche-posay.us/',
      why: 'Important for preventing post-acne marks from getting darker and for protecting treatment progress.',
    },
    {
      name: 'Beauty of Joseon Relief Sun',
      link: 'https://beautyofjoseon.com/',
      why: 'Popular for lightweight daily wear and good layering under daytime skincare.',
    },
  ],
};

const buildDetailedAdvice = (analysis) => {
  const skinType = analysis?.skin_type || 'Combination';
  const sensitivity = analysis?.sensitivity || 'Moderate';
  const acneRisk = analysis?.acne_risk || 'Moderate';
  const hydration = analysis?.hydration || 'Needs attention';
  const concerns = analysis?.concerns || ['texture imbalance', 'congestion'];

  return {
    summary: `Your image analysis suggests ${skinType.toLowerCase()} skin with ${sensitivity.toLowerCase()} sensitivity, ${acneRisk.toLowerCase()} acne risk, and hydration that currently ${hydration.toLowerCase()}. The strongest visible focus areas appear to be ${concerns.join(', ')}, so the best results will usually come from a consistent routine built around balancing oil, supporting the skin barrier, and treating congestion gradually instead of using too many strong products at once.`,
    remedies: [
      'Keep cleansing gentle and consistent. A harsh cleanser may reduce oil briefly, but it often increases irritation and can leave the skin barrier weaker over time.',
      'Use one main active treatment at a time. Niacinamide is a strong everyday option for oil balance and pore appearance, while salicylic acid is better for clogged pores and blackheads when used a few times per week.',
      'If the skin is oily but still looks tired or rough, increase hydration instead of only increasing treatment. Oily skin can still be dehydrated, which often makes texture and shine look worse.',
      'Use sunscreen every morning if you are trying to improve acne marks, dullness, or uneven tone. Without it, visible improvement becomes slower and post-inflammatory marks last longer.',
      'Track how your skin reacts across a few weeks rather than changing products every few days. Skin often improves more from consistency than from adding more steps.',
    ],
    routineMorning: [
      'Gentle cleanser or water rinse depending on morning oiliness.',
      'Balancing serum such as niacinamide or a mild antioxidant.',
      'Lightweight moisturiser.',
      'Broad-spectrum sunscreen as the final step.',
    ],
    routineNight: [
      'Cleanser to remove sunscreen, oil, and debris.',
      'One focused treatment step such as BHA, azelaic acid, or a balancing serum.',
      'Barrier-supportive moisturiser.',
      'Spot treatment only on active blemishes if needed.',
    ],
    cautions: [
      'Do not combine multiple strong acids and retinoid-style products immediately.',
      'Avoid over-scrubbing, harsh cleansing, and alcohol-heavy formulas if sensitivity is present.',
      'If redness, burning, or peeling increases, reduce active frequency and prioritise hydration and barrier repair.',
    ],
  };
};

const Section = ({ icon, title, children }) => (
  <View style={styles.sectionCard}>
    <View style={styles.sectionHeader}>
      <MaterialCommunityIcons name={icon} size={18} color="#78e5d5" />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {children}
  </View>
);

const ProductCard = ({ item, label }) => (
  <TouchableOpacity
    activeOpacity={0.88}
    style={styles.productCard}
    onPress={() => {
      if (Platform.OS === 'web') {
        window.open(item.link, '_blank', 'noopener,noreferrer');
      }
    }}
  >
    <Text style={styles.productLabel}>{label}</Text>
    <Text style={styles.productName}>{item.name}</Text>
    <Text style={styles.productWhy}>{item.why}</Text>
    <View style={styles.productLinkRow}>
      <Text numberOfLines={1} style={styles.productLink}>
        {item.link}
      </Text>
      <Feather name="external-link" size={15} color="#7fe7d7" />
    </View>
  </TouchableOpacity>
);

export default function CameraScreen({ navigation }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const [webCameraOpen, setWebCameraOpen] = useState(false);
  const [webCameraReady, setWebCameraReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const detailedAdvice = useMemo(() => buildDetailedAdvice(analysis), [analysis]);

  useEffect(() => {
    return () => {
      stopWebCamera();
    };
  }, []);

  const stopWebCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setWebCameraReady(false);
    setWebCameraOpen(false);
  };

  const openWebCamera = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        Alert.alert('Camera not supported', 'Your browser does not support webcam access.');
        return;
      }

      stopWebCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });

      streamRef.current = stream;
      setWebCameraOpen(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = async () => {
            try {
              await videoRef.current.play();
              setWebCameraReady(true);
            } catch (e) {}
          };
        }
      }, 50);
    } catch (error) {
      Alert.alert(
        'Unable to open webcam',
        'Please allow camera access in the browser and make sure no other app is blocking the camera.'
      );
    }
  };

  const dataUrlToBlob = (dataUrl) => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const analyzeWebCapture = async (dataUrl) => {
    try {
      setLoading(true);
      setAnalysis(null);
      setSelectedImage(dataUrl);

      const blob = dataUrlToBlob(dataUrl);
      const formData = new FormData();
      formData.append('image', blob, `webcam-capture-${Date.now()}.jpg`);

      const response = await api.post('/api/analyze-skin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response?.data || {};
      setAnalysis({
        skin_type: data.skin_type || 'Combination',
        sensitivity: data.sensitivity || 'Moderate',
        acne_risk: data.acne_risk || 'Moderate',
        hydration: data.hydration || 'Needs attention',
        concerns: data.concerns || ['texture imbalance', 'congestion'],
        score: data.score || 84,
      });
    } catch (error) {
      Alert.alert(
        'Analysis failed',
        error?.response?.data?.error || 'Could not analyse the captured image.'
      );
    } finally {
      setLoading(false);
      stopWebCamera();
    }
  };

  const captureFromWebCamera = async () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        Alert.alert('Camera not ready', 'Please wait for the live camera preview to load.');
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;

      const videoWidth = video.videoWidth || 1280;
      const videoHeight = video.videoHeight || 960;

      canvas.width = videoWidth;
      canvas.height = videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      await analyzeWebCapture(dataUrl);
    } catch (error) {
      Alert.alert('Capture failed', 'Unable to capture an image from the live webcam.');
    }
  };

  const requestPermissionsIfNeeded = async () => {
    if (Platform.OS !== 'web') {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to capture a skin image.');
        return false;
      }
    }
    return true;
  };

  const analyzeNativeAsset = async (asset) => {
    try {
      setLoading(true);
      setAnalysis(null);
      setSelectedImage(asset.uri);

      const formData = new FormData();
      formData.append('image', {
        uri: asset.uri,
        name: asset.fileName || `skin-analysis-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });

      const response = await api.post('/api/analyze-skin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = response?.data || {};
      setAnalysis({
        skin_type: data.skin_type || 'Combination',
        sensitivity: data.sensitivity || 'Moderate',
        acne_risk: data.acne_risk || 'Moderate',
        hydration: data.hydration || 'Needs attention',
        concerns: data.concerns || ['texture imbalance', 'congestion'],
        score: data.score || 84,
      });
    } catch (error) {
      Alert.alert(
        'Analysis failed',
        error?.response?.data?.error || 'Unable to analyse the image right now.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleNativeCamera = async () => {
    const allowed = await requestPermissionsIfNeeded();
    if (!allowed) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets?.length) {
        await analyzeNativeAsset(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Camera error', 'Unable to open the device camera.');
    }
  };

  const handleGalleryPick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets?.length) {
        await analyzeNativeAsset(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Upload error', 'Unable to open the gallery.');
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color="#8cf0e1" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <View style={styles.heroIcon}>
              <Ionicons name="scan-outline" size={28} color="#07161a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>LIVE FACE SCAN</Text>
              <Text style={styles.heroTitle}>Smart skin capture</Text>
              <Text style={styles.heroSub}>
                Use a live webcam capture on web or the native camera on mobile to analyse visible skin condition, concerns, and routine direction.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.cameraBoard}>
          <View style={styles.cameraHeaderRow}>
            <Text style={styles.cameraBoardTitle}>Capture panel</Text>
            <Text style={styles.cameraBoardHint}>This screen has its own camera-first layout</Text>
          </View>

          <View style={styles.frameWrap}>
            {Platform.OS === 'web' && webCameraOpen ? (
              <View style={styles.webcamStage}>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  autoPlay
                  style={styles.webcamVideo}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveBadgeText}>{webCameraReady ? 'Live webcam active' : 'Starting webcam...'}</Text>
                </View>
              </View>
            ) : selectedImage ? (
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <View style={styles.emptyStage}>
                <MaterialCommunityIcons name="camera-iris" size={56} color="#7fe7d7" />
                <Text style={styles.emptyStageTitle}>Ready for live capture</Text>
                <Text style={styles.emptyStageText}>
                  On web, the Capture button opens the webcam directly. On mobile, it opens the native camera. Use clear front lighting and keep the whole face visible.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.tipGrid}>
            <View style={styles.tipCard}>
              <Ionicons name="sunny-outline" size={16} color="#ffd06a" />
              <Text style={styles.tipText}>Use bright, even light.</Text>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="person-outline" size={16} color="#7fe7d7" />
              <Text style={styles.tipText}>Keep full face visible.</Text>
            </View>
            <View style={styles.tipCard}>
              <Ionicons name="sparkles-outline" size={16} color="#c2b0ff" />
              <Text style={styles.tipText}>Avoid filters and blur.</Text>
            </View>
          </View>

          {Platform.OS === 'web' && webCameraOpen ? (
            <View style={styles.webcamActionRow}>
              <TouchableOpacity
                style={[styles.captureShotButton, loading && styles.disabledButton]}
                onPress={captureFromWebCamera}
                activeOpacity={0.9}
                disabled={loading || !webCameraReady}
              >
                {loading ? (
                  <ActivityIndicator color="#07161a" />
                ) : (
                  <>
                    <Ionicons name="camera" size={18} color="#07161a" />
                    <Text style={styles.captureShotText}>Capture & Analyse</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelCameraButton}
                onPress={stopWebCamera}
                activeOpacity={0.88}
                disabled={loading}
              >
                <Text style={styles.cancelCameraText}>Cancel Webcam</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.primaryActions}>
              <TouchableOpacity
                style={[styles.openCameraButton, loading && styles.disabledButton]}
                onPress={Platform.OS === 'web' ? openWebCamera : handleNativeCamera}
                activeOpacity={0.9}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#07161a" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={18} color="#07161a" />
                    <Text style={styles.openCameraText}>
                      {Platform.OS === 'web' ? 'Open Live Webcam' : 'Open Camera'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.galleryButton, loading && styles.disabledButton]}
                onPress={handleGalleryPick}
                activeOpacity={0.88}
                disabled={loading}
              >
                <Ionicons name="images-outline" size={18} color="#dffcf7" />
                <Text style={styles.galleryText}>Upload Instead</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {analysis && (
          <View style={styles.resultStack}>
            <View style={styles.summaryPanel}>
              <View>
                <Text style={styles.summaryEyebrow}>ANALYSIS RESULT</Text>
                <Text style={styles.summaryTitle}>Personal skin overview</Text>
              </View>
              <View style={styles.scoreChip}>
                <Text style={styles.scoreNumber}>{analysis.score}</Text>
                <Text style={styles.scoreLabel}>Score</Text>
              </View>
            </View>

            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Skin Type</Text>
                <Text style={styles.metricValue}>{analysis.skin_type}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Sensitivity</Text>
                <Text style={styles.metricValue}>{analysis.sensitivity}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Acne Risk</Text>
                <Text style={styles.metricValue}>{analysis.acne_risk}</Text>
              </View>
            </View>

            <Section icon="text-box-search-outline" title="Detailed summary">
              <Text style={styles.bodyText}>{detailedAdvice.summary}</Text>
            </Section>

            <Section icon="medical-bag" title="Personalised remedies">
              {detailedAdvice.remedies.map((item, index) => (
                <View key={`remedy-${index}`} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </Section>

            <Section icon="clock-outline" title="Routine suggestion">
              <Text style={styles.subTitle}>Morning</Text>
              {detailedAdvice.routineMorning.map((item, index) => (
                <View key={`morning-${index}`} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}

              <Text style={[styles.subTitle, { marginTop: 14 }]}>Night</Text>
              {detailedAdvice.routineNight.map((item, index) => (
                <View key={`night-${index}`} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </Section>

            <Section icon="alert-outline" title="Precautions">
              {detailedAdvice.cautions.map((item, index) => (
                <View key={`caution-${index}`} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: '#ffd06a' }]} />
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </Section>

            <Section icon="shopping-outline" title="Suggested products with links">
              <Text style={styles.categoryTitle}>Cleanser</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
                {PRODUCT_LINKS.cleanser.map((item, index) => (
                  <ProductCard key={`cleanser-${index}`} item={item} label="cleanser" />
                ))}
              </ScrollView>

              <Text style={styles.categoryTitle}>Treatments</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
                {PRODUCT_LINKS.treatment.map((item, index) => (
                  <ProductCard key={`treatment-${index}`} item={item} label="treatment" />
                ))}
              </ScrollView>

              <Text style={styles.categoryTitle}>Moisturiser</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
                {PRODUCT_LINKS.moisturizer.map((item, index) => (
                  <ProductCard key={`moisturizer-${index}`} item={item} label="moisturiser" />
                ))}
              </ScrollView>

              <Text style={styles.categoryTitle}>Sunscreen</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
                {PRODUCT_LINKS.sunscreen.map((item, index) => (
                  <ProductCard key={`sunscreen-${index}`} item={item} label="sunscreen" />
                ))}
              </ScrollView>
            </Section>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const stageHeight = Platform.OS === 'web'
  ? Math.min(520, width * 0.52)
  : Math.min(500, width * 1.02);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#07161a',
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 36,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  backText: {
    color: '#8cf0e1',
    fontSize: 15,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#0d252b',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e474f',
    padding: 18,
    marginBottom: 18,
  },
  heroLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#7fe7d7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: '#8bb8b1',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#ecfffb',
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  heroSub: {
    color: '#b8d7d1',
    fontSize: 14,
    lineHeight: 22,
  },
  cameraBoard: {
    backgroundColor: '#0c1d21',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#18363d',
    padding: 16,
    marginBottom: 18,
  },
  cameraHeaderRow: {
    marginBottom: 12,
  },
  cameraBoardTitle: {
    color: '#f0fffc',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  cameraBoardHint: {
    color: '#95b7b0',
    fontSize: 13,
  },
  frameWrap: {
    height: stageHeight,
    borderRadius: 26,
    overflow: 'hidden',
    backgroundColor: '#081216',
    borderWidth: 1,
    borderColor: '#2b555d',
    marginBottom: 14,
  },
  webcamStage: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
  },
  webcamVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  emptyStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyStageTitle: {
    color: '#eafffb',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 8,
  },
  emptyStageText: {
    color: '#b5d4ce',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 640,
  },
  liveBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(5, 18, 22, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#65f0da',
  },
  liveBadgeText: {
    color: '#ecfffb',
    fontSize: 12,
    fontWeight: '700',
  },
  tipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10292e',
    borderWidth: 1,
    borderColor: '#1f4a52',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  tipText: {
    color: '#dbf5f0',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryActions: {
    gap: 12,
  },
  openCameraButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#7fe7d7',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  openCameraText: {
    color: '#07161a',
    fontSize: 15,
    fontWeight: '900',
  },
  galleryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: '#123238',
    borderWidth: 1,
    borderColor: '#275861',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  galleryText: {
    color: '#dffcf7',
    fontSize: 15,
    fontWeight: '800',
  },
  webcamActionRow: {
    gap: 12,
  },
  captureShotButton: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: '#7fe7d7',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  captureShotText: {
    color: '#07161a',
    fontSize: 15,
    fontWeight: '900',
  },
  cancelCameraButton: {
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: '#17343a',
    borderWidth: 1,
    borderColor: '#2a5760',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelCameraText: {
    color: '#dbf5f0',
    fontSize: 14,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.7,
  },
  resultStack: {
    gap: 14,
  },
  summaryPanel: {
    backgroundColor: '#0d252b',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#214a51',
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryEyebrow: {
    color: '#90bcb6',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  summaryTitle: {
    color: '#effffc',
    fontSize: 22,
    fontWeight: '900',
  },
  scoreChip: {
    width: 82,
    height: 82,
    borderRadius: 999,
    backgroundColor: '#123238',
    borderWidth: 1,
    borderColor: '#2a5f68',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreNumber: {
    color: '#7fe7d7',
    fontSize: 28,
    fontWeight: '900',
  },
  scoreLabel: {
    color: '#ccece6',
    fontSize: 11,
    fontWeight: '700',
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#10262b',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1b464d',
    padding: 14,
  },
  metricLabel: {
    color: '#8fbab3',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  metricValue: {
    color: '#eefffb',
    fontSize: 18,
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#0c1f24',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1d454d',
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#edfffb',
    fontSize: 17,
    fontWeight: '900',
  },
  bodyText: {
    color: '#d8f0eb',
    fontSize: 14,
    lineHeight: 22,
  },
  subTitle: {
    color: '#9cf4e7',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    backgroundColor: '#7fe7d7',
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    color: '#d9f1ec',
    fontSize: 14,
    lineHeight: 22,
  },
  categoryTitle: {
    color: '#9df6e8',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
    marginTop: 2,
  },
  productRow: {
    gap: 12,
    paddingBottom: 8,
    paddingRight: 8,
  },
  productCard: {
    width: Platform.OS === 'web' ? 300 : width * 0.76,
    backgroundColor: '#123038',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#295864',
    padding: 14,
  },
  productLabel: {
    color: '#9ef5e7',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  productName: {
    color: '#effffb',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  productWhy: {
    color: '#d2ece7',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  productLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  productLink: {
    flex: 1,
    color: '#7fe7d7',
    fontSize: 12,
    fontWeight: '700',
  },
});