import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import api from '../api';

const { width } = Dimensions.get('window');

const CATEGORY_ORDER = [
  'Cleanser',
  'Toner / Essence',
  'Serum / Treatment',
  'Moisturiser',
  'Barrier Repair',
  'Sunscreen',
  'Exfoliation',
  'Retinoid / Night Renewal',
  'Mask / Weekly Care',
  'Spot Care',
  'Eye Care',
  'Lip Care',
  'Mist / Hydration Boost',
  'Body Care',
  'Tools / Accessories',
];

const PRODUCT_LIBRARY = {
  Cleanser: [
    {
      id: 'cleanser-cerave-foaming',
      name: 'CeraVe Foaming Facial Cleanser',
      bestFor: ['Oily', 'Combination', 'Normal'],
      phases: ['Follicular', 'Ovulatory', 'Luteal', 'General'],
      why: 'Ideal for oily or combination skin because it helps remove excess oil, dirt, sunscreen, and daily buildup without making the skin feel harshly stripped.',
      tags: ['oil-control', 'daily-use', 'barrier-friendly'],
      amazon: 'https://www.amazon.in/s?k=CeraVe+Foaming+Facial+Cleanser',
      flipkart: 'https://www.flipkart.com/search?q=CeraVe%20Foaming%20Facial%20Cleanser',
    },
    {
      id: 'cleanser-toleriane',
      name: 'La Roche-Posay Toleriane Purifying Cleanser',
      bestFor: ['Combination', 'Sensitive', 'Oily'],
      phases: ['General', 'Follicular', 'Luteal'],
      why: 'A strong balancing cleanser for users who need purification without the tight feeling often caused by over-cleansing.',
      tags: ['balanced-cleanse', 'sensitive-safe'],
      amazon: 'https://www.amazon.in/s?k=La+Roche+Posay+Toleriane+Purifying+Cleanser',
      flipkart: 'https://www.flipkart.com/search?q=La%20Roche%20Posay%20Toleriane%20Purifying%20Cleanser',
    },
    {
      id: 'cleanser-cetaphil-gentle',
      name: 'Cetaphil Gentle Skin Cleanser',
      bestFor: ['Dry', 'Sensitive', 'Normal'],
      phases: ['Menstrual', 'General'],
      why: 'Better suited for reactive or dry skin phases when the barrier needs a softer cleansing approach.',
      tags: ['gentle', 'dry-skin', 'barrier-support'],
      amazon: 'https://www.amazon.in/s?k=Cetaphil+Gentle+Skin+Cleanser',
      flipkart: 'https://www.flipkart.com/search?q=Cetaphil%20Gentle%20Skin%20Cleanser',
    },
    {
      id: 'cleanser-simple-refresh',
      name: 'Simple Refreshing Facial Wash',
      bestFor: ['Sensitive', 'Combination', 'Normal'],
      phases: ['General', 'Menstrual'],
      why: 'A practical low-irritation option for users who want a mild cleanser at an accessible price point.',
      tags: ['simple-routine', 'budget', 'mild'],
      amazon: 'https://www.amazon.in/s?k=Simple+Refreshing+Facial+Wash',
      flipkart: 'https://www.flipkart.com/search?q=Simple%20Refreshing%20Facial%20Wash',
    },
  ],

  'Toner / Essence': [
    {
      id: 'toner-snail-essence',
      name: 'Snail Mucin Essence',
      bestFor: ['Dry', 'Sensitive', 'Combination', 'Normal'],
      phases: ['Menstrual', 'Follicular', 'General'],
      why: 'Useful for lightweight hydration, bounce, and skin recovery when you want hydration without a heavy cream layer.',
      tags: ['essence', 'hydration', 'repair'],
      amazon: 'https://www.amazon.in/s?k=Snail+Mucin+Essence',
      flipkart: 'https://www.flipkart.com/search?q=Snail%20Mucin%20Essence',
    },
    {
      id: 'toner-centella',
      name: 'Centella Calming Toner',
      bestFor: ['Sensitive', 'Combination', 'Dry'],
      phases: ['Menstrual', 'Luteal', 'General'],
      why: 'Especially useful when the skin feels red, reactive, or more sensitive during hormonal or stressed phases.',
      tags: ['centella', 'calming', 'redness'],
      amazon: 'https://www.amazon.in/s?k=Centella+Calming+Toner',
      flipkart: 'https://www.flipkart.com/search?q=Centella%20Calming%20Toner',
    },
    {
      id: 'toner-hydrating',
      name: 'Hydrating Hyaluronic Toner',
      bestFor: ['Dry', 'Normal', 'Combination'],
      phases: ['General', 'Menstrual', 'Follicular'],
      why: 'Helps increase water content and supports the skin before serum and moisturiser application.',
      tags: ['hyaluronic', 'prep-step', 'hydration'],
      amazon: 'https://www.amazon.in/s?k=Hydrating+Hyaluronic+Toner',
      flipkart: 'https://www.flipkart.com/search?q=Hydrating%20Hyaluronic%20Toner',
    },
  ],

  'Serum / Treatment': [
    {
      id: 'serum-niacinamide-ordinary',
      name: 'The Ordinary Niacinamide 10% + Zinc 1%',
      bestFor: ['Oily', 'Combination', 'Normal'],
      phases: ['Follicular', 'Ovulatory', 'Luteal', 'General'],
      why: 'Strong for pores, shine, overall oil balance, and building a stable everyday treatment routine.',
      tags: ['niacinamide', 'pores', 'oil-balance'],
      amazon: 'https://www.amazon.in/s?k=The+Ordinary+Niacinamide+10%25+Zinc+1%25',
      flipkart: 'https://www.flipkart.com/search?q=The%20Ordinary%20Niacinamide%2010%25%20Zinc%201%25',
    },
    {
      id: 'serum-bha-paulas-choice',
      name: 'Paula’s Choice 2% BHA Liquid Exfoliant',
      bestFor: ['Oily', 'Combination'],
      phases: ['Luteal', 'Ovulatory', 'General'],
      why: 'Highly useful for blackheads, pore congestion, recurring clogged pores, and pre-period breakout-prone skin.',
      tags: ['bha', 'blackheads', 'congestion'],
      amazon: 'https://www.amazon.in/s?k=Paula%27s+Choice+2%25+BHA+Liquid+Exfoliant',
      flipkart: 'https://www.flipkart.com/search?q=Paula%27s%20Choice%202%25%20BHA%20Liquid%20Exfoliant',
    },
    {
      id: 'serum-azelaic',
      name: 'Azelaic Acid Serum',
      bestFor: ['Sensitive', 'Combination', 'Normal'],
      phases: ['Menstrual', 'Luteal', 'General'],
      why: 'Helpful for redness, acne marks, uneven tone, and users who need a treatment step with lower irritation risk.',
      tags: ['azelaic-acid', 'marks', 'redness'],
      amazon: 'https://www.amazon.in/s?k=Azelaic+Acid+Serum',
      flipkart: 'https://www.flipkart.com/search?q=Azelaic%20Acid%20Serum',
    },
    {
      id: 'serum-vitamin-c',
      name: 'Vitamin C Brightening Serum',
      bestFor: ['Normal', 'Dry', 'Combination'],
      phases: ['Follicular', 'Ovulatory', 'General'],
      why: 'Best used during more stable skin phases when your focus is brightness, radiance, and post-acne mark support.',
      tags: ['vitamin-c', 'brightening', 'glow'],
      amazon: 'https://www.amazon.in/s?k=Vitamin+C+Face+Serum',
      flipkart: 'https://www.flipkart.com/search?q=Vitamin%20C%20Face%20Serum',
    },
    {
      id: 'serum-peptides',
      name: 'Peptide Repair Serum',
      bestFor: ['Dry', 'Sensitive', 'Normal'],
      phases: ['Menstrual', 'Follicular', 'General'],
      why: 'Supports skin recovery, barrier resilience, and smoother-looking texture without the intensity of harsher actives.',
      tags: ['peptides', 'repair', 'support'],
      amazon: 'https://www.amazon.in/s?k=Peptide+Repair+Serum',
      flipkart: 'https://www.flipkart.com/search?q=Peptide%20Repair%20Serum',
    },
  ],

  Moisturiser: [
    {
      id: 'moisturiser-cerave-pm',
      name: 'CeraVe PM Facial Moisturising Lotion',
      bestFor: ['Combination', 'Oily', 'Sensitive', 'Normal'],
      phases: ['General', 'Menstrual', 'Luteal'],
      why: 'A reliable everyday moisturiser when the skin is oily but still needs barrier support and calm after actives.',
      tags: ['night', 'ceramides', 'repair'],
      amazon: 'https://www.amazon.in/s?k=CeraVe+PM+Facial+Moisturizing+Lotion',
      flipkart: 'https://www.flipkart.com/search?q=CeraVe%20PM%20Facial%20Moisturizing%20Lotion',
    },
    {
      id: 'moisturiser-hydro-boost',
      name: 'Neutrogena Hydro Boost Water Gel',
      bestFor: ['Oily', 'Combination', 'Normal'],
      phases: ['Follicular', 'Ovulatory', 'General'],
      why: 'A lightweight hydration option for users who want freshness without a rich cream feel.',
      tags: ['gel', 'hydration', 'lightweight'],
      amazon: 'https://www.amazon.in/s?k=Neutrogena+Hydro+Boost+Water+Gel',
      flipkart: 'https://www.flipkart.com/search?q=Neutrogena%20Hydro%20Boost%20Water%20Gel',
    },
    {
      id: 'moisturiser-barrier-cream',
      name: 'Barrier Repair Cream with Ceramides',
      bestFor: ['Dry', 'Sensitive'],
      phases: ['Menstrual', 'General'],
      why: 'Better during dry or reactive phases when the skin needs a denser moisturising barrier layer.',
      tags: ['barrier', 'dryness', 'repair'],
      amazon: 'https://www.amazon.in/s?k=Ceramide+Barrier+Repair+Cream',
      flipkart: 'https://www.flipkart.com/search?q=Ceramide%20Barrier%20Repair%20Cream',
    },
    {
      id: 'moisturiser-gel-cream',
      name: 'Oil-Free Gel Cream Moisturiser',
      bestFor: ['Oily', 'Combination'],
      phases: ['Luteal', 'General'],
      why: 'Useful for oily periods when a cream feels too heavy but the skin still needs hydration support.',
      tags: ['oil-free', 'gel-cream', 'humidity-friendly'],
      amazon: 'https://www.amazon.in/s?k=Oil+Free+Gel+Cream+Moisturiser',
      flipkart: 'https://www.flipkart.com/search?q=Oil%20Free%20Gel%20Cream%20Moisturiser',
    },
  ],

  'Barrier Repair': [
    {
      id: 'barrier-ceramide-cream',
      name: 'Ceramide Barrier Repair Cream',
      bestFor: ['Dry', 'Sensitive', 'Combination'],
      phases: ['Menstrual', 'General', 'Luteal'],
      why: 'Highly useful when the barrier feels damaged from over-cleansing, strong actives, irritation, or dryness.',
      tags: ['ceramides', 'barrier', 'rescue'],
      amazon: 'https://www.amazon.in/s?k=Ceramide+Barrier+Repair+Cream',
      flipkart: 'https://www.flipkart.com/search?q=Ceramide%20Barrier%20Repair%20Cream',
    },
    {
      id: 'barrier-balm',
      name: 'Cica Recovery Balm',
      bestFor: ['Sensitive', 'Dry'],
      phases: ['Menstrual', 'General'],
      why: 'Good for overnight recovery on red, uncomfortable, flaky, or irritated patches.',
      tags: ['cica', 'overnight', 'recovery'],
      amazon: 'https://www.amazon.in/s?k=Cica+Recovery+Balm',
      flipkart: 'https://www.flipkart.com/search?q=Cica%20Recovery%20Balm',
    },
    {
      id: 'barrier-squalane',
      name: 'Squalane Barrier Serum',
      bestFor: ['Dry', 'Sensitive', 'Normal'],
      phases: ['Menstrual', 'General'],
      why: 'Supports softness and reduces tightness when the skin barrier feels thin or dehydrated.',
      tags: ['squalane', 'softness', 'comfort'],
      amazon: 'https://www.amazon.in/s?k=Squalane+Barrier+Serum',
      flipkart: 'https://www.flipkart.com/search?q=Squalane%20Barrier%20Serum',
    },
  ],

  Sunscreen: [
    {
      id: 'spf-anthelios',
      name: 'La Roche-Posay Anthelios Sunscreen',
      bestFor: ['All'],
      phases: ['General', 'Follicular', 'Ovulatory', 'Luteal', 'Menstrual'],
      why: 'A daily essential for protecting skin from UV damage, helping reduce darkening of acne marks, and preserving treatment progress.',
      tags: ['spf', 'daily-essential', 'protection'],
      amazon: 'https://www.amazon.in/s?k=La+Roche+Posay+Anthelios+Sunscreen',
      flipkart: 'https://www.flipkart.com/search?q=La%20Roche%20Posay%20Anthelios%20Sunscreen',
    },
    {
      id: 'spf-beauty-joseon',
      name: 'Beauty of Joseon Relief Sun',
      bestFor: ['All'],
      phases: ['General', 'Follicular', 'Ovulatory'],
      why: 'A popular lightweight sunscreen option for daily wear, especially when users dislike heavy SPF textures.',
      tags: ['lightweight', 'everyday-spf'],
      amazon: 'https://www.amazon.in/s?k=Beauty+of+Joseon+Relief+Sun',
      flipkart: 'https://www.flipkart.com/search?q=Beauty%20of%20Joseon%20Relief%20Sun',
    },
    {
      id: 'spf-gel',
      name: 'Oil-Free Gel Sunscreen',
      bestFor: ['Oily', 'Combination'],
      phases: ['Luteal', 'General'],
      why: 'Useful for very humid weather or late-cycle oiliness when richer sunscreens are often skipped.',
      tags: ['gel-spf', 'oil-free', 'humidity'],
      amazon: 'https://www.amazon.in/s?k=Oil+Free+Gel+Sunscreen',
      flipkart: 'https://www.flipkart.com/search?q=Oil%20Free%20Gel%20Sunscreen',
    },
  ],

  Exfoliation: [
    {
      id: 'exfoliation-aha',
      name: 'Gentle AHA Exfoliating Serum',
      bestFor: ['Dry', 'Normal', 'Combination'],
      phases: ['Follicular', 'General'],
      why: 'Good for users targeting dullness, uneven texture, and mild roughness during stable skin periods.',
      tags: ['aha', 'texture', 'glow'],
      amazon: 'https://www.amazon.in/s?k=Gentle+AHA+Exfoliating+Serum',
      flipkart: 'https://www.flipkart.com/search?q=Gentle%20AHA%20Exfoliating%20Serum',
    },
    {
      id: 'exfoliation-pha',
      name: 'PHA Exfoliating Toner',
      bestFor: ['Sensitive', 'Dry', 'Combination'],
      phases: ['Follicular', 'General'],
      why: 'A lower-irritation exfoliation route when you want smoother skin without aggressive acid stacking.',
      tags: ['pha', 'gentle', 'renewal'],
      amazon: 'https://www.amazon.in/s?k=PHA+Exfoliating+Toner',
      flipkart: 'https://www.flipkart.com/search?q=PHA%20Exfoliating%20Toner',
    },
    {
      id: 'exfoliation-enzyme',
      name: 'Enzyme Exfoliating Powder',
      bestFor: ['Sensitive', 'Normal', 'Combination'],
      phases: ['General', 'Follicular'],
      why: 'Useful for users who want occasional smoothness and glow with lower friction than scrubs.',
      tags: ['enzyme', 'gentle-polish', 'powder'],
      amazon: 'https://www.amazon.in/s?k=Enzyme+Exfoliating+Powder',
      flipkart: 'https://www.flipkart.com/search?q=Enzyme%20Exfoliating%20Powder',
    },
  ],

  'Retinoid / Night Renewal': [
    {
      id: 'retinoid-beginner',
      name: 'Beginner Retinol Serum',
      bestFor: ['Oily', 'Combination', 'Normal'],
      phases: ['Follicular', 'General'],
      why: 'Strong for long-term improvement in acne marks, texture, and skin renewal when introduced slowly.',
      tags: ['retinol', 'night-care', 'renewal'],
      amazon: 'https://www.amazon.in/s?k=Beginner+Retinol+Serum',
      flipkart: 'https://www.flipkart.com/search?q=Beginner%20Retinol%20Serum',
    },
    {
      id: 'retinal-night-cream',
      name: 'Retinal Night Cream',
      bestFor: ['Normal', 'Combination'],
      phases: ['Follicular', 'General'],
      why: 'Useful when the skin barrier is stable and the user wants a stronger overnight renewal product.',
      tags: ['retinal', 'night-cream', 'anti-marks'],
      amazon: 'https://www.amazon.in/s?k=Retinal+Night+Cream',
      flipkart: 'https://www.flipkart.com/search?q=Retinal%20Night%20Cream',
    },
    {
      id: 'retinoid-sensitive',
      name: 'Sensitive Skin Retinol Lotion',
      bestFor: ['Sensitive', 'Dry', 'Normal'],
      phases: ['General', 'Follicular'],
      why: 'A softer entry point for users who want retinoid support but cannot tolerate strong formulas.',
      tags: ['gentle-retinol', 'slow-introduction'],
      amazon: 'https://www.amazon.in/s?k=Sensitive+Skin+Retinol+Lotion',
      flipkart: 'https://www.flipkart.com/search?q=Sensitive%20Skin%20Retinol%20Lotion',
    },
  ],

  'Mask / Weekly Care': [
    {
      id: 'mask-clay',
      name: 'Clay Mask for Oil & Congestion',
      bestFor: ['Oily', 'Combination'],
      phases: ['Luteal', 'General'],
      why: 'Best as an occasional support step when the skin feels especially congested or oily in the later cycle phase.',
      tags: ['clay', 'weekly-care', 'oil-control'],
      amazon: 'https://www.amazon.in/s?k=Clay+Face+Mask+for+Oily+Skin',
      flipkart: 'https://www.flipkart.com/search?q=Clay%20Face%20Mask%20for%20Oily%20Skin',
    },
    {
      id: 'mask-soothing',
      name: 'Soothing Hydration Mask',
      bestFor: ['Dry', 'Sensitive', 'Normal'],
      phases: ['Menstrual', 'General'],
      why: 'Better when the skin looks tired, tight, or inflamed and needs comfort instead of more exfoliation.',
      tags: ['soothing', 'hydration', 'calming'],
      amazon: 'https://www.amazon.in/s?k=Soothing+Hydrating+Face+Mask',
      flipkart: 'https://www.flipkart.com/search?q=Soothing%20Hydrating%20Face%20Mask',
    },
    {
      id: 'mask-sleeping',
      name: 'Overnight Sleeping Mask',
      bestFor: ['Dry', 'Normal', 'Combination'],
      phases: ['Menstrual', 'Follicular', 'General'],
      why: 'Useful as a weekly hydration and softness booster when skin looks dull or dehydrated.',
      tags: ['sleeping-mask', 'overnight', 'glow'],
      amazon: 'https://www.amazon.in/s?k=Overnight+Sleeping+Mask',
      flipkart: 'https://www.flipkart.com/search?q=Overnight%20Sleeping%20Mask',
    },
  ],

  'Spot Care': [
    {
      id: 'spot-cosrx-patch',
      name: 'COSRX Acne Pimple Master Patch',
      bestFor: ['Oily', 'Combination', 'Sensitive'],
      phases: ['Luteal', 'General'],
      why: 'A practical blemish option because it helps reduce touching and supports cleaner healing.',
      tags: ['patch', 'blemish', 'spot-care'],
      amazon: 'https://www.amazon.in/s?k=COSRX+Acne+Pimple+Master+Patch',
      flipkart: 'https://www.flipkart.com/search?q=COSRX%20Acne%20Pimple%20Master%20Patch',
    },
    {
      id: 'spot-mario',
      name: 'Mario Badescu Drying Lotion',
      bestFor: ['Oily', 'Combination'],
      phases: ['Luteal', 'General'],
      why: 'Useful as targeted overnight care for visible surface-level blemishes.',
      tags: ['targeted', 'overnight', 'drying-lotion'],
      amazon: 'https://www.amazon.in/s?k=Mario+Badescu+Drying+Lotion',
      flipkart: 'https://www.flipkart.com/search?q=Mario%20Badescu%20Drying%20Lotion',
    },
    {
      id: 'spot-sulfur',
      name: 'Sulfur Spot Treatment',
      bestFor: ['Oily', 'Combination', 'Acne-prone'],
      phases: ['Luteal', 'General'],
      why: 'Works well for inflamed pimples and congestion-prone phases when breakouts feel more frequent.',
      tags: ['sulfur', 'blemish', 'anti-inflammatory'],
      amazon: 'https://www.amazon.in/s?k=Sulfur+Spot+Treatment',
      flipkart: 'https://www.flipkart.com/search?q=Sulfur%20Spot%20Treatment',
    },
  ],

  'Eye Care': [
    {
      id: 'eye-caffeine',
      name: 'Caffeine Eye Serum',
      bestFor: ['All'],
      phases: ['General', 'Luteal', 'Menstrual'],
      why: 'Useful when puffiness, under-eye heaviness, or tiredness becomes more visible during low-energy or stressed phases.',
      tags: ['caffeine', 'puffiness', 'eye-care'],
      amazon: 'https://www.amazon.in/s?k=Caffeine+Eye+Serum',
      flipkart: 'https://www.flipkart.com/search?q=Caffeine%20Eye%20Serum',
    },
    {
      id: 'eye-gel',
      name: 'Hydrating Eye Gel',
      bestFor: ['All'],
      phases: ['General', 'Menstrual'],
      why: 'Supports under-eye hydration and comfort when the face looks tired or mildly dehydrated.',
      tags: ['eye-gel', 'hydration'],
      amazon: 'https://www.amazon.in/s?k=Hydrating+Eye+Gel',
      flipkart: 'https://www.flipkart.com/search?q=Hydrating%20Eye%20Gel',
    },
  ],

  'Lip Care': [
    {
      id: 'lip-balm-ceramide',
      name: 'Ceramide Lip Balm',
      bestFor: ['All'],
      phases: ['General', 'Menstrual', 'Luteal'],
      why: 'A simple but important addition when dehydration, dryness, or peeling affects the lips during hormonal or seasonal changes.',
      tags: ['lip-balm', 'repair', 'dryness'],
      amazon: 'https://www.amazon.in/s?k=Ceramide+Lip+Balm',
      flipkart: 'https://www.flipkart.com/search?q=Ceramide%20Lip%20Balm',
    },
    {
      id: 'lip-mask',
      name: 'Overnight Lip Mask',
      bestFor: ['All'],
      phases: ['General', 'Menstrual'],
      why: 'Useful for deeper lip softness and overnight recovery when standard balm is not enough.',
      tags: ['overnight', 'lip-mask'],
      amazon: 'https://www.amazon.in/s?k=Overnight+Lip+Mask',
      flipkart: 'https://www.flipkart.com/search?q=Overnight%20Lip%20Mask',
    },
  ],

  'Mist / Hydration Boost': [
    {
      id: 'mist-thermal-water',
      name: 'Thermal Water Mist',
      bestFor: ['Sensitive', 'Normal', 'Dry'],
      phases: ['Menstrual', 'General'],
      why: 'Useful for quick calming and comfort when skin feels heated, dry, or reactive during the day.',
      tags: ['mist', 'calming', 'refresh'],
      amazon: 'https://www.amazon.in/s?k=Thermal+Water+Mist',
      flipkart: 'https://www.flipkart.com/search?q=Thermal%20Water%20Mist',
    },
    {
      id: 'mist-hydrating',
      name: 'Hydrating Facial Mist',
      bestFor: ['Dry', 'Normal', 'Combination'],
      phases: ['General', 'Follicular'],
      why: 'A helpful midday hydration layer when the skin tends to lose freshness throughout the day.',
      tags: ['facial-mist', 'midday-hydration'],
      amazon: 'https://www.amazon.in/s?k=Hydrating+Facial+Mist',
      flipkart: 'https://www.flipkart.com/search?q=Hydrating%20Facial%20Mist',
    },
  ],

  'Body Care': [
    {
      id: 'body-lotion-urea',
      name: 'Urea Body Lotion',
      bestFor: ['Dry', 'Sensitive', 'Normal'],
      phases: ['General', 'Menstrual'],
      why: 'Useful when body skin also feels rough, dry, or dull and needs stronger moisture support.',
      tags: ['body-care', 'urea', 'dryness'],
      amazon: 'https://www.amazon.in/s?k=Urea+Body+Lotion',
      flipkart: 'https://www.flipkart.com/search?q=Urea%20Body%20Lotion',
    },
    {
      id: 'body-wash-gentle',
      name: 'Gentle Body Wash',
      bestFor: ['Sensitive', 'Dry', 'Normal'],
      phases: ['General'],
      why: 'A good body-care add-on for users who experience dryness or irritation beyond the face.',
      tags: ['body-wash', 'gentle'],
      amazon: 'https://www.amazon.in/s?k=Gentle+Body+Wash',
      flipkart: 'https://www.flipkart.com/search?q=Gentle%20Body%20Wash',
    },
  ],

  'Tools / Accessories': [
    {
      id: 'tools-headband',
      name: 'Soft Skincare Headband',
      bestFor: ['All'],
      phases: ['General'],
      why: 'Improves daily routine convenience and helps keep hair away during cleansing and treatment steps.',
      tags: ['accessory', 'routine-tool'],
      amazon: 'https://www.amazon.in/s?k=Skincare+Headband',
      flipkart: 'https://www.flipkart.com/search?q=Skincare%20Headband',
    },
    {
      id: 'tools-silicone-brush',
      name: 'Silicone Mask Applicator',
      bestFor: ['All'],
      phases: ['General'],
      why: 'Useful for cleaner weekly mask application and less product waste.',
      tags: ['mask-tool', 'clean-application'],
      amazon: 'https://www.amazon.in/s?k=Silicone+Mask+Applicator',
      flipkart: 'https://www.flipkart.com/search?q=Silicone%20Mask%20Applicator',
    },
    {
      id: 'tools-ice-roller',
      name: 'Ice Roller / Cooling Face Tool',
      bestFor: ['All'],
      phases: ['Menstrual', 'Luteal', 'General'],
      why: 'Can help temporarily reduce puffiness and give a cooling effect when the face feels heavy or inflamed.',
      tags: ['cooling', 'puffiness', 'tool'],
      amazon: 'https://www.amazon.in/s?k=Ice+Roller+for+Face',
      flipkart: 'https://www.flipkart.com/search?q=Ice%20Roller%20for%20Face',
    },
  ],
};

const openUrl = async (url) => {
  if (!url) return;
  try {
    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Link unavailable', 'Unable to open this product link.');
    }
  } catch (error) {
    Alert.alert('Link error', 'Could not open the product link right now.');
  }
};

const ProductCard = ({ product, accent }) => (
  <View style={[styles.productCard, { borderColor: `${accent}33` }]}>
    <View style={styles.productTopRow}>
      <View style={[styles.productAccentBar, { backgroundColor: accent }]} />
      <View style={styles.productTagsWrap}>
        {product.tags.slice(0, 3).map((tag) => (
          <View key={tag} style={styles.tagChip}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>

    <Text style={styles.productName}>{product.name}</Text>
    <Text style={styles.productWhy}>{product.why}</Text>

    <View style={styles.linksRow}>
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.linkButtonAmazon}
        onPress={() => openUrl(product.amazon)}
      >
        <Text style={styles.linkButtonText}>Amazon</Text>
        <Feather name="external-link" size={14} color="#0f1419" />
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.linkButtonFlipkart}
        onPress={() => openUrl(product.flipkart)}
      >
        <Text style={styles.linkButtonTextLight}>Flipkart</Text>
        <Feather name="external-link" size={14} color="#dff5ff" />
      </TouchableOpacity>
    </View>
  </View>
);

export default function ProductRecommendationsScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [cycleData, setCycleData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [profileRes, cycleRes] = await Promise.allSettled([
        api.get('/api/profile'),
        api.get('/api/menstrual-settings'),
      ]);

      if (profileRes.status === 'fulfilled') {
        setProfile(profileRes.value?.data || null);
      }

      if (cycleRes.status === 'fulfilled') {
        setCycleData(cycleRes.value?.data || null);
      } else {
        setCycleData(null);
      }
    } catch (error) {
      Alert.alert('Loading failed', 'Unable to load recommendation data right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const skinType = useMemo(() => {
    return profile?.skin_type || 'Combination';
  }, [profile]);

  const gender = useMemo(() => {
    return String(profile?.gender || '').trim().toLowerCase();
  }, [profile]);

  const cyclePhase = useMemo(() => {
    if (!cycleData?.predicted_phase) return 'General';
    return cycleData.predicted_phase;
  }, [cycleData]);

  const pmsSeverity = useMemo(() => {
    return cycleData?.pms_severity || 'Moderate';
  }, [cycleData]);

  const recommendationsByCategory = useMemo(() => {
    const result = {};

    CATEGORY_ORDER.forEach((category) => {
      const source = PRODUCT_LIBRARY[category] || [];

      const filtered = source.filter((product) => {
        const bestFor = product.bestFor || [];
        const phases = product.phases || [];

        const skinMatch =
          bestFor.includes('All') ||
          bestFor.includes(skinType) ||
          (skinType === 'Sensitive' && bestFor.includes('Sensitive'));

        const phaseMatch =
          gender === 'male' ||
          phases.includes('General') ||
          phases.includes(cyclePhase);

        return skinMatch && phaseMatch;
      });

      result[category] = filtered.slice(0, 5);
    });

    return result;
  }, [skinType, cyclePhase, gender]);

  const insightText = useMemo(() => {
    if (gender === 'male') {
      return `These product recommendations are tailored primarily around your saved skin type, with emphasis on daily barrier support, balanced cleansing, hydration, oil control, and long-term routine consistency. Since menstrual-phase adaptation is not required for this profile, the logic focuses only on visible skin needs and routine suitability.`;
    }

    return `These products are selected using both your saved skin type and your menstrual details. The app is currently adapting suggestions for the ${cyclePhase} phase, which changes product emphasis depending on whether your skin is more likely to be sensitive, balanced, brighter, oilier, more congested, or more breakout-prone during this point in your cycle. PMS severity is currently set to ${pmsSeverity}, so late-cycle congestion and hormonal support are weighted more strongly when relevant.`;
  }, [gender, cyclePhase, pmsSeverity]);

  const categoryAccent = {
    Cleanser: '#8fd3ff',
    'Toner / Essence': '#8fe0ff',
    'Serum / Treatment': '#c9b6ff',
    Moisturiser: '#9ee6c0',
    'Barrier Repair': '#7ce0cf',
    Sunscreen: '#ffd48e',
    Exfoliation: '#f6b6d2',
    'Retinoid / Night Renewal': '#d2b8ff',
    'Mask / Weekly Care': '#f2a9c2',
    'Spot Care': '#ff9c8a',
    'Eye Care': '#b4c9ff',
    'Lip Care': '#ffb3c0',
    'Mist / Hydration Boost': '#9adff5',
    'Body Care': '#b8e3a2',
    'Tools / Accessories': '#d6d3d1',
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#8fd3ff" />
        <Text style={styles.loadingText}>Loading personalised recommendations...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color="#dbeaf3" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.heroCard}>
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="shopping-search-outline" size={14} color="#8fd3ff" />
            <Text style={styles.heroBadgeText}>PERSONALISED PRODUCTS</Text>
          </View>

          <Text style={styles.heroTitle}>Recommendations for your skin</Text>
          <Text style={styles.heroSubtitle}>{insightText}</Text>

          <View style={styles.profileInfoRow}>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillText}>Skin Type: {skinType}</Text>
            </View>
            {gender !== 'male' && (
              <View style={styles.infoPill}>
                <Text style={styles.infoPillText}>Cycle Phase: {cyclePhase}</Text>
              </View>
            )}
          </View>
        </View>

        {CATEGORY_ORDER.map((category) => {
          const products = recommendationsByCategory[category];
          const accent = categoryAccent[category] || '#8fd3ff';

          if (!products || !products.length) return null;

          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeaderRow}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={[styles.categoryAccentDot, { backgroundColor: accent }]} />
              </View>

              <Text style={styles.categorySubtitle}>
                Carefully selected products for this part of your routine.
              </Text>

              <View style={styles.productsGrid}>
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    accent={accent}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={18} color="#9eb8c8" />
          <Text style={styles.footerNoteText}>
            Marketplace listings can change over time. These Amazon and Flipkart buttons open relevant product or search pages so you can compare pricing, sellers, and availability before purchase.
          </Text>
        </View>

        <View style={{ height: Platform.OS === 'web' ? 20 : 28 }} />
      </ScrollView>
    </View>
  );
}

const cardWidth = width >= 1100 ? '48.8%' : '100%';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0a0e13',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: '#0a0e13',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#dce7ef',
    fontSize: 15,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    color: '#dbeaf3',
    fontSize: 15,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#111820',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#1f2a34',
    padding: 18,
    marginBottom: 20,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#15202b',
    borderWidth: 1,
    borderColor: '#273442',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 14,
  },
  heroBadgeText: {
    color: '#8fd3ff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#f4f8fb',
    fontSize: 30,
    fontWeight: '900',
    marginBottom: 10,
  },
  heroSubtitle: {
    color: '#a8b8c5',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  profileInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  infoPill: {
    backgroundColor: '#0d1319',
    borderWidth: 1,
    borderColor: '#202a34',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  infoPillText: {
    color: '#d9e7ef',
    fontSize: 12,
    fontWeight: '700',
  },
  categorySection: {
    marginBottom: 22,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryTitle: {
    color: '#f4f8fb',
    fontSize: 22,
    fontWeight: '900',
  },
  categoryAccentDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  categorySubtitle: {
    color: '#91a4b5',
    fontSize: 13,
    marginBottom: 14,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  productCard: {
    width: cardWidth,
    backgroundColor: '#0f141a',
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    minHeight: 252,
  },
  productTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  productAccentBar: {
    width: 6,
    height: 32,
    borderRadius: 999,
  },
  productTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  tagChip: {
    backgroundColor: '#16212a',
    borderWidth: 1,
    borderColor: '#23303b',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagText: {
    color: '#b9cad6',
    fontSize: 11,
    fontWeight: '700',
  },
  productName: {
    color: '#f4f8fb',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 10,
  },
  productWhy: {
    color: '#a9b8c5',
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 16,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 'auto',
  },
  linkButtonAmazon: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#d6e6f2',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  linkButtonFlipkart: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: '#16324d',
    borderWidth: 1,
    borderColor: '#24486b',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  linkButtonText: {
    color: '#0f1419',
    fontSize: 14,
    fontWeight: '900',
  },
  linkButtonTextLight: {
    color: '#dff5ff',
    fontSize: 14,
    fontWeight: '900',
  },
  footerNote: {
    backgroundColor: '#111820',
    borderWidth: 1,
    borderColor: '#1f2a34',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  footerNoteText: {
    flex: 1,
    color: '#9eb8c8',
    fontSize: 13,
    lineHeight: 20,
  },
});