import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import api from '../api';

const PMS_OPTIONS = ['None', 'Mild', 'Moderate', 'Severe'];

const PHASE_COPY = {
  Menstrual: {
    icon: 'water-outline',
    accent: '#ff7b93',
    tint: '#3b1625',
    badge: 'RESET PHASE',
    short: 'Days 1–5 · Shedding uterine lining',
    title: 'Menstrual Phase',
    meaning:
      'This is the first phase of the cycle and starts on the first day of active bleeding. Estrogen and progesterone are at their lowest, so energy can feel reduced, inflammation can increase slightly, and the skin barrier may become more reactive or dehydrated in some users.',
    feels: [
      'Energy may feel lower than usual, especially on the first 1–2 days.',
      'Cramping, bloating, back discomfort, fatigue, and tenderness may be more noticeable.',
      'Your body often benefits from slower movement, extra hydration, and barrier-supportive skincare.',
    ],
    emotions: [
      'It is common to feel inward, sensitive, tired, or emotionally heavy.',
      'Mental focus may feel slower, so gentler routines often work better than intense schedules.',
      'Rest, warmth, hydration, and lower-pressure self-care can help this phase feel more manageable.',
    ],
    skin: [
      'Skin may feel drier, duller, more sensitive, or slightly inflamed.',
      'Redness and dehydration can become more visible if the barrier is already compromised.',
      'If breakouts happen here, they are often linked to inflammation and stress rather than peak oil production.',
    ],
    strategy: [
      'Prioritise soothing, hydrating, and barrier-repair products.',
      'Avoid over-exfoliating or combining too many strong actives on sensitive days.',
      'Focus on cream cleansers, ceramides, hyaluronic acid, panthenol, centella, and rich moisturisers.',
    ],
    ingredients: ['Ceramides', 'Hyaluronic acid', 'Panthenol', 'Centella asiatica', 'Squalane', 'Colloidal oatmeal'],
    warning: 'Keep routines simple if your skin feels reactive or tender.',
  },
  Follicular: {
    icon: 'leaf-outline',
    accent: '#2dd4bf',
    tint: '#102b2a',
    badge: 'YOU ARE CURRENTLY IN',
    short: 'Days 6–13 · Rising estrogen',
    title: 'Follicular Phase',
    meaning:
      'After bleeding ends, estrogen begins rising steadily and the ovaries prepare an egg for ovulation. This phase is often associated with better energy, brighter mood, and a more resilient skin environment, which is why many people notice smoother texture and stronger tolerance to active skincare.',
    feels: [
      'Energy and motivation often begin to rise again.',
      'The body may feel lighter, less inflamed, and more physically capable.',
      'This phase is usually the easiest time to restart exercise and more structured routines.',
    ],
    emotions: [
      'Mood often becomes more optimistic, social, and mentally clear.',
      'Many users feel more productive and emotionally balanced here.',
      'This can be a strong phase for routine-building because energy and focus often improve together.',
    ],
    skin: [
      'Skin often appears calmer, more balanced, and slightly brighter.',
      'Oil production may be stable rather than excessive, so texture can look smoother.',
      'It is often a lower-risk period for irritation compared with the menstrual or late luteal days.',
    ],
    strategy: [
      'This is usually a good window for active ingredients if your barrier feels healthy.',
      'You can work on tone, early pigmentation, texture, and clogged pores more confidently.',
      'Keep a strong moisturiser and sunscreen in the routine so progress does not turn into irritation.',
    ],
    ingredients: ['Niacinamide', 'Vitamin C', 'Azelaic acid', 'PHA / gentle AHA', 'Peptides', 'Lightweight hydration'],
    warning: 'Good time for active ingredients, but do not over-layer acids and retinoids together.',
  },
  Ovulatory: {
    icon: 'sunny-outline',
    accent: '#fbbf24',
    tint: '#33240d',
    badge: 'HIGH-HORMONE WINDOW',
    short: 'Around day 14 · Peak estrogen',
    title: 'Ovulatory Phase',
    meaning:
      'Around ovulation, estrogen peaks and luteinizing hormone surges to release the egg. Skin can look especially vibrant and hydrated during this window, but some users also begin noticing the first signs of oil increase, congestion, or sensitivity if they are acne-prone.',
    feels: [
      'Energy can feel strongest and most outward-facing here.',
      'Some users feel physically lighter, more confident, or more active.',
      'A few people also notice temporary bloating, breast tenderness, or brief mid-cycle discomfort.',
    ],
    emotions: [
      'Mood may feel confident, expressive, and more socially open.',
      'This can be a high-clarity phase, though some people feel slightly overstimulated.',
      'If sleep, food, or stress are off, even this “better” phase can still feel uneven.',
    ],
    skin: [
      'Skin may look plumper, more luminous, and better hydrated.',
      'At the same time, oil can start increasing, especially around the T-zone.',
      'If congestion tends to appear after ovulation, this is the stage where prevention becomes important.',
    ],
    strategy: [
      'Use balancing and antioxidant-focused products while keeping pores clear.',
      'Gentle exfoliation can help if congestion begins, but do not strip the skin.',
      'Hydration plus lightweight sebum-balancing care works better than harsh anti-acne overload.',
    ],
    ingredients: ['Niacinamide', 'Vitamin C', 'Green tea', 'Salicylic acid (light use)', 'Zinc PCA', 'Gel moisturisers'],
    warning: 'Watch for the first signs of congestion if you usually break out later in the cycle.',
  },
  Luteal: {
    icon: 'moon-outline',
    accent: '#f59e0b',
    tint: '#362012',
    badge: 'PRE-PERIOD WINDOW',
    short: 'Days 15–28 · Progesterone rises',
    title: 'Luteal Phase',
    meaning:
      'After ovulation, progesterone rises and the body prepares for a possible pregnancy. During the later luteal days, many users notice increased oiliness, swelling, tenderness, dullness, and hormonal breakouts, especially around the chin, jawline, and lower cheeks.',
    feels: [
      'Bloating, cravings, heaviness, breast tenderness, and lower patience can become more noticeable.',
      'Energy may decline gradually, especially in the late luteal stage.',
      'Sleep quality, digestion, and stress sensitivity can influence how intense symptoms feel.',
    ],
    emotions: [
      'Mood may feel more reactive, anxious, irritable, or emotionally tired.',
      'You may prefer lower-friction routines and less stimulation.',
      'Planning gentler days and simpler routines can reduce frustration in this phase.',
    ],
    skin: [
      'Oil production often increases and pores may look more visible.',
      'Hormonal acne, congestion, under-skin bumps, and puffiness are more common here.',
      'Skin can be oily and dehydrated at the same time, so harsh drying products can make things worse.',
    ],
    strategy: [
      'Focus on congestion control, calming inflammation, and protecting the barrier.',
      'Use targeted acne care consistently rather than aggressively.',
      'Keep routines clean and structured: gentle cleanser, balancing serum, spot support, moisturiser, sunscreen.',
    ],
    ingredients: ['Salicylic acid', 'Niacinamide', 'Azelaic acid', 'Sulfur spot care', 'Clay mask 1x weekly', 'Non-comedogenic moisturiser'],
    warning: 'This is the phase where hormonal acne risk is highest, especially with moderate to severe PMS.',
  },
};

const ACCORDION_SECTIONS = [
  { key: 'feels', label: 'How Your Body Feels', icon: 'heart-half-full' },
  { key: 'emotions', label: 'Emotional Landscape', icon: 'brain' },
  { key: 'skin', label: 'Skin During This Phase', icon: 'sparkles' },
  { key: 'strategy', label: 'Skincare Strategy', icon: 'bottle-tonic-plus-outline' },
  { key: 'ingredients', label: 'Key Ingredients This Phase', icon: 'pill' },
];

const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

const safeDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const daysBetween = (a, b) => Math.floor((b - a) / (1000 * 60 * 60 * 24));

const getCycleDay = (lastPeriodStart, cycleLength) => {
  const start = safeDate(lastPeriodStart);
  if (!start || !cycleLength) return 1;
  const today = new Date();
  const diff = daysBetween(start, today);
  const normalized = ((diff % cycleLength) + cycleLength) % cycleLength;
  return normalized + 1;
};

const getPhaseKey = (cycleDay, cycleLength = 28) => {
  const ovulationDay = clamp(Math.round(cycleLength - 14), 12, 18);

  if (cycleDay <= 5) return 'Menstrual';
  if (cycleDay < ovulationDay) return 'Follicular';
  if (cycleDay >= ovulationDay && cycleDay <= ovulationDay + 1) return 'Ovulatory';
  return 'Luteal';
};

const getForecast = (cycleDay, cycleLength, phaseKey, pmsSeverity) => {
  const phase = PHASE_COPY[phaseKey];
  const base = [];

  for (let i = 0; i < 7; i++) {
    const day = ((cycleDay - 1 + i) % cycleLength) + 1;
    const currentPhase = getPhaseKey(day, cycleLength);

    let outlook = 'Skin likely stays balanced with steady hydration and moderate oil levels.';
    let priority = 'Maintain a simple routine and avoid overcorrecting when skin is calm.';

    if (currentPhase === 'Menstrual') {
      outlook = 'Expect more sensitivity, possible dryness, and a greater need for barrier support.';
      priority = 'Use soothing hydration, avoid strong exfoliation, and focus on calming products.';
    } else if (currentPhase === 'Follicular') {
      outlook = 'Lower acne risk with brighter, steadier skin and better tolerance for active ingredients.';
      priority = 'Good time for tone, texture, and preventive care using balanced active products.';
    } else if (currentPhase === 'Ovulatory') {
      outlook = 'Skin may look fresh and glowy, though early congestion can start for acne-prone users.';
      priority = 'Keep pores clear with gentle balancing care and avoid stripping the skin.';
    } else if (currentPhase === 'Luteal') {
      outlook = 'Oiliness, congestion, and hormonal acne risk may rise, especially around the jaw and chin.';
      priority = 'Use targeted breakout prevention, lightweight hydration, and anti-inflammatory support.';
    }

    if (pmsSeverity === 'Severe' && currentPhase === 'Luteal') {
      priority = 'High PMS severity suggests stronger pre-period flare risk, so prioritise salicylic acid, niacinamide, calming moisturiser, and consistent spot care.';
    }

    base.push({
      day,
      phase: currentPhase,
      outlook,
      priority,
    });
  }

  return {
    headline: phase.title,
    summary: phase.meaning,
    warning: phase.warning,
    sevenDay: base,
  };
};

const AccordionItem = ({ section, open, onToggle, accent, tint, values }) => {
  const content = values[section.key];
  return (
    <View style={[styles.accordionCard, { borderColor: `${accent}55`, backgroundColor: tint }]}>
      <TouchableOpacity style={styles.accordionHeader} activeOpacity={0.86} onPress={onToggle}>
        <View style={styles.accordionHeaderLeft}>
          <MaterialCommunityIcons name={section.icon} size={18} color={accent} />
          <Text style={[styles.accordionTitle, { color: accent }]}>{section.label}</Text>
        </View>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={20} color={accent} />
      </TouchableOpacity>

      {open && (
        <View style={styles.accordionContent}>
          {Array.isArray(content) ? (
            content.map((item, index) => (
              <View key={`${section.key}-${index}`} style={styles.bulletRow}>
                <View style={[styles.bulletDot, { backgroundColor: accent }]} />
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.bulletText}>{content}</Text>
          )}
        </View>
      )}
    </View>
  );
};

export default function MenstrualSettingsScreen({ navigation }) {
  const [cycleLength, setCycleLength] = useState('28');
  const [lastPeriodStart, setlastPeriodStart] = useState('');
  const [pmsSeverity, setPmsSeverity] = useState('Moderate');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({
    feels: true,
    emotions: false,
    skin: false,
    strategy: false,
    ingredients: false,
  });

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/menstrual-settings');
      const settings = response?.data || {};

      if (settings.cycle_length) setCycleLength(String(settings.cycle_length));
      if (settings.last_period_start) setlastPeriodStart(settings.last_period_start);
      if (settings.pms_severity) setPmsSeverity(settings.pms_severity);
    } catch (error) {
      // keep defaults if nothing exists yet
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const numericCycleLength = useMemo(() => {
    const parsed = parseInt(cycleLength, 10);
    return Number.isNaN(parsed) ? 28 : clamp(parsed, 21, 40);
  }, [cycleLength]);

  const cycleDay = useMemo(
    () => getCycleDay(lastPeriodStart || new Date().toISOString().slice(0, 10), numericCycleLength),
    [lastPeriodStart, numericCycleLength]
  );

  const phaseKey = useMemo(
    () => getPhaseKey(cycleDay, numericCycleLength),
    [cycleDay, numericCycleLength]
  );

  const phase = PHASE_COPY[phaseKey];
  const forecast = useMemo(
    () => getForecast(cycleDay, numericCycleLength, phaseKey, pmsSeverity),
    [cycleDay, numericCycleLength, phaseKey, pmsSeverity]
  );

  const toggleAccordion = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    if (!lastPeriodStart) {
      Alert.alert('Missing date', 'Please enter your last period start date in YYYY-MM-DD format.');
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(lastPeriodStart)) {
      Alert.alert('Invalid date', 'Please use the format YYYY-MM-DD.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        cycle_length: numericCycleLength,
        last_period_start: lastPeriodStart,
        pms_severity: pmsSeverity,
      };

      await api.post('/api/menstrual-settings', payload);

      Alert.alert(
        'Saved successfully',
        'Your cycle settings were updated. Forecasts and recommendations will now use your latest cycle information.'
      );
    } catch (error) {
      Alert.alert(
        'Save failed',
        error?.response?.data?.error || 'Unable to save your cycle settings right now.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f0310', '#160413', '#1d0617']} style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#ff7b93" />
        <Text style={styles.loadingText}>Loading cycle insights...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#12030f', '#180512', '#220818']} style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color="#ff8fa7" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.topBar}>
          <Text style={styles.title}>Cycle Tracker</Text>
          <View style={styles.cycleBadge}>
            <MaterialCommunityIcons name="flower-pollen-outline" size={13} color="#ff9cb0" />
            <Text style={styles.cycleBadgeText}>CYCLE</Text>
          </View>
        </View>

        <View style={[styles.heroCard, { backgroundColor: '#142529', borderColor: `${phase.accent}44` }]}>
          <View style={styles.heroLeft}>
            <View style={[styles.heroIconWrap, { backgroundColor: `${phase.accent}22` }]}>
              <Ionicons name={phase.icon} size={30} color={phase.accent} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>{phase.badge}</Text>
              <Text style={[styles.heroTitle, { color: phase.accent }]}>{phase.title}</Text>
              <Text style={styles.heroSub}>{phase.short}</Text>
            </View>
          </View>

          <View style={styles.dayWrap}>
            <Text style={[styles.dayNumber, { color: phase.accent }]}>{cycleDay}</Text>
            <Text style={styles.dayLabel}>DAY</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Your Cycle Settings</Text>

          <View style={styles.settingsCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>CYCLE LENGTH (DAYS)</Text>
              <Text style={styles.inputHint}>
                Number of days from Day 1 of one period to Day 1 of the next.
              </Text>
              <TextInput
                value={cycleLength}
                onChangeText={setCycleLength}
                keyboardType="numeric"
                placeholder="28"
                placeholderTextColor="#8f617f"
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>LAST PERIOD START DATE</Text>
              <Text style={styles.inputHint}>
                Use YYYY-MM-DD and enter the first day of your most recent real period.
              </Text>
              <TextInput
                value={lastPeriodStart}
                onChangeText={setlastPeriodStart}
                placeholder="2026-02-15"
                placeholderTextColor="#8f617f"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>PMS SEVERITY</Text>
              <Text style={styles.inputHint}>
                This helps personalise acne-risk, sensitivity, and routine suggestions before your period.
              </Text>

              <View style={styles.pmsRow}>
                {PMS_OPTIONS.map((option) => {
                  const active = pmsSeverity === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      activeOpacity={0.86}
                      onPress={() => setPmsSeverity(option)}
                      style={[
                        styles.pmsChip,
                        active && styles.pmsChipActive,
                        active && option === 'Severe' && { borderColor: '#ff8fa7', backgroundColor: '#4a2130' },
                      ]}
                    >
                      <Text style={[styles.pmsText, active && styles.pmsTextActive]}>{option}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>What This Phase Means</Text>
          <View style={[styles.infoCard, { borderColor: `${phase.accent}66` }]}>
            <Text style={styles.infoBody}>{phase.meaning}</Text>
          </View>
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Complete Phase Guide</Text>
          {ACCORDION_SECTIONS.map((section) => (
            <AccordionItem
              key={section.key}
              section={section}
              open={expanded[section.key]}
              onToggle={() => toggleAccordion(section.key)}
              accent={phase.accent}
              tint="#22071c"
              values={phase}
            />
          ))}
        </View>

        <View style={styles.sectionBlock}>
          <Text style={styles.sectionHeading}>Your 7-Day Skin Forecast</Text>
          <Text style={styles.sectionSubheading}>
            Based on your cycle day, here is what your skin may experience in the coming week.
          </Text>

          <View style={[styles.forecastHero, { borderColor: `${phase.accent}77` }]}>
            <View style={styles.forecastHeroTop}>
              <View style={styles.forecastHeroLeft}>
                <View style={[styles.forecastMiniIcon, { backgroundColor: `${phase.accent}1c` }]}>
                  <Ionicons name={phase.icon} size={22} color={phase.accent} />
                </View>
                <View>
                  <Text style={[styles.forecastPhaseTitle, { color: phase.accent }]}>{forecast.headline}</Text>
                  <Text style={styles.forecastPhaseSub}>{phase.short}</Text>
                </View>
              </View>

              <View style={[styles.dayPill, { backgroundColor: `${phase.accent}20` }]}>
                <Text style={[styles.dayPillText, { color: phase.accent }]}>Day {cycleDay}</Text>
              </View>
            </View>

            <Text style={styles.forecastSummary}>{forecast.summary}</Text>

            <View style={styles.warningRow}>
              <Ionicons name="warning-outline" size={16} color="#f7c85c" />
              <Text style={styles.warningText}>{forecast.warning}</Text>
            </View>
          </View>

          <View style={styles.dailyForecastWrap}>
            {forecast.sevenDay.map((item, index) => (
              <View key={`${item.day}-${index}`} style={styles.dailyCard}>
                <View style={styles.dailyTop}>
                  <Text style={styles.dailyDay}>Day {item.day}</Text>
                  <Text style={styles.dailyPhase}>{item.phase}</Text>
                </View>
                <Text style={styles.dailyOutlook}>{item.outlook}</Text>
                <Text style={styles.dailyPriority}>{item.priority}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Save Cycle Settings</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: Platform.OS === 'web' ? 16 : 24 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#f4c4d0',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 32,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    alignSelf: 'flex-start',
  },
  backText: {
    color: '#ff8fa7',
    fontSize: 15,
    fontWeight: '700',
  },
  topBar: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#220716',
    borderWidth: 1,
    borderColor: '#431126',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    position: 'relative',
  },
  title: {
    color: '#fff0f5',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  cycleBadge: {
    position: 'absolute',
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#3a1021',
    borderWidth: 1,
    borderColor: '#582039',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  cycleBadgeText: {
    color: '#ff9cb0',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroCard: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    marginBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingRight: 12,
  },
  heroIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEyebrow: {
    color: '#8f8391',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.3,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroSub: {
    color: '#a391a4',
    fontSize: 13,
    fontWeight: '600',
  },
  dayWrap: {
    alignItems: 'center',
    minWidth: 68,
  },
  dayNumber: {
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 36,
  },
  dayLabel: {
    color: '#8f8391',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
  sectionBlock: {
    marginBottom: 18,
  },
  sectionHeading: {
    color: '#fff1f5',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  sectionSubheading: {
    color: '#9d8597',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 19,
  },
  settingsCard: {
    backgroundColor: '#220616',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#401024',
    padding: 16,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    color: '#f59ab0',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  inputHint: {
    color: '#86697b',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#3a0a2d',
    borderWidth: 1,
    borderColor: '#4d1432',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: '#fff0f5',
    fontSize: 16,
    fontWeight: '600',
  },
  pmsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pmsChip: {
    flex: 1,
    minWidth: 120,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#531738',
    backgroundColor: '#330820',
    alignItems: 'center',
  },
  pmsChipActive: {
    backgroundColor: '#4a1330',
    borderColor: '#ff7b93',
  },
  pmsText: {
    color: '#c5a2b0',
    fontSize: 13,
    fontWeight: '800',
  },
  pmsTextActive: {
    color: '#fff2f6',
  },
  infoCard: {
    backgroundColor: '#22071a',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  infoBody: {
    color: '#dcc6d1',
    fontSize: 14,
    lineHeight: 23,
  },
  accordionCard: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accordionHeader: {
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  accordionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  accordionContent: {
    paddingHorizontal: 14,
    paddingBottom: 16,
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    color: '#e7d7df',
    fontSize: 14,
    lineHeight: 22,
  },
  forecastHero: {
    backgroundColor: '#220616',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
  },
  forecastHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  forecastHeroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  forecastMiniIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forecastPhaseTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  forecastPhaseSub: {
    color: '#9a8794',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  dayPill: {
    borderRadius: 999,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dayPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  forecastSummary: {
    color: '#f0e0e6',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 12,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  warningText: {
    flex: 1,
    color: '#f5c965',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  dailyForecastWrap: {
    gap: 10,
  },
  dailyCard: {
    backgroundColor: '#1d0613',
    borderWidth: 1,
    borderColor: '#3c1023',
    borderRadius: 16,
    padding: 14,
  },
  dailyTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  dailyDay: {
    color: '#fff1f5',
    fontSize: 14,
    fontWeight: '800',
  },
  dailyPhase: {
    color: '#ff92ab',
    fontSize: 12,
    fontWeight: '800',
  },
  dailyOutlook: {
    color: '#e2d1d8',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 8,
  },
  dailyPriority: {
    color: '#bfa5b0',
    fontSize: 12,
    lineHeight: 18,
  },
  saveButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: '#ff6f8f',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    shadowColor: '#ff6f8f',
    shadowOpacity: 0.28,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});