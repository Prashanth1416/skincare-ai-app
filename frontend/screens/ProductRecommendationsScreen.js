/**
 * SKIN IQ — ProductRecommendationsScreen
 * Dark theme · Coral/orange accent · Real products · Cycle-aware · AI personalized
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Linking, ActivityIndicator,
  SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import api from '../api';

const { width } = Dimensions.get('window');

const T = {
  bg0:'#0D0D14', bg1:'#13131F', bg2:'#1A1A2E', bg3:'#22223A', bg4:'#2A2A45',
  border:'#2E2E50',
  text:'#F0EFF8', text2:'#B8B5D4', text3:'#7A7898', text4:'#4A4870',
  accent:'#39E07A', accentDim:'rgba(57,224,122,0.12)',
  amber:'#FBBF24', amberDim:'rgba(251,191,36,0.12)',
  skyBlue:'#38BDF8', skyBlueDim:'rgba(56,189,248,0.12)',
  violet:'#A78BFA', violetDim:'rgba(167,139,250,0.12)',
  rose:'#FB7185', roseDim:'rgba(251,113,133,0.12)',
  coral:'#FF7043', coralDim:'rgba(255,112,67,0.14)', coralGlow:'rgba(255,112,67,0.28)',
  teal:'#2DD4BF', tealDim:'rgba(45,212,191,0.12)',
  success:'#39E07A',
};

// ── COMPREHENSIVE REAL PRODUCT DATABASE ─────────────────────────────────────
const PRODUCT_DATABASE = {
  oily: {
    cleanser: [
      {
        id: 'c1', name: 'CeraVe Foaming Facial Cleanser',
        brand: 'CeraVe', price: '₹899', highlights: 'Removes excess oil without disrupting skin barrier. Contains niacinamide & ceramides.',
        suitable_for: 'Oily/Combination', concern: 'Oil Control', rating: 4.7,
        url: 'https://www.amazon.in/CeraVe-Foaming-Facial-Cleanser/dp/B00TTD9BRC',
        source: 'Amazon', phase_note: 'Use twice daily; extra effective during luteal phase when oil surges.'
      },
      {
        id: 'c2', name: 'La Roche-Posay Effaclar Purifying Foaming Gel',
        brand: 'La Roche-Posay', price: '₹1,299', highlights: 'Thermal spring water + zinc to control sebum. Dermatologist tested.',
        suitable_for: 'Oily/Acne-prone', concern: 'Acne & Oil', rating: 4.6,
        url: 'https://www.amazon.in/La-Roche-Posay-Effaclar-Purifying-Cleansing/dp/B004MC8DFG',
        source: 'Amazon', phase_note: 'Pre-menstrual cleansing hero — keeps pores clear as progesterone rises.'
      },
    ],
    moisturizer: [
      {
        id: 'm1', name: 'Neutrogena Hydro Boost Water Gel',
        brand: 'Neutrogena', price: '₹1,099', highlights: 'Oil-free hyaluronic acid gel. Lightweight hydration for oily skin types.',
        suitable_for: 'Oily/Combination', concern: 'Lightweight Hydration', rating: 4.5,
        url: 'https://www.amazon.in/Neutrogena-Hydro-Boost-Water-Gel/dp/B00NR1YQ6C',
        source: 'Amazon', phase_note: 'Ideal during follicular phase when skin craves light hydration.'
      },
      {
        id: 'm2', name: 'Plum Green Tea Mattifying Moisturizer',
        brand: 'Plum', price: '₹549', highlights: 'Green tea antioxidants + glycolic acid. India-made, vegan, mattifying finish.',
        suitable_for: 'Oily/Acne-prone', concern: 'Mattifying + Antioxidant', rating: 4.4,
        url: 'https://www.amazon.in/Plum-Green-Tea-Mattifying-Moisturizer/dp/B08HGMGZBL',
        source: 'Amazon', phase_note: 'Excellent for all cycle phases; green tea fights hormonal inflammation.'
      },
    ],
    serum: [
      {
        id: 's1', name: 'The Ordinary Niacinamide 10% + Zinc 1%',
        brand: 'The Ordinary', price: '₹590', highlights: 'Reduces sebum production, minimizes pores, fades blemishes. Cult favourite.',
        suitable_for: 'Oily/Combination/Acne-prone', concern: 'Pores & Sebum', rating: 4.8,
        url: 'https://www.amazon.in/Ordinary-Niacinamide-10-Zinc-30ml/dp/B06WLN9C43',
        source: 'Amazon', phase_note: 'Apply during luteal phase — niacinamide directly counters hormonal oil surge.'
      },
      {
        id: 's2', name: 'Paula\'s Choice BHA 2% Liquid Exfoliant',
        brand: "Paula's Choice", price: '₹2,900', highlights: 'Salicylic acid unclogs pores, smooths texture. Award-winning formula.',
        suitable_for: 'Oily/Acne-prone', concern: 'Exfoliation & Pores', rating: 4.9,
        url: 'https://www.amazon.in/Paulas-Choice-SKIN-PERFECTING-Exfoliant/dp/B00949CTQQ',
        source: 'Amazon', phase_note: 'Use 2x/week during luteal phase to pre-empt hormonal breakouts.'
      },
    ],
    sunscreen: [
      {
        id: 'sp1', name: 'Minimalist Sunscreen SPF 50 PA++++',
        brand: 'Minimalist', price: '₹399', highlights: 'Ultra-light, no white cast, non-comedogenic. India\'s best matte SPF.',
        suitable_for: 'Oily/Combination', concern: 'Sun Protection', rating: 4.6,
        url: 'https://www.amazon.in/Minimalist-Sunscreen-SPF-50/dp/B094G4V1LM',
        source: 'Amazon', phase_note: 'Daily must-have; UV protection prevents post-inflammatory hyperpigmentation from acne.'
      },
    ],
  },
  dry: {
    cleanser: [
      {
        id: 'c3', name: 'CeraVe Hydrating Cleanser',
        brand: 'CeraVe', price: '₹849', highlights: 'Cream cleanser with ceramides & hyaluronic acid. Cleans without stripping.',
        suitable_for: 'Dry/Sensitive', concern: 'Gentle Hydrating Cleanse', rating: 4.8,
        url: 'https://www.amazon.in/CeraVe-Hydrating-Cleanser-Cream-250ml/dp/B01MSSDEPK',
        source: 'Amazon', phase_note: 'Critical during menstrual & follicular phases when skin is most fragile and dry.'
      },
      {
        id: 'c4', name: 'Dermalogica Ultracalming Cleanser',
        brand: 'Dermalogica', price: '₹2,200', highlights: 'Creamy, fragrance-free gel. Calms irritation + redness instantly.',
        suitable_for: 'Dry/Sensitive', concern: 'Calming Cleanse', rating: 4.7,
        url: 'https://www.amazon.in/Dermalogica-UltraCalming-Cleanser-250ml/dp/B0009PFYGG',
        source: 'Amazon', phase_note: 'Luteal phase saviou — calms the reactive, sensitised skin before periods.'
      },
    ],
    moisturizer: [
      {
        id: 'm3', name: 'La Roche-Posay Cicaplast Baume B5',
        brand: 'La Roche-Posay', price: '₹1,399', highlights: 'Multi-repairing balm with panthenol. Restores compromised skin barrier.',
        suitable_for: 'Dry/Very Dry/Sensitive', concern: 'Barrier Repair', rating: 4.9,
        url: 'https://www.amazon.in/La-Roche-Posay-Cicaplast-Baume/dp/B00IYNS8XS',
        source: 'Amazon', phase_note: 'Essential during menstrual phase — estrogen drop leaves skin parched and thin.'
      },
      {
        id: 'm4', name: 'Clinique Moisture Surge 100H Auto-Replenishing Hydrator',
        brand: 'Clinique', price: '₹3,500', highlights: '100-hour continuous hydration. Cica + activated aloe water technology.',
        suitable_for: 'Dry/Normal-Dry', concern: 'Deep Continuous Hydration', rating: 4.6,
        url: 'https://www.amazon.in/Clinique-Moisture-Surge-Auto-Replenishing/dp/B07JGCFHBZ',
        source: 'Amazon', phase_note: 'Use every night; most effective during follicular phase for hydration reservoir building.'
      },
    ],
    serum: [
      {
        id: 's3', name: 'The Ordinary Hyaluronic Acid 2% + B5',
        brand: 'The Ordinary', price: '₹690', highlights: 'Multi-weight hyaluronic acid draws moisture deep into skin layers.',
        suitable_for: 'Dry/All Skin Types', concern: 'Deep Hydration', rating: 4.7,
        url: 'https://www.amazon.in/Ordinary-Hyaluronic-Acid-2-B5/dp/B06WGPNM51',
        source: 'Amazon', phase_note: 'Apply on damp skin throughout cycle; extra layers during menstrual + luteal phases.'
      },
      {
        id: 's4', name: 'Kiehl\'s Midnight Recovery Concentrate',
        brand: "Kiehl's", price: '₹4,500', highlights: 'Lavender & squalane facial oil. Overnight skin repair and restoration.',
        suitable_for: 'Dry/Sensitive', concern: 'Overnight Repair', rating: 4.8,
        url: 'https://www.amazon.in/Kiehls-Midnight-Recovery-Concentrate-30ml/dp/B006HRU8L8',
        source: 'Amazon', phase_note: 'Luteal phase overnight ritual — restores barrier while you sleep.'
      },
    ],
    sunscreen: [
      {
        id: 'sp2', name: 'Bioderma Photoderm Moisturising SPF 50+',
        brand: 'Bioderma', price: '₹1,299', highlights: 'Hydrating sunscreen with patented Cell-Ox Shield. Moisturises + protects.',
        suitable_for: 'Dry/Sensitive', concern: 'Hydrating Sun Protection', rating: 4.5,
        url: 'https://www.amazon.in/Bioderma-Photoderm-Maximum-Protection-Moisturising/dp/B00A4D72MQ',
        source: 'Amazon', phase_note: 'Morning essential — dry skin + UV = accelerated ageing. Non-negotiable daily.'
      },
    ],
  },
  sensitive: {
    cleanser: [
      {
        id: 'c5', name: 'Avène Extremely Gentle Cleanser Lotion',
        brand: 'Avène', price: '₹1,799', highlights: 'No rinse, no fragrance. Avène thermal spring water soothes reactive skin.',
        suitable_for: 'Sensitive/Very Sensitive', concern: 'Ultra-Gentle Cleanse', rating: 4.8,
        url: 'https://www.amazon.in/Avene-Extremely-Gentle-Cleanser-Lotion/dp/B000FBM3UK',
        source: 'Amazon', phase_note: 'Menstrual phase go-to when skin is at peak sensitivity and reactivity.'
      },
      {
        id: 'c6', name: 'Cetaphil Gentle Skin Cleanser',
        brand: 'Cetaphil', price: '₹449', highlights: 'Dermatologist no. 1 recommended. Hypoallergenic, pH-balanced, fragrance-free.',
        suitable_for: 'Sensitive/All Skin Types', concern: 'Gentle Daily Cleanse', rating: 4.9,
        url: 'https://www.amazon.in/Cetaphil-Gentle-Skin-Cleanser-500ml/dp/B001ET76EO',
        source: 'Amazon', phase_note: 'Use throughout cycle, increase frequency during luteal phase hormonal spikes.'
      },
    ],
    moisturizer: [
      {
        id: 'm5', name: 'Vanicream Moisturizing Skin Cream',
        brand: 'Vanicream', price: '₹1,500', highlights: 'Free of dyes, fragrance, lanolin, parabens. Recommended for eczema & rosacea.',
        suitable_for: 'Sensitive/Eczema/Rosacea', concern: 'Hypoallergenic Moisture', rating: 4.8,
        url: 'https://www.amazon.in/Vanicream-Moisturizing-Cream-16oz/dp/B000NWGCZ2',
        source: 'Amazon', phase_note: 'Rosacea flares intensify during luteal/menstrual phase — this calms instantly.'
      },
      {
        id: 'm6', name: 'First Aid Beauty Ultra Repair Cream',
        brand: 'First Aid Beauty', price: '₹2,100', highlights: 'Colloidal oatmeal + shea butter. Intense relief for sensitive, dry, irritated skin.',
        suitable_for: 'Sensitive/Dry/Eczema', concern: 'Instant Soothing Relief', rating: 4.7,
        url: 'https://www.amazon.in/First-Aid-Beauty-Ultra-Repair/dp/B001UE57P8',
        source: 'Amazon', phase_note: 'Apply generously during premenstrual flare-ups for barrier protection.'
      },
    ],
    serum: [
      {
        id: 's5', name: 'Dr. Jart+ Cicapair Tiger Grass Serum',
        brand: 'Dr. Jart+', price: '₹3,200', highlights: 'Centella asiatica repairs, soothes redness, rebuilds barrier. K-beauty icon.',
        suitable_for: 'Sensitive/Redness-prone', concern: 'Redness & Repair', rating: 4.7,
        url: 'https://www.amazon.in/Dr-Jart-Cicapair-Tiger-Grass/dp/B07PTVVG3H',
        source: 'Amazon', phase_note: 'Hormonal redness peaks in luteal phase — tiger grass is nature\'s anti-inflammatory.'
      },
      {
        id: 's6', name: 'Naturium Tranexamic Acid Topical Acid 5%',
        brand: 'Naturium', price: '₹1,800', highlights: 'Fades hyperpigmentation without irritation. Gentle enough for sensitive skin.',
        suitable_for: 'Sensitive/PIH-prone', concern: 'Even Skin Tone', rating: 4.5,
        url: 'https://www.amazon.in/Naturium-Tranexamic-Topical-Acid/dp/B098VNWSRR',
        source: 'Amazon', phase_note: 'Post-menstrual spot treatment to fade any period-related breakout marks.'
      },
    ],
    sunscreen: [
      {
        id: 'sp3', name: 'EltaMD UV Clear Broad-Spectrum SPF 46',
        brand: 'EltaMD', price: '₹3,500', highlights: 'Niacinamide + zinc oxide mineral formula. #1 dermatologist-recommended SPF.',
        suitable_for: 'Sensitive/Acne-prone/Rosacea', concern: 'Mineral Sun Protection', rating: 4.9,
        url: 'https://www.amazon.in/EltaMD-Clear-Broad-Spectrum-SPF-46/dp/B002MSN3QQ',
        source: 'Amazon', phase_note: 'Fragrance-free mineral filter ideal for reactive skin any phase of cycle.'
      },
    ],
  },
  normal: {
    cleanser: [
      {
        id: 'c7', name: 'Tatcha The Rice Wash Soft Cream Cleanser',
        brand: 'Tatcha', price: '₹4,200', highlights: 'Japanese rice bran + hyaluronic acid. Creamy cleanser for balanced skin.',
        suitable_for: 'Normal/Combination', concern: 'Balanced Cleansing', rating: 4.6,
        url: 'https://www.amazon.in/Tatcha-Rice-Wash-Cream-Cleanser/dp/B08CCJB37S',
        source: 'Amazon', phase_note: 'Ovulation phase treat — enhances the natural glow your skin already has.'
      },
      {
        id: 'c8', name: 'Simple Kind to Skin Moisturising Facial Wash',
        brand: 'Simple', price: '₹299', highlights: 'Pro-vitamin B5 + vitamin E. No artificial perfume, colour or harsh chemicals.',
        suitable_for: 'Normal/Sensitive', concern: 'Daily Gentle Cleanse', rating: 4.5,
        url: 'https://www.amazon.in/Simple-Kind-Skin-Moisturising-Facial/dp/B01GGKW9P6',
        source: 'Amazon', phase_note: 'Use consistently across all cycle phases to maintain skin balance.'
      },
    ],
    moisturizer: [
      {
        id: 'm7', name: 'Belif The True Cream Moisturizing Bomb',
        brand: 'Belif', price: '₹3,800', highlights: 'Lady\'s mantle herb + aqua bomb technology. 26-hour hydration claim.',
        suitable_for: 'Normal/Combination', concern: 'Long-Lasting Hydration', rating: 4.7,
        url: 'https://www.amazon.in/Belif-True-Cream-Moisturizing-Bomb/dp/B00DGN7UPK',
        source: 'Amazon', phase_note: 'Perfect follicular & ovulation phase moisturizer when skin is at its most balanced.'
      },
    ],
    serum: [
      {
        id: 's7', name: 'SkinCeuticals C E Ferulic',
        brand: 'SkinCeuticals', price: '₹12,500', highlights: 'Gold standard vitamin C serum. 15% pure L-ascorbic acid, vitamin E + ferulic acid.',
        suitable_for: 'Normal/Combination/Mature', concern: 'Brightening & Anti-Aging', rating: 4.9,
        url: 'https://www.amazon.in/SkinCeuticals-Ferulic-Brightening-Antioxidant-Serum/dp/B000D5XN6C',
        source: 'Amazon', phase_note: 'Follicular & ovulation phases: antioxidants supercharge your skin\'s natural radiance window.'
      },
      {
        id: 's8', name: 'The Inkey List Retinol Serum',
        brand: 'The Inkey List', price: '₹1,299', highlights: '1% retinol + 0.5% granactive retinoid. Progressive formula for beginners.',
        suitable_for: 'Normal/Aging-concerned', concern: 'Anti-Aging & Cell Renewal', rating: 4.5,
        url: 'https://www.amazon.in/INKEY-List-Retinol-Serum-30ml/dp/B07MGBZXP4',
        source: 'Amazon', phase_note: 'Use 2-3x/week during follicular phase only — avoid during menstrual phase sensitisation.'
      },
    ],
    sunscreen: [
      {
        id: 'sp4', name: 'Isntree Hyaluronic Acid Watery Sun Gel SPF50+',
        brand: 'Isntree', price: '₹1,499', highlights: 'Hyaluronic acid + green tea. Hydrating, weightless K-beauty SPF for normal skin.',
        suitable_for: 'Normal/Combination', concern: 'Hydrating Sun Protection', rating: 4.6,
        url: 'https://www.amazon.in/Isntree-Hyaluronic-Watery-Sun-Gel/dp/B07DSMRHGD',
        source: 'Amazon', phase_note: 'Light enough for everyday use across all cycle phases without clogging pores.'
      },
    ],
  },
  combination: {
    cleanser: [
      {
        id: 'c9', name: 'Kiehl\'s Calendula Deep Cleansing Foaming Face Wash',
        brand: "Kiehl's", price: '₹2,500', highlights: 'Calendula petals + allantoin. Balances oily T-zone while soothing dry areas.',
        suitable_for: 'Combination/Normal', concern: 'Zone-Balancing Cleanse', rating: 4.6,
        url: 'https://www.amazon.in/Kiehls-Calendula-Deep-Cleansing-Foaming/dp/B00CPWJQF2',
        source: 'Amazon', phase_note: 'Combination skin is most challenged during luteal phase — this balances both zones.'
      },
    ],
    moisturizer: [
      {
        id: 'm8', name: 'Origins Checks and Balances Frothy Face Wash',
        brand: 'Origins', price: '₹2,200', highlights: 'White Chinese clay + aloe. Normalises skin without over-drying.',
        suitable_for: 'Combination/Normal', concern: 'Zone Balancing', rating: 4.4,
        url: 'https://www.amazon.in/Origins-Checks-Balances-Frothy-Wash/dp/B000FFGFEM',
        source: 'Amazon', phase_note: 'Multi-zone care is essential; adjust application pressure between T-zone and dry patches.'
      },
    ],
    serum: [
      {
        id: 's9', name: 'COSRX Advanced Snail 96 Mucin Power Essence',
        brand: 'COSRX', price: '₹1,800', highlights: '96% snail secretion filtrate. Repairs, hydrates and balances all skin areas.',
        suitable_for: 'Combination/All Types', concern: 'Repair & Balancing', rating: 4.8,
        url: 'https://www.amazon.in/COSRX-Advanced-Snail-Mucin-Power/dp/B00PBX3L7K',
        source: 'Amazon', phase_note: 'Snail mucin is a cycle-safe all-rounder that adapts to combination skin\'s shifting needs.'
      },
    ],
    sunscreen: [
      {
        id: 'sp5', name: 'Shiseido Urban Environment UV Protection Cream SPF 50',
        brand: 'Shiseido', price: '₹2,800', highlights: 'WetForce + HeatForce technology. Japanese precision for urban skin protection.',
        suitable_for: 'Combination/Normal', concern: 'Premium Sun Protection', rating: 4.7,
        url: 'https://www.amazon.in/Shiseido-Urban-Environment-Protection-Sunscreen/dp/B01KLBLHQS',
        source: 'Amazon', phase_note: 'Full-cycle daily protection; formula works beautifully over makeup for T-zone shine control.'
      },
    ],
  },
};

// Phase-specific supplement products
const PHASE_SUPPLEMENTS = {
  menstruation: [
    {
      id: 'sup1', name: 'Garden of Life Vitamin Code Raw Iron',
      brand: 'Garden of Life', price: '₹2,199', highlights: 'Whole food iron supplement. Replenishes iron lost during menstruation for radiant skin.',
      suitable_for: 'All skin types', concern: 'Iron Replenishment', rating: 4.6,
      url: 'https://www.amazon.in/Garden-Life-Vitamin-Code-Capsules/dp/B005FQFHTY', source: 'Amazon',
      phase_note: 'Iron deficiency during periods causes pallor and dullness — supplement for glow.'
    },
    {
      id: 'sup2', name: 'The Moms Co Natural Vitamin C Face Serum',
      brand: 'The Moms Co', price: '₹699', highlights: 'Stable vitamin C + niacinamide. Safe for menstrual phase sensitivity.',
      suitable_for: 'Sensitive/All', concern: 'Gentle Brightening', rating: 4.3,
      url: 'https://www.amazon.in/Moms-Natural-Vitamin-Serum/dp/B08H99LGDH', source: 'Amazon',
      phase_note: 'Gentle vitamin C during menstrual phase — full strength serums may irritate.'
    },
  ],
  follicular: [
    {
      id: 'sup3', name: 'Pilgrim 10% Vitamin C Face Serum',
      brand: 'Pilgrim', price: '₹549', highlights: '10% ascorbic acid + alpha arbutin. Korean-formulated, India-priced brightening serum.',
      suitable_for: 'Normal/Oily/Combination', concern: 'Brightening & Even Tone', rating: 4.5,
      url: 'https://www.amazon.in/Pilgrim-Vitamin-Serum-Alpha-Arbutin/dp/B08HSF19KZ', source: 'Amazon',
      phase_note: 'Follicular phase: estrogen rising means skin can handle stronger actives. Vitamin C shines here.'
    },
  ],
  ovulation: [
    {
      id: 'sup4', name: 'Tatcha The Silk Canvas Primer',
      brand: 'Tatcha', price: '₹3,800', highlights: 'Mineral silk primer. Enhances natural ovulation glow with light-reflecting particles.',
      suitable_for: 'All skin types', concern: 'Glow Enhancement', rating: 4.7,
      url: 'https://www.amazon.in/Tatcha-Silk-Canvas-Primer/dp/B07BFVJ4L3', source: 'Amazon',
      phase_note: 'Ovulation = peak skin radiance. This primer amplifies your natural luminosity.'
    },
  ],
  luteal: [
    {
      id: 'sup5', name: 'Mario Badescu Drying Lotion',
      brand: 'Mario Badescu', price: '₹1,599', highlights: 'Salicylic acid + calamine spot treatment. Overnight drying of hormonal pimples.',
      suitable_for: 'Oily/Acne-prone', concern: 'Hormonal Spot Treatment', rating: 4.6,
      url: 'https://www.amazon.in/Mario-Badescu-Drying-Lotion-Sulfur/dp/B00B3MI1KE', source: 'Amazon',
      phase_note: 'Keep by your bedside for luteal phase breakouts. Apply directly to spots overnight.'
    },
    {
      id: 'sup6', name: 'Murad Clarifying Cream Cleanser',
      brand: 'Murad', price: '₹2,900', highlights: 'Salicylic acid + green tea. Pre-empts premenstrual breakouts with daily use.',
      suitable_for: 'Oily/Acne-prone/Combination', concern: 'Pre-Menstrual Acne Prevention', rating: 4.5,
      url: 'https://www.amazon.in/Murad-Clarifying-Cleanser/dp/B000BQYGNC', source: 'Amazon',
      phase_note: 'Switch to this 5-7 days before period for proactive premenstrual breakout control.'
    },
  ],
};

const CAT_PALETTE = {
  cleanser:    { color: T.teal,    dim: T.tealDim,    emoji: '🫧', title: 'Cleansers'    },
  moisturizer: { color: T.skyBlue, dim: T.skyBlueDim, emoji: '💧', title: 'Moisturizers' },
  serum:       { color: T.rose,    dim: T.roseDim,    emoji: '✨', title: 'Serums'        },
  sunscreen:   { color: T.amber,   dim: T.amberDim,   emoji: '☀️', title: 'Sunscreens'   },
  supplements: { color: T.violet,  dim: T.violetDim,  emoji: '💊', title: 'Phase Picks'  },
};

const PHASE_COLORS = {
  menstruation: T.rose,
  follicular: T.teal,
  ovulation: T.amber,
  luteal: T.violet,
};

export default function ProductRecommendationsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [skinType, setSkinType] = useState('normal');
  const [cyclePhase, setCyclePhase] = useState(null);
  const [cycleDay, setCycleDay] = useState(null);
  const [activeTab, setActiveTab] = useState('cleanser');
  const [showPhaseProducts, setShowPhaseProducts] = useState(false);

  useEffect(() => { loadUserData(); }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const profileRes = await api.get('/api/profile');
      if (profileRes.data.skin_type) setSkinType(profileRes.data.skin_type.toLowerCase());

      try {
        const cycleRes = await api.get('/api/menstrual-settings');
        if (cycleRes.data.prediction?.today_phase) {
          setCyclePhase(cycleRes.data.prediction.today_phase);
          setCycleDay(cycleRes.data.prediction.today_cycle_day);
        }
      } catch {}
    } catch (e) {
      console.log('Error loading:', e);
    } finally {
      setLoading(false);
    }
  };

  const openLink = (url) => { if (url) Linking.openURL(url).catch(() => {}); };

  const currentProducts = PRODUCT_DATABASE[skinType] || PRODUCT_DATABASE.normal;
  const tabProducts = showPhaseProducts
    ? (PHASE_SUPPLEMENTS[cyclePhase] || [])
    : (currentProducts[activeTab] || []);

  const phaseColor = cyclePhase ? (PHASE_COLORS[cyclePhase] || T.accent) : T.accent;

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.backTxt}>← Back</Text></TouchableOpacity>
          <Text style={s.topTitle}>Products</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.center}>
          <ActivityIndicator size="large" color={T.coral} />
          <Text style={s.loadTxt}>Curating your personalized picks…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg1} />

      {/* TOP BAR */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.topTitle}>My Products</Text>
        <TouchableOpacity onPress={loadUserData} style={s.refreshBtn}>
          <Text style={[s.refreshIco, { color: T.coral }]}>↺</Text>
        </TouchableOpacity>
      </View>

      {/* SKIN TYPE + PHASE BANNER */}
      <View style={s.bannerRow}>
        <View style={[s.bannerCard, { borderColor: T.coral + '44', backgroundColor: T.coralDim }]}>
          <Text style={s.bannerIco}>🔬</Text>
          <View>
            <Text style={s.bannerLabel}>Your Skin Type</Text>
            <Text style={[s.bannerValue, { color: T.coral }]}>{skinType.toUpperCase()}</Text>
          </View>
        </View>
        {cyclePhase && (
          <View style={[s.bannerCard, { borderColor: phaseColor + '44', backgroundColor: phaseColor + '18', marginLeft: 10 }]}>
            <Text style={s.bannerIco}>🌸</Text>
            <View>
              <Text style={s.bannerLabel}>Cycle Phase · Day {cycleDay}</Text>
              <Text style={[s.bannerValue, { color: phaseColor }]}>{cyclePhase.toUpperCase()}</Text>
            </View>
          </View>
        )}
      </View>

      {/* PHASE PHASE EXPLANATION BANNER */}
      {cyclePhase && (
        <View style={[s.phaseExplainer, { borderLeftColor: phaseColor }]}>
          <Text style={[s.phaseExplainerTitle, { color: phaseColor }]}>
            {cyclePhase === 'menstruation' && '🩸 Menstrual Phase — Skin is sensitive, barrier is weak. Go ultra-gentle.'}
            {cyclePhase === 'follicular' && '🌱 Follicular Phase — Estrogen rising! Great time for active ingredients.'}
            {cyclePhase === 'ovulation' && '✨ Ovulation Phase — Peak radiance! Skin is at its clearest and smoothest.'}
            {cyclePhase === 'luteal' && '🌙 Luteal Phase — Progesterone rises: expect oilier skin & potential breakouts.'}
          </Text>
          <Text style={s.phaseExplainerSub}>Products below are curated for your current cycle phase + skin type combo.</Text>
        </View>
      )}

      {/* CATEGORY TABS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.tabsRow} style={s.tabsScroll}>
        {Object.entries(CAT_PALETTE).map(([key, pal]) => {
          if (key === 'supplements' && !cyclePhase) return null;
          const active = showPhaseProducts ? key === 'supplements' : (activeTab === key && !showPhaseProducts);
          return (
            <TouchableOpacity
              key={key}
              style={[s.tab, active && { borderColor: pal.color, backgroundColor: pal.dim }]}
              onPress={() => {
                if (key === 'supplements') {
                  setShowPhaseProducts(true);
                } else {
                  setShowPhaseProducts(false);
                  setActiveTab(key);
                }
              }}
            >
              <Text style={{ fontSize: 16 }}>{pal.emoji}</Text>
              <Text style={[s.tabTxt, active && { color: pal.color }]}>{pal.title}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* PRODUCTS LIST */}
      <ScrollView contentContainerStyle={s.listPad} showsVerticalScrollIndicator={false}>

        {/* SECTION HEADER */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>
            {showPhaseProducts
              ? `Phase-Specific Picks for ${cyclePhase?.charAt(0).toUpperCase() + cyclePhase?.slice(1)} Phase`
              : `${CAT_PALETTE[activeTab]?.title} for ${skinType.charAt(0).toUpperCase() + skinType.slice(1)} Skin`}
          </Text>
          <Text style={s.sectionSub}>
            {tabProducts.length} product{tabProducts.length !== 1 ? 's' : ''} • AI-personalized for you
          </Text>
        </View>

        {tabProducts.length === 0 ? (
          <View style={s.emptyCard}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🧴</Text>
            <Text style={s.emptyTitle}>No products found</Text>
            <Text style={s.emptySub}>Complete your skin analysis for personalized picks</Text>
          </View>
        ) : (
          tabProducts.map((p, i) => <ProductCard key={p.id || i} p={p} idx={i} onPress={openLink} />)
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function ProductCard({ p, idx, onPress }) {
  const stars = '⭐'.repeat(Math.round(p.rating || 4));
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity activeOpacity={0.92} onPress={() => setExpanded(!expanded)}
      style={s.card}>
      {/* CARD TOP */}
      <View style={s.cardTop}>
        <View style={s.cardNumBadge}>
          <Text style={s.cardNum}>{String(idx + 1).padStart(2, '0')}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={s.cardTitleRow}>
            <Text style={s.cardName} numberOfLines={expanded ? 0 : 2}>{p.name}</Text>
            <View style={[s.priceBadge]}>
              <Text style={s.priceText}>{p.price}</Text>
            </View>
          </View>
          <Text style={s.cardBrand}>{p.brand}</Text>
        </View>
      </View>

      {/* BADGES */}
      <View style={s.badgeRow}>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>✓ {p.suitable_for}</Text>
        </View>
        <View style={[s.badge, { backgroundColor: T.amberDim, borderColor: T.amber + '44' }]}>
          <Text style={[s.badgeTxt, { color: T.amber }]}>{p.concern}</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeTxt}>{stars} {p.rating}</Text>
        </View>
      </View>

      {/* HIGHLIGHTS */}
      <Text style={s.highlights}>{p.highlights}</Text>

      {/* PHASE NOTE - ALWAYS VISIBLE */}
      {p.phase_note && (
        <View style={s.phaseNote}>
          <Text style={s.phaseNoteIco}>🌸</Text>
          <Text style={s.phaseNoteTxt}>{p.phase_note}</Text>
        </View>
      )}

      {/* ACTIONS */}
      <View style={s.cardActions}>
        {p.url ? (
          <TouchableOpacity
            style={s.buyBtn}
            onPress={() => onPress(p.url)}
            activeOpacity={0.8}
          >
            <Text style={s.buyBtnTxt}>View on {p.source} →</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.unavailableBtn}>
            <Text style={s.unavailableTxt}>Not available online</Text>
          </View>
        )}
        <TouchableOpacity style={s.expandBtn} onPress={() => setExpanded(!expanded)}>
          <Text style={s.expandTxt}>{expanded ? '▲ Less' : '▼ More'}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg0 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadTxt: { fontSize: 13, color: T.text3 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 13, backgroundColor: T.bg1, borderBottomWidth: 1, borderBottomColor: T.border },
  backBtn: { padding: 4 },
  backTxt: { fontSize: 14, color: T.text3, fontWeight: '600' },
  topTitle: { fontSize: 16, fontWeight: '800', color: T.text },
  refreshBtn: { padding: 6 },
  refreshIco: { fontSize: 22, fontWeight: '700' },

  bannerRow: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  bannerCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  bannerIco: { fontSize: 22 },
  bannerLabel: { fontSize: 9, color: T.text3, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 2 },
  bannerValue: { fontSize: 13, fontWeight: '900' },

  phaseExplainer: { marginHorizontal: 16, marginBottom: 10, borderLeftWidth: 3, backgroundColor: T.bg2, borderRadius: 10, padding: 12 },
  phaseExplainerTitle: { fontSize: 12, fontWeight: '700', marginBottom: 4, lineHeight: 17 },
  phaseExplainerSub: { fontSize: 11, color: T.text3, lineHeight: 16 },

  tabsScroll: { maxHeight: 56 },
  tabsRow: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: T.border, backgroundColor: T.bg3 },
  tabTxt: { fontSize: 12, fontWeight: '600', color: T.text3 },

  listPad: { paddingHorizontal: 16, paddingTop: 12 },

  sectionHeader: { marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: T.text, marginBottom: 3 },
  sectionSub: { fontSize: 11, color: T.text3 },

  emptyCard: { backgroundColor: T.bg2, borderRadius: 16, borderWidth: 1, borderColor: T.border, padding: 28, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 6 },
  emptySub: { fontSize: 12, color: T.text3, textAlign: 'center' },

  card: { backgroundColor: T.bg2, borderRadius: 16, borderWidth: 1, borderColor: T.border, borderLeftWidth: 3, borderLeftColor: T.coral, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  cardNumBadge: { width: 38, height: 38, borderRadius: 10, backgroundColor: T.coralDim, borderWidth: 1, borderColor: T.coral + '50', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardNum: { fontSize: 11, fontWeight: '900', color: T.coral },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 3 },
  cardName: { fontSize: 14, fontWeight: '700', color: T.text, flex: 1, lineHeight: 19 },
  cardBrand: { fontSize: 10, color: T.text3, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },

  priceBadge: { backgroundColor: T.amberDim, borderRadius: 8, borderWidth: 1, borderColor: T.amber + '44', paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  priceText: { fontSize: 11, fontWeight: '800', color: T.amber },

  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, backgroundColor: T.bg4, borderRadius: 6, borderWidth: 1, borderColor: T.border },
  badgeTxt: { fontSize: 10, color: T.text3, fontWeight: '600' },

  highlights: { fontSize: 12, color: T.text2, lineHeight: 17, marginBottom: 10 },

  phaseNote: { flexDirection: 'row', gap: 8, backgroundColor: T.bg3, borderRadius: 8, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: T.border },
  phaseNoteIco: { fontSize: 14 },
  phaseNoteTxt: { fontSize: 11, color: T.text2, flex: 1, lineHeight: 16 },

  cardActions: { flexDirection: 'row', gap: 10 },
  buyBtn: { flex: 1, backgroundColor: T.coralDim, borderRadius: 10, borderWidth: 1.5, borderColor: T.coral + '55', paddingVertical: 10, alignItems: 'center' },
  buyBtnTxt: { fontSize: 12, fontWeight: '700', color: T.coral },
  unavailableBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: T.border, alignItems: 'center' },
  unavailableTxt: { fontSize: 11, color: T.text4 },
  expandBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  expandTxt: { fontSize: 10, color: T.text3, fontWeight: '600' },
});